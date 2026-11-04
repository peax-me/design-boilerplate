import type { Page, TestInfo } from "@playwright/test";
import { collectLuminance } from "@repo/design-audit/collect";
import { AMBIENT_INTERVAL_MS, type AmbientPair, type CanvasFrame } from "@repo/design-audit/motion";

import { settle } from "./page-walk.ts";
import { type Clip, visibleLiveCanvases, waitForStagesInWindow } from "./stages.ts";

const LUMINANCE_GRID = 32;
/* Only what a canvas draws is measured: it overflows its stage over neighbouring content, and the page behind it carries a grid. */
const CANVAS_ONLY =
  "* { visibility: hidden !important } canvas { visibility: visible !important } html { background: none !important }";

interface ProgressCapture {
  frames: CanvasFrame[];
  ambientPairs: AmbientPair[];
}

async function captureLuminance(page: Page, clip: Clip): Promise<number[]> {
  const png = await page.screenshot({ clip, scale: "css", style: CANVAS_ONLY });
  return page.evaluate(collectLuminance, {
    png: `data:image/png;base64,${png.toString("base64")}`,
    size: LUMINANCE_GRID,
  });
}

export async function auditProgress(
  page: Page,
  testInfo: TestInfo,
  { route, progress }: { route: string; progress: number },
): Promise<ProgressCapture> {
  await waitForStagesInWindow(page, { nudging: false });
  await settle(page);

  const canvases = await visibleLiveCanvases(page, route);
  const captures = await Promise.all(
    canvases.map(async (canvas) => ({
      canvas,
      luminance: await captureLuminance(page, canvas.clip),
    })),
  );

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
  await testInfo.attach(`frame-${progress}`, {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  });

  return {
    frames: captures.map(({ canvas, luminance }) => ({ canvas: canvas.name, progress, luminance })),
    ambientPairs,
  };
}
