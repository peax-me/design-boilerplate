import "../src/styles/globals.css";
import { type ComponentType, lazy } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import type { SceneProps } from "../src/motion/stage.tsx";
import { LIVE_TIMEOUT } from "../stories/support/live-timeout.ts";
import { afterIdle, BoxStage, stageAt } from "./support/box-stage.tsx";
import { holdIdleCallbacks } from "./support/idle-callbacks.ts";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";
import { DESKTOP, PHONE } from "./support/viewports.ts";

const INTERACTIONS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

const renderFailure = new Error("The scene failed to render");
const loadFailure = new Error("The scene module failed to load");

function BrokenScene(): never {
  throw renderFailure;
}

const UnloadableScene = lazy<ComponentType<SceneProps>>(() => Promise.reject(loadFailure));

const SCENE_FAILURES = [
  {
    failure: "throws while rendering",
    error: renderFailure,
    renderScene: () => <BrokenScene />,
  },
  {
    failure: "fails to load",
    error: loadFailure,
    renderScene: (scene: SceneProps) => <UnloadableScene {...scene} />,
  },
];

function canvasIn(element: HTMLElement): HTMLCanvasElement | null {
  return element.querySelector("canvas");
}

function sceneLayerIn(stage: HTMLElement): Element | null {
  return stage.querySelector(":scope > [aria-hidden]");
}

function boxOf(element: Element | null | undefined): unknown {
  return element?.getBoundingClientRect().toJSON();
}

function tierIn(element: HTMLElement): string | undefined {
  return element.querySelector<HTMLElement>("[data-tier]")?.dataset["tier"];
}

async function renderLive(name: string) {
  const screen = await render(<BoxStage name={name} />);
  const stage = stageAt(screen.container);
  await expect.poll(() => stage.dataset["stage"], LIVE_TIMEOUT).toBe("live");
  return stage;
}

beforeEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await allowMotion();
  window.scrollTo(0, 0);
});

describe("Stage", () => {
  it("keeps the named poster and loads no scene under reduced motion", async () => {
    await preferReducedMotion();
    const screen = await render(<BoxStage name="Reduced box" />);

    await afterIdle();

    await expect.element(screen.getByRole("img", { name: "Reduced box" })).toBeVisible();
    expect(canvasIn(screen.container)).toBeNull();
    expect(stageAt(screen.container).dataset["stage"]).toBe("poster");
  });

  it("goes live at the full tier on a desktop", async () => {
    const stage = await renderLive("Desk box");

    expect(tierIn(stage)).toBe("full");
  });

  it.each(INTERACTIONS)(
    "waits on a phone for a first interaction, here %s, then goes live at the light tier",
    async (interaction) => {
      await page.viewport(PHONE.width, PHONE.height);
      const screen = await render(<BoxStage name="Phone box" />);
      const stage = stageAt(screen.container);

      await afterIdle();
      expect(canvasIn(stage)).toBeNull();

      window.dispatchEvent(new Event(interaction));
      await expect.poll(() => stage.dataset["stage"], LIVE_TIMEOUT).toBe("live");
      expect(tierIn(stage)).toBe("light");
    },
  );

  it("keeps an interaction made on a phone before the page was idle", async () => {
    const releaseIdleCallbacks = holdIdleCallbacks();
    await page.viewport(PHONE.width, PHONE.height);
    const screen = await render(<BoxStage name="Early box" />);
    const stage = stageAt(screen.container);

    window.dispatchEvent(new Event("scroll"));
    releaseIdleCallbacks();

    await expect.poll(() => stage.dataset["stage"], LIVE_TIMEOUT).toBe("live");
    expect(tierIn(stage)).toBe("light");
  });

  it("loads only the stages near the window, the others once scrolled to", async () => {
    const screen = await render(
      <>
        <BoxStage name="Near box" />
        <div style={{ height: "300vh" }} />
        <BoxStage name="Far box" />
      </>,
    );
    const near = stageAt(screen.container, 0);
    const far = stageAt(screen.container, 1);

    await expect.poll(() => near.dataset["stage"], LIVE_TIMEOUT).toBe("live");
    expect(canvasIn(far)).toBeNull();

    far.scrollIntoView();
    await expect.poll(() => far.dataset["stage"], LIVE_TIMEOUT).toBe("live");
  });

  it("loads a scene within half a window below the fold before it is seen", async () => {
    const screen = await render(
      <>
        <div style={{ height: "120vh" }} />
        <BoxStage name="Fold box" />
      </>,
    );
    const stage = stageAt(screen.container);

    await expect.poll(() => canvasIn(stage), LIVE_TIMEOUT).not.toBeNull();
  });

  it("brings the poster back when the WebGL context is lost", async () => {
    const stage = await renderLive("Lost box");

    canvasIn(stage)?.dispatchEvent(new Event("webglcontextlost"));

    await expect.poll(() => stage.dataset["stage"]).toBe("poster");
    expect(canvasIn(stage)).toBeNull();
  });

  it.each(SCENE_FAILURES)(
    "brings the poster back when the scene $failure",
    async ({ error, renderScene }) => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(vi.fn<() => void>());
      const screen = await render(<BoxStage name="Failing box" renderScene={renderScene} />);
      const stage = stageAt(screen.container);

      await expect
        .poll((): unknown[] => consoleError.mock.calls.flat(), LIVE_TIMEOUT)
        .toContain(error);
      await expect.poll(() => sceneLayerIn(stage)).toBeNull();
      expect(stage.dataset["stage"]).toBe("poster");
      await expect.element(screen.getByRole("img", { name: "Failing box" })).toBeVisible();
    },
  );

  it("brings the poster back when reduced motion is turned on", async () => {
    const stage = await renderLive("Calmed box");

    await preferReducedMotion();

    await expect.poll(() => stage.dataset["stage"]).toBe("poster");
    expect(canvasIn(stage)).toBeNull();
  });

  it("gives the poster layer of a stage sized by its class the box of the stage", async () => {
    const screen = await render(<BoxStage name="Sized box" className="h-48" />);
    const stage = stageAt(screen.container);

    expect(boxOf(stage.firstElementChild)).toEqual(boxOf(stage));
  });

  it("sizes a stage without a size from its poster", async () => {
    const screen = await render(<BoxStage name="Fitted box" />);
    const stage = stageAt(screen.container);
    const poster = screen.getByRole("img", { name: "Fitted box" }).element();

    expect(stage.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(stage.getBoundingClientRect().height).toBe(poster.getBoundingClientRect().height);
  });

  it("marks an ambient stage for the motion audit", async () => {
    const screen = await render(
      <>
        <BoxStage name="Ambient box" ambient />
        <BoxStage name="Still box" />
      </>,
    );

    expect(stageAt(screen.container, 0).dataset).toHaveProperty("ambient");
    expect(stageAt(screen.container, 1).dataset).not.toHaveProperty("ambient");
  });
});
