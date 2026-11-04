import "../src/styles/globals.css";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { LIVE_TIMEOUT } from "../stories/support/live-timeout.ts";
import { afterIdle, BoxStage, stageAt } from "./support/box-stage.tsx";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";
import { DESKTOP, PHONE } from "./support/viewports.ts";

const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");

function webgl2Requests(): number {
  return getContext.mock.calls.filter(([contextType]) => contextType === "webgl2").length;
}

beforeEach(() => {
  getContext.mockClear();
});

afterEach(async () => {
  await allowMotion();
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

/* The WebGL2 answer is kept for the page and this file has a page of its own: the first test to ask is the one that creates the context, so the test that expects no request comes first. */
describe("Stage WebGL2 probe", () => {
  it("never asks for a context under reduced motion", async () => {
    await preferReducedMotion();
    await render(<BoxStage name="Calm box" />);

    await afterIdle();

    expect(webgl2Requests()).toBe(0);
  });

  it("asks for a context on a phone only once a first interaction lets the scene mount", async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const screen = await render(<BoxStage name="Phone box" />);
    const stage = stageAt(screen.container);

    await afterIdle();
    expect(webgl2Requests()).toBe(0);

    window.dispatchEvent(new Event("pointerdown"));
    await expect.poll(() => stage.dataset["stage"], LIVE_TIMEOUT).toBe("live");
    expect(webgl2Requests()).toBeGreaterThan(0);
  });
});
