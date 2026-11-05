import "../src/styles/globals.css";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { LIVE_TIMEOUT } from "../stories/support/live-timeout.ts";
import { afterIdle, BoxStage, stageAt } from "./support/box-stage.tsx";
import { countedScene } from "./support/counted-scene.tsx";
import { pause, SETTLE_MS } from "./support/pause.ts";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";
import { DESKTOP } from "./support/viewports.ts";

/* The alpha a computed colour paints with: whatever its colour space, the 2D canvas resolves it. */
function alphaOf(color: string): number {
  const context = document.createElement("canvas").getContext("2d");
  if (context === null) {
    throw new Error("No 2D context to resolve the colour");
  }
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  return Number(context.getImageData(0, 0, 1, 1).data[3]) / 255;
}

beforeEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

afterEach(async () => {
  await allowMotion();
});

describe("Stage playback", () => {
  it("lets a visitor pause an ambient scene, then play it again", async () => {
    const onFrame = vi.fn<() => void>();
    const screen = await render(
      <BoxStage name="Waving box" ambient renderScene={countedScene(onFrame)} />,
    );
    const pauseControl = screen.getByRole("button", { name: "Pause animation" });
    const playControl = screen.getByRole("button", { name: "Play animation" });

    await expect.element(pauseControl, LIVE_TIMEOUT).toBeVisible();
    /* Its name says the action it performs, so it carries no pressed state. */
    await expect.element(pauseControl).not.toHaveAttribute("aria-pressed");

    await pauseControl.click();
    await expect.element(playControl).toBeVisible();
    await pause(SETTLE_MS);
    const framesWhenPaused = onFrame.mock.calls.length;
    await pause(SETTLE_MS);
    expect(onFrame.mock.calls.length).toBe(framesWhenPaused);

    await playControl.click();
    await expect.poll(() => onFrame.mock.calls.length).toBeGreaterThan(framesWhenPaused);
    await expect.element(pauseControl).toBeVisible();
  });

  it("names the control with the labels it is given", async () => {
    const screen = await render(
      <BoxStage name="Tide box" ambient pauseLabel="Pause the tide" playLabel="Play the tide" />,
    );
    const pauseControl = screen.getByRole("button", { name: "Pause the tide" });

    await expect.element(pauseControl, LIVE_TIMEOUT).toBeVisible();
    await pauseControl.click();

    await expect.element(screen.getByRole("button", { name: "Play the tide" })).toBeVisible();
  });

  it("gives a stage that is not ambient no control", async () => {
    const screen = await render(<BoxStage name="Still box" />);

    await expect.poll(() => stageAt(screen.container).dataset["stage"], LIVE_TIMEOUT).toBe("live");

    expect(screen.container.querySelector("button")).toBeNull();
  });

  it("gives an ambient stage no control while it shows its poster", async () => {
    await preferReducedMotion();
    const screen = await render(<BoxStage name="Calm box" ambient />);

    await afterIdle();

    expect(stageAt(screen.container).dataset["stage"]).toBe("poster");
    expect(screen.container.querySelector("button")).toBeNull();
  });

  it("stays opaque under the pointer, so its icon keeps its contrast whatever the canvas draws behind it", async () => {
    const screen = await render(<BoxStage name="Hovered box" ambient />);
    const pauseControl = screen.getByRole("button", { name: "Pause animation" });
    await expect.element(pauseControl, LIVE_TIMEOUT).toBeVisible();
    const resting = getComputedStyle(pauseControl.element()).backgroundColor;

    await pauseControl.hover();
    await pause(SETTLE_MS);

    const hovered = getComputedStyle(pauseControl.element()).backgroundColor;
    expect(hovered).not.toBe(resting);
    expect(alphaOf(hovered)).toBe(1);
  });
});
