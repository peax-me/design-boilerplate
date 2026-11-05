import { expect, type Page, test } from "@playwright/test";
import {
  type AmbientPair,
  type CanvasFrame,
  findBlankCanvases,
  findFrozenCanvases,
  findRenderErrors,
  type MotionViolation,
} from "@repo/design-audit/motion";

import { auditProgress } from "./support/canvas-capture.ts";
import { nudgeScroll, settle, visitProgressions } from "./support/page-walk.ts";
import { routes } from "./support/routes.ts";
import { renderedStageNames, waitForStagesInWindow } from "./support/stages.ts";

/* With motion allowed, scenes are inserted within about 4 s of the load under software rendering (2.2 s measured): reduced motion is held for twice that after the last scroll. */
const REDUCED_MOTION_HOLD_MS = 8000;

/* Every level: three logs a lost context as a plain log. Only WebGL and shader messages fail the audit (findRenderErrors). */
function recordConsoleMessages(page: Page): string[] {
  const messages: string[] = [];
  page.on("console", (message) => {
    messages.push(message.text());
  });
  page.on("pageerror", (error) => {
    messages.push(error.message);
  });
  return messages;
}

async function recordCanvasInsertions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let insertions = 0;
    new MutationObserver((records) => {
      for (const { addedNodes } of records) {
        for (const node of addedNodes) {
          if (node instanceof Element && (node.matches("canvas") || node.querySelector("canvas"))) {
            insertions += 1;
          }
        }
      }
    }).observe(document, { childList: true, subtree: true });
    Object.defineProperty(window, "insertedCanvases", { get: () => insertions });
  });
}

function countCanvasInsertions(page: Page): Promise<number> {
  return page.evaluate(() => Number(Reflect.get(window, "insertedCanvases")));
}

/* The probe context is released at once, so the page's own stages keep the browser's contexts to themselves. */
function readRenderer(page: Page): Promise<string> {
  return page.evaluate(() => {
    const context = new OffscreenCanvas(1, 1).getContext("webgl2");
    const extension = context?.getExtension("WEBGL_debug_renderer_info");
    const renderer =
      context === null || extension === null || extension === undefined
        ? "unknown"
        : String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL));
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return renderer;
  });
}

/* A page that never audits a stage passes vacuously: every stage the viewport renders must have been audited at least once. */
async function expectEveryStageAudited(
  page: Page,
  route: string,
  frames: CanvasFrame[],
): Promise<void> {
  expect(new Set(frames.map(({ canvas }) => canvas))).toEqual(
    new Set(await renderedStageNames(page, route)),
  );
}

/* A canvas frozen at every progression is one finding, not one per progression. */
function onePerCanvas(violations: MotionViolation[]): MotionViolation[] {
  return [...new Map(violations.map((violation) => [violation.canvas, violation])).values()];
}

for (const route of routes) {
  test.describe(`${route} with motion`, () => {
    test.use({ contextOptions: { reducedMotion: "no-preference" } });

    test("keeps every live canvas drawn, moving and free of render errors", async ({
      page,
    }, testInfo) => {
      /* Without a GPU every frame is drawn on the CPU, and the three projects run side by side. */
      test.slow();
      const consoleMessages = recordConsoleMessages(page);
      const frames: CanvasFrame[] = [];
      const ambientPairs: AmbientPair[] = [];
      try {
        await page.goto(route);
        testInfo.annotations.push({ type: "renderer", description: await readRenderer(page) });
        await waitForStagesInWindow(page, { nudging: true });
        await visitProgressions(page, async (progress) => {
          const capture = await auditProgress(page, testInfo, { route, progress });
          frames.push(...capture.frames);
          ambientPairs.push(...capture.ambientPairs);
        });

        await expectEveryStageAudited(page, route, frames);
        expect([
          ...findBlankCanvases(frames),
          ...onePerCanvas(findFrozenCanvases(ambientPairs)),
        ]).toEqual([]);
      } finally {
        expect.soft(findRenderErrors(consoleMessages)).toEqual([]);
      }
    });
  });

  test.describe(`${route} with reduced motion`, () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("never inserts a canvas, whatever the visitor does", async ({ page }) => {
      await recordCanvasInsertions(page);
      await page.goto(route);
      await nudgeScroll(page);
      await visitProgressions(page, () => settle(page));
      await page.waitForTimeout(REDUCED_MOTION_HOLD_MS);

      expect(await countCanvasInsertions(page)).toBe(0);
      await expect(page.locator("canvas")).toHaveCount(0);
    });
  });
}
