import { expect, type Page, test, type TestInfo } from "@playwright/test";
import { collectLuminance } from "@repo/design-audit/collect";
import {
  AMBIENT_INTERVAL_MS,
  type AmbientPair,
  type CanvasFrame,
  findBlankCanvases,
  findFrozenCanvases,
  findRenderErrors,
} from "@repo/design-audit/motion";

import { routes } from "./support/routes.ts";

const PROGRESSIONS = [0, 0.25, 0.5, 0.75, 1];
const LUMINANCE_GRID = 32;
const SETTLE_MS = 300;
const LIVE_TIMEOUT_MS = 20_000;
const IDLE_DEADLINE_MS = 2000;

interface LiveCanvas {
  name: string;
  clip: { x: number; y: number; width: number; height: number };
  ambient: boolean;
}

interface ProgressCapture {
  frames: CanvasFrame[];
  ambientPairs: AmbientPair[];
}

function recordConsoleProblems(page: Page): string[] {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      messages.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    messages.push(error.message);
  });
  return messages;
}

/* Scrolling is the first interaction that loads a scene on light devices. It is repeated until the page, still hydrating, listens for it. */
async function nudgeScroll(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, window.scrollY === 0 ? 1 : 0);
  });
}

function everyStageInWindowIsLive(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-slot=stage]")]
      .filter((stage) => {
        const { top, bottom } = stage.getBoundingClientRect();
        return bottom > 0 && top < window.innerHeight;
      })
      .every((stage) => stage.dataset["stage"] === "live"),
  );
}

async function waitForStagesInWindow(page: Page): Promise<void> {
  await expect.poll(() => everyStageInWindowIsLive(page), { timeout: LIVE_TIMEOUT_MS }).toBe(true);
}

/* The fixed progressions can all miss a stage between two of them: each stage also gets the scroll position that centres it in the window. */
function stageProgressions(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    return [...document.querySelectorAll("[data-slot=stage]")].map((stage) => {
      const { top, height } = stage.getBoundingClientRect();
      const centred = window.scrollY + top + height / 2 - window.innerHeight / 2;
      return Math.round(Math.min(Math.max(centred / scrollable, 0), 1) * 1000) / 1000;
    });
  });
}

async function scrollToProgress(page: Page, progress: number): Promise<void> {
  const target = await page.evaluate((fraction) => {
    const top = Math.round(fraction * (document.documentElement.scrollHeight - window.innerHeight));
    window.scrollTo(0, top);
    return top;
  }, progress);
  await page.waitForFunction((top) => Math.abs(window.scrollY - top) < 2, target);
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  });
  await page.waitForTimeout(SETTLE_MS);
}

async function visibleLiveCanvases(page: Page, route: string): Promise<LiveCanvas[]> {
  const canvases = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-slot=stage]")].flatMap((stage, index) => {
      const canvas = stage.querySelector("canvas");
      if (stage.dataset["stage"] !== "live" || canvas === null) {
        return [];
      }
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(rect.left, 0);
      const y = Math.max(rect.top, 0);
      const width = Math.min(rect.right, window.innerWidth) - x;
      const height = Math.min(rect.bottom, window.innerHeight) - y;
      if (width <= 0 || height <= 0) {
        return [];
      }
      const ambient = Object.hasOwn(stage.dataset, "ambient");
      return [{ index, clip: { x, y, width, height }, ambient }];
    }),
  );
  return canvases.map(({ index, clip, ambient }) => ({
    name: `${route} stage ${index}`,
    clip,
    ambient,
  }));
}

async function captureLuminance(page: Page, clip: LiveCanvas["clip"]): Promise<number[]> {
  const png = await page.screenshot({ clip, scale: "css" });
  return page.evaluate(collectLuminance, {
    png: `data:image/png;base64,${png.toString("base64")}`,
    size: LUMINANCE_GRID,
  });
}

async function auditProgress(
  page: Page,
  testInfo: TestInfo,
  { route, progress }: { route: string; progress: number },
): Promise<ProgressCapture> {
  await scrollToProgress(page, progress);
  await waitForStagesInWindow(page);
  await settle(page);

  const canvases = await visibleLiveCanvases(page, route);
  const captures = await Promise.all(
    canvases.map(async (canvas) => ({
      canvas,
      luminance: await captureLuminance(page, canvas.clip),
    })),
  );
  await testInfo.attach(`frame-${progress}`, {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  });

  const ambient = captures.filter(({ canvas }) => canvas.ambient);
  if (ambient.length > 0) {
    await page.waitForTimeout(AMBIENT_INTERVAL_MS);
  }
  const ambientPairs = await Promise.all(
    ambient.map(async ({ canvas, luminance }) => ({
      canvas: canvas.name,
      first: luminance,
      second: await captureLuminance(page, canvas.clip),
    })),
  );

  return {
    frames: captures.map(({ canvas, luminance }) => ({ canvas: canvas.name, progress, luminance })),
    ambientPairs,
  };
}

function readRenderer(page: Page): Promise<string> {
  return page.evaluate(() => {
    const context = new OffscreenCanvas(1, 1).getContext("webgl2");
    const extension = context?.getExtension("WEBGL_debug_renderer_info");
    if (context === null || extension === null || extension === undefined) {
      return "unknown";
    }
    return String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL));
  });
}

async function waitForIdle(page: Page): Promise<void> {
  await page.evaluate(async (timeout) => {
    await new Promise((resolve) => {
      requestIdleCallback(resolve, { timeout });
    });
  }, IDLE_DEADLINE_MS);
}

for (const route of routes) {
  test.describe(`${route} with motion`, () => {
    test.use({ reducedMotion: "no-preference" });

    test("keeps every live canvas drawn, moving and free of render errors", async ({
      page,
    }, testInfo) => {
      /* Without a GPU every frame is drawn on the CPU, and the three projects run side by side. */
      test.slow();
      const consoleProblems = recordConsoleProblems(page);
      await page.goto(route);
      await expect
        .poll(
          async () => {
            await nudgeScroll(page);
            return everyStageInWindowIsLive(page);
          },
          { timeout: LIVE_TIMEOUT_MS },
        )
        .toBe(true);

      const progressions = [
        ...new Set([...PROGRESSIONS, ...(await stageProgressions(page))]),
      ].toSorted((first, second) => first - second);
      const frames: CanvasFrame[] = [];
      const ambientPairs: AmbientPair[] = [];
      for (const progress of progressions) {
        // oxlint-disable-next-line no-await-in-loop -- the audit walks the page in order: each scroll position follows the previous one.
        const capture = await auditProgress(page, testInfo, { route, progress });
        frames.push(...capture.frames);
        ambientPairs.push(...capture.ambientPairs);
      }

      testInfo.annotations.push({ type: "renderer", description: await readRenderer(page) });
      expect([
        ...findBlankCanvases(frames),
        ...findFrozenCanvases(ambientPairs),
        ...findRenderErrors(consoleProblems),
      ]).toEqual([]);
    });
  });

  test.describe(`${route} with reduced motion`, () => {
    test.use({ reducedMotion: "reduce" });

    test("never creates a canvas", async ({ page }) => {
      await page.goto(route);
      await waitForIdle(page);
      await expect(page.locator("canvas")).toHaveCount(0);
    });
  });
}
