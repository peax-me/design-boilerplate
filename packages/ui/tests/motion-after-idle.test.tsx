import "../src/styles/globals.css";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import type { Block } from "../src/lib/isometric.ts";
import { BlockStage } from "../src/motion/block-stage.tsx";
import { MotionProvider } from "../src/motion/motion-provider.tsx";
import { ScrollScene } from "../src/motion/scroll-scene.tsx";
import { holdIdleCallbacks } from "./support/idle-callbacks.ts";
import { pause, SETTLE_MS } from "./support/pause.ts";
import { DESKTOP } from "./support/viewports.ts";

const blocks: Block[] = [
  { id: "plank", x: 0, y: 0, z: 0, width: 4, depth: 1, height: 1, material: "maple" },
];

let releaseIdleCallbacks: () => void;

const ENTRANCE_TIMEOUT = { timeout: 5000 };

function pieceOf(container: HTMLElement, label: string): HTMLElement | null {
  return container.querySelector<HTMLElement>(
    `[data-slot='block-stage']:has([aria-label='${label}']) [data-scene-item='plank']`,
  );
}

beforeEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
  releaseIdleCallbacks = holdIdleCallbacks();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.scrollTo(0, 0);
});

/* GSAP and Lenis are lazy: the first paint and hydration wait for none of them. */
describe("Motion once the page is idle", () => {
  it("starts smooth scrolling only once the page is idle", async () => {
    const screen = await render(
      <MotionProvider>
        <p>Painted page</p>
      </MotionProvider>,
    );

    await expect.element(screen.getByText("Painted page")).toBeVisible();
    await pause(SETTLE_MS);
    expect(document.documentElement).not.toHaveClass("lenis");

    releaseIdleCallbacks();
    await expect.element(document.documentElement).toHaveClass("lenis");
  });

  it("builds a scroll scene's choreography only once the page is idle", async () => {
    const choreography = vi.fn<(timeline: gsap.core.Timeline) => void>();
    const screen = await render(
      <ScrollScene choreography={choreography}>
        <p>Painted scene</p>
      </ScrollScene>,
    );

    await expect.element(screen.getByText("Painted scene")).toBeVisible();
    await pause(SETTLE_MS);
    expect(choreography).not.toHaveBeenCalled();

    releaseIdleCallbacks();
    await expect.poll(() => choreography.mock.calls.length).toBe(1);
  });

  it("never hides a drawing the visitor already sees once motion loads, and drops in the others as they enter the window", async () => {
    const screen = await render(
      <>
        <BlockStage blocks={blocks} label="Seen pieces" />
        <div style={{ height: "150vh" }} />
        <BlockStage blocks={blocks} label="Unseen pieces" />
      </>,
    );
    const seen = pieceOf(screen.container, "Seen pieces");
    const unseen = pieceOf(screen.container, "Unseen pieces");

    await pause(SETTLE_MS);
    expect(unseen?.style.opacity).toBe("");

    releaseIdleCallbacks();
    /* Out of the window, the unseen drawing waits in its first state of the entrance. */
    await expect.poll(() => unseen?.style.opacity).toBe("0");
    expect(seen?.style.opacity).toBe("");

    unseen?.scrollIntoView();
    /* The entrance lasts duration.slow and its stagger; a busy machine slows the ticker that plays it. */
    await expect.poll(() => unseen?.style.opacity, ENTRANCE_TIMEOUT).toBe("1");
    expect(seen?.style.opacity).toBe("");
  });
});
