import { expect, type Page } from "@playwright/test";

import { nudgeScroll } from "./page-walk.ts";

const LIVE_TIMEOUT_MS = 20_000;

export interface Clip {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LiveCanvas {
  name: string;
  clip: Clip;
  ambient: boolean;
}

interface WindowStage {
  index: number;
  state: string;
  ambient: boolean;
  canvasClip: Clip | null;
}

export function stageName(route: string, index: number): string {
  return `${route} stage ${index}`;
}

/* The one rule for "in the window": stages loading, waited for and audited all agree on it. */
function readStagesInWindow(page: Page): Promise<WindowStage[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-slot=stage]")].flatMap((stage, index) => {
      const { top, bottom } = stage.getBoundingClientRect();
      if (bottom <= 0 || top >= window.innerHeight) {
        return [];
      }
      const state = stage.dataset["stage"] ?? "unknown";
      const ambient = Object.hasOwn(stage.dataset, "ambient");
      const canvas = stage.querySelector("canvas");
      if (canvas === null) {
        return [{ index, state, ambient, canvasClip: null }];
      }
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(rect.left, 0);
      const y = Math.max(rect.top, 0);
      const width = Math.min(rect.right, window.innerWidth) - x;
      const height = Math.min(rect.bottom, window.innerHeight) - y;
      const canvasClip = width > 0 && height > 0 ? { x, y, width, height } : null;
      return [{ index, state, ambient, canvasClip }];
    }),
  );
}

async function stagesNotLive(page: Page): Promise<string[]> {
  const stages = await readStagesInWindow(page);
  return stages
    .filter(({ state }) => state !== "live")
    .map(({ index, state }) => `stage ${index} is ${state}`);
}

export async function waitForStagesInWindow(
  page: Page,
  { nudging }: { nudging: boolean },
): Promise<void> {
  await expect
    .poll(
      async () => {
        if (nudging) {
          await nudgeScroll(page);
        }
        return stagesNotLive(page);
      },
      { message: "Stages in the window never went live", timeout: LIVE_TIMEOUT_MS },
    )
    .toEqual([]);
}

export async function visibleLiveCanvases(page: Page, route: string): Promise<LiveCanvas[]> {
  const stages = await readStagesInWindow(page);
  return stages.flatMap(({ index, state, ambient, canvasClip }) =>
    state === "live" && canvasClip !== null
      ? [{ name: stageName(route, index), clip: canvasClip, ambient }]
      : [],
  );
}
