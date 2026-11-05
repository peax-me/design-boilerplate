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

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface WindowStage {
  index: number;
  state: string;
  ambient: boolean;
  canvas: Box | null;
  window: { width: number; height: number };
}

function stageName(route: string, index: number): string {
  return `${route} stage ${index}`;
}

/* A sliver at the window's edge reads as blank: a canvas is audited only once at least half of it, or half the window, is in view on each axis. */
function auditableClip(canvas: Box, view: WindowStage["window"]): Clip | null {
  const x = Math.max(canvas.left, 0);
  const y = Math.max(canvas.top, 0);
  const width = Math.min(canvas.right, view.width) - x;
  const height = Math.min(canvas.bottom, view.height) - y;
  const wideEnough = width >= Math.min(canvas.right - canvas.left, view.width) / 2;
  const tallEnough = height >= Math.min(canvas.bottom - canvas.top, view.height) / 2;
  return width > 0 && height > 0 && wideEnough && tallEnough ? { x, y, width, height } : null;
}

/* The one rule for "in the window": stages loading, waited for and audited all agree on it. */
function readStagesInWindow(page: Page): Promise<WindowStage[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-slot=stage]")].flatMap((stage, index) => {
      const { top, bottom } = stage.getBoundingClientRect();
      if (bottom <= 0 || top >= window.innerHeight) {
        return [];
      }
      const rect = stage.querySelector("canvas")?.getBoundingClientRect();
      const canvas =
        rect === undefined
          ? null
          : { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      return [
        {
          index,
          state: stage.dataset["stage"] ?? "unknown",
          ambient: Object.hasOwn(stage.dataset, "ambient"),
          canvas,
          window: { width: window.innerWidth, height: window.innerHeight },
        },
      ];
    }),
  );
}

/* Stages a viewport renders: one hidden at a breakpoint is not expected to be audited there. */
export async function renderedStageNames(page: Page, route: string): Promise<string[]> {
  const indexes = await page.evaluate(() =>
    [...document.querySelectorAll("[data-slot=stage]")].flatMap((stage, index) =>
      stage.checkVisibility() ? [index] : [],
    ),
  );
  return indexes.map((index) => stageName(route, index));
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
  return stages.flatMap(({ index, state, ambient, canvas, window: view }) => {
    const clip = state === "live" && canvas !== null ? auditableClip(canvas, view) : null;
    return clip === null ? [] : [{ name: stageName(route, index), clip, ambient }];
  });
}
