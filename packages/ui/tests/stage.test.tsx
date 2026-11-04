import "../src/styles/globals.css";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { afterIdle, BoxStage, stageAt } from "./support/box-stage.tsx";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };
/* The scene loads lazily and its first frame waits for a WebGL context, slower when many browsers share the machine. */
const LIVE_TIMEOUT = { timeout: 15_000 };
const INTERACTIONS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

function canvasIn(element: HTMLElement): HTMLCanvasElement | null {
  return element.querySelector("canvas");
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

  it("brings the poster back when reduced motion is turned on", async () => {
    const stage = await renderLive("Calmed box");

    await preferReducedMotion();

    await expect.poll(() => stage.dataset["stage"]).toBe("poster");
    expect(canvasIn(stage)).toBeNull();
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
