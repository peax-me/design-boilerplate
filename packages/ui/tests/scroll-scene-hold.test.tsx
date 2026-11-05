import "../src/styles/globals.css";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { ScrollScene } from "../src/motion/scroll-scene.tsx";
import { sceneLength } from "../src/motion/tokens.ts";
import { declaredValues } from "./support/declared-values.ts";
import { DESKTOP } from "./support/viewports.ts";

type Choreography = (timeline: gsap.core.Timeline) => void;

/* Not in the DOM typings yet: https://wicg.github.io/layout-instability/#sec-layout-shift */
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

/* A quarter window per step: every position of the hold is laid out and painted. */
const STEPS_PER_WINDOW = 4;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

async function scrollToSettled(y: number): Promise<void> {
  window.scrollTo(0, y);
  await nextFrame();
  await nextFrame();
}

async function scrollThrough(from: number, to: number): Promise<void> {
  await scrollToSettled(from);
  if (from < to) {
    await scrollThrough(Math.min(from + window.innerHeight / STEPS_PER_WINDOW, to), to);
  }
}

function isLayoutShift(entry: PerformanceEntry): entry is LayoutShift {
  return entry.entryType === "layout-shift";
}

/* Layout shifts the visitor did not cause, summed as CLS sums them. */
function recordLayoutShifts(): () => number {
  const shifts: LayoutShift[] = [];
  function keep(entries: PerformanceEntryList): void {
    shifts.push(...entries.filter((entry) => isLayoutShift(entry)));
  }
  const observer = new PerformanceObserver((list) => {
    keep(list.getEntries());
  });
  observer.observe({ type: "layout-shift" });
  return () => {
    keep(observer.takeRecords());
    observer.disconnect();
    return shifts
      .filter((shift) => !shift.hadRecentInput)
      .reduce((total, shift) => total + shift.value, 0);
  };
}

/* The scene between a window of page above and below it, as on a real page. */
function onPage(scene: ReactNode) {
  return (
    <>
      <div style={{ height: "100vh" }} />
      {scene}
      <div style={{ height: "100vh" }} />
    </>
  );
}

function pageTopOf(container: HTMLElement): number {
  const scene = container.querySelector("[data-slot='scroll-scene']");
  return (scene?.getBoundingClientRect().top ?? 0) + window.scrollY;
}

beforeEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

afterEach(() => {
  window.scrollTo(0, 0);
});

describe("ScrollScene hold", () => {
  it.each(["all", "md"] as const)(
    "sizes its stage and its holds in small-viewport units from the %s breakpoint, so a collapsing toolbar keeps the scrub in step with the hold",
    async (minWidth) => {
      const screen = await render(
        <ScrollScene choreography={vi.fn<Choreography>()} minWidth={minWidth} length="long">
          <p>Measured content</p>
        </ScrollScene>,
      );
      const stageAndHolds = [
        ...screen.container.querySelectorAll("[data-slot='scroll-scene'] > div"),
      ];

      expect(stageAndHolds.map((part) => declaredValues(part, "height"))).toEqual(
        Array.from({ length: 1 + sceneLength.long }, () => ["100svh"]),
      );
    },
  );

  it("holds its stage on screen for its length without shifting the layout", async () => {
    const stopRecording = recordLayoutShifts();
    const screen = await render(
      onPage(
        <ScrollScene choreography={vi.fn<Choreography>()} length="short">
          <p>Held content</p>
        </ScrollScene>,
      ),
    );
    const content = screen.getByText("Held content").element();
    const start = pageTopOf(screen.container);

    await scrollToSettled(start);
    const heldAt = content.getBoundingClientRect().top;
    await scrollThrough(0, document.documentElement.scrollHeight - window.innerHeight);
    await scrollToSettled(start + sceneLength.short * window.innerHeight);

    expect(content.getBoundingClientRect().top).toBeCloseTo(heldAt, 0);
    expect(stopRecording()).toBe(0);
  });

  it("scrubs one timeline from 0 to 1 while its stage is held", async () => {
    const timelines: gsap.core.Timeline[] = [];
    const screen = await render(
      onPage(
        <ScrollScene
          choreography={(timeline) => {
            timelines.push(timeline);
          }}
        >
          <p>Scrubbed content</p>
        </ScrollScene>,
      ),
    );
    await expect.element(screen.getByText("Scrubbed content")).toBeVisible();
    await expect.poll(() => timelines).toHaveLength(1);
    const trigger = timelines[0]?.scrollTrigger;
    const start = pageTopOf(screen.container);
    const end = start + sceneLength.medium * window.innerHeight;

    /* A timeline's trigger measures itself on the next tick, once the choreography has filled it. */
    await expect.poll(() => trigger?.end).toBeCloseTo(end, 0);
    expect(trigger?.start).toBeCloseTo(start, 0);
    await scrollToSettled(start);
    expect(trigger?.progress).toBe(0);
    await scrollToSettled(end);
    expect(trigger?.progress).toBe(1);
  });

  it("drives its timeline straight from the scroll with a direct scrub, for a world that smooths itself", async () => {
    const progress = { value: 0 };
    const timelines: gsap.core.Timeline[] = [];
    const screen = await render(
      onPage(
        <ScrollScene
          scrub="direct"
          choreography={(timeline) => {
            timeline.to(progress, { value: 1, ease: "none" });
            timelines.push(timeline);
          }}
        >
          <p>Direct content</p>
        </ScrollScene>,
      ),
    );
    await expect.poll(() => timelines).toHaveLength(1);
    const start = pageTopOf(screen.container);
    const end = start + sceneLength.medium * window.innerHeight;
    await expect.poll(() => timelines[0]?.scrollTrigger?.end).toBeCloseTo(end, 0);

    await scrollToSettled((start + end) / 2);

    expect(progress.value).toBeCloseTo(0.5, 2);
  });
});
