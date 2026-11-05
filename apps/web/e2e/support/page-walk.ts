import { expect, type Page } from "@playwright/test";

const PROGRESSIONS = [0, 0.25, 0.5, 0.75, 1];
const SETTLE_MS = 300;
/* An animation that never finishes (paused, or restarted by the page) cannot hold the walk for longer. */
const FINISH_TIMEOUT_MS = 3000;
const SCROLL_TIMEOUT_MS = 5000;
const SCROLL_TOLERANCE_PX = 2;

/* Scrolling is the first interaction that loads a scene on light devices. It is repeated until the page, still hydrating, listens for it. */
export async function nudgeScroll(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, window.scrollY === 0 ? 1 : 0);
  });
}

/* The fixed progressions can all miss a stage between two of them: each stage also gets the scroll position that centres it in the window. */
async function progressionsOf(page: Page): Promise<number[]> {
  const stageProgressions = await page.evaluate(() => {
    const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    return [...document.querySelectorAll("[data-slot=stage]")].map((stage) => {
      const { top, height } = stage.getBoundingClientRect();
      const centred = window.scrollY + top + height / 2 - window.innerHeight / 2;
      return Math.round(Math.min(Math.max(centred / scrollable, 0), 1) * 1000) / 1000;
    });
  });
  return [...new Set([...PROGRESSIONS, ...stageProgressions])].toSorted(
    (first, second) => first - second,
  );
}

async function scrollToProgress(page: Page, progress: number): Promise<void> {
  const target = await page.evaluate((fraction) => {
    const top = Math.round(fraction * (document.documentElement.scrollHeight - window.innerHeight));
    window.scrollTo(0, top);
    return top;
  }, progress);
  await expect
    .poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - target), {
      message: `The window never scrolled to ${target}px`,
      timeout: SCROLL_TIMEOUT_MS,
    })
    .toBeLessThan(SCROLL_TOLERANCE_PX);
}

export async function visitProgressions(
  page: Page,
  visit: (progress: number) => Promise<void>,
): Promise<void> {
  for (const progress of await progressionsOf(page)) {
    // oxlint-disable-next-line no-await-in-loop -- the audit walks the page in order: each scroll position follows the previous one.
    await scrollToProgress(page, progress);
    // oxlint-disable-next-line no-await-in-loop -- same walk: a position is visited before the next scroll.
    await visit(progress);
  }
}

/* A stage fades between its poster and its scene over 500 ms: a capture taken mid-fade shows both. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(async (finishTimeout) => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
    const finite = document
      .getAnimations()
      .filter((animation) =>
        Number.isFinite(Number(animation.effect?.getComputedTiming().endTime)),
      );
    await Promise.race([
      Promise.allSettled(finite.map((animation) => animation.finished)),
      new Promise((resolve) => {
        setTimeout(resolve, finishTimeout);
      }),
    ]);
  }, FINISH_TIMEOUT_MS);
  await page.waitForTimeout(SETTLE_MS);
}
