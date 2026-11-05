import "../src/styles/globals.css";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { LIVE_TIMEOUT } from "../stories/support/live-timeout.ts";
import { afterIdle, BoxStage, stageAt } from "./support/box-stage.tsx";
import { holdIdleCallbacks } from "./support/idle-callbacks.ts";
import { pause, SETTLE_MS } from "./support/pause.ts";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";
import { DESKTOP, PHONE } from "./support/viewports.ts";

type PrepareScene = () => Promise<unknown>;

function prepared(): Mock<PrepareScene> {
  return vi.fn<PrepareScene>(() => Promise.resolve());
}

beforeEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await allowMotion();
  window.scrollTo(0, 0);
});

describe("Stage preparation", () => {
  it("prepares its scene once, when the page is idle", async () => {
    const releaseIdleCallbacks = holdIdleCallbacks();
    const prepareScene = prepared();
    const screen = await render(<BoxStage name="Prepared box" prepareScene={prepareScene} />);

    await pause(SETTLE_MS);
    expect(prepareScene).not.toHaveBeenCalled();

    releaseIdleCallbacks();
    await expect.poll(() => stageAt(screen.container).dataset["stage"], LIVE_TIMEOUT).toBe("live");
    expect(prepareScene).toHaveBeenCalledOnce();
  });

  it("prepares a phone's scene only once the visitor interacts, so a page load alone loads nothing", async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const prepareScene = prepared();
    const screen = await render(<BoxStage name="Phone box" prepareScene={prepareScene} />);
    const stage = stageAt(screen.container);

    await afterIdle();
    expect(prepareScene).not.toHaveBeenCalled();
    expect(stage.querySelector("canvas")).toBeNull();

    window.dispatchEvent(new Event("pointerdown"));
    await expect.poll(() => stage.dataset["stage"], LIVE_TIMEOUT).toBe("live");
    expect(prepareScene).toHaveBeenCalledOnce();
  });

  it("never prepares a scene under reduced motion", async () => {
    await preferReducedMotion();
    const prepareScene = prepared();
    await render(<BoxStage name="Calm box" prepareScene={prepareScene} />);

    await afterIdle();

    expect(prepareScene).not.toHaveBeenCalled();
  });

  it("never prepares nor mounts a scene in a browser without WebGL2", async () => {
    vi.stubGlobal("WebGL2RenderingContext", null);
    const prepareScene = prepared();
    const screen = await render(<BoxStage name="Old box" prepareScene={prepareScene} />);

    await afterIdle();

    expect(prepareScene).not.toHaveBeenCalled();
    expect(screen.container.querySelector("canvas")).toBeNull();
    expect(stageAt(screen.container).dataset["stage"]).toBe("poster");
  });

  it("mounts the scene only once its preparation is done", async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    const screen = await render(<BoxStage name="Waiting box" prepareScene={() => promise} />);
    const stage = stageAt(screen.container);

    await afterIdle();
    expect(stage.querySelector("canvas")).toBeNull();

    resolve();
    await expect.poll(() => stage.dataset["stage"], LIVE_TIMEOUT).toBe("live");
  });

  it("still mounts a scene whose preparation failed: its own load reports the failure", async () => {
    const prepareScene = vi.fn<PrepareScene>(() => Promise.reject(new Error("Offline")));
    const screen = await render(<BoxStage name="Retried box" prepareScene={prepareScene} />);

    await expect.poll(() => stageAt(screen.container).dataset["stage"], LIVE_TIMEOUT).toBe("live");
  });
});
