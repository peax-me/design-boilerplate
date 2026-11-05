import "../src/styles/globals.css";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { Block } from "../src/lib/isometric.ts";
import { BlockStage } from "../src/motion/block-stage.tsx";
import { MotionProvider } from "../src/motion/motion-provider.tsx";
import { ScrollScene } from "../src/motion/scroll-scene.tsx";
import { holdIdleCallbacks } from "./support/idle-callbacks.ts";
import { pause, SETTLE_MS } from "./support/pause.ts";

const blocks: Block[] = [
  { id: "plank", x: 0, y: 0, z: 0, width: 4, depth: 1, height: 1, material: "maple" },
];

let releaseIdleCallbacks: () => void;

beforeEach(() => {
  releaseIdleCallbacks = holdIdleCallbacks();
});

afterEach(() => {
  vi.restoreAllMocks();
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

  it("drops a block stage's drawing in only once the page is idle", async () => {
    const screen = await render(<BlockStage blocks={blocks} label="Dropped pieces" />);
    const piece = screen.container.querySelector<HTMLElement>("[data-scene-item='plank']");

    await expect.element(screen.getByRole("img", { name: "Dropped pieces" })).toBeVisible();
    await pause(SETTLE_MS);
    expect(piece?.style.opacity).toBe("");

    releaseIdleCallbacks();
    await expect.poll(() => piece?.style.opacity).not.toBe("");
  });
});
