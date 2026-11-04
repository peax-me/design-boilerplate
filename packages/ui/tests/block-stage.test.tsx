import "../src/styles/globals.css";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import type { Block } from "../src/lib/isometric.ts";
import { BlockStage } from "../src/motion/block-stage.tsx";
import { LIVE_TIMEOUT } from "../stories/support/live-timeout.ts";
import { afterIdle, stageAt } from "./support/box-stage.tsx";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";
import { DESKTOP, PHONE } from "./support/viewports.ts";

const blocks: Block[] = [
  { id: "plank", x: 0, y: 0, z: 0, width: 4, depth: 1, height: 1, material: "maple" },
  { id: "cube", x: 0, y: 2, z: 0, width: 2, depth: 2, height: 2, material: "lacquer" },
];

function grainTexture(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 4;
  return canvas.toDataURL();
}

/* A context keeps the attributes it was created with: a light scene asked for no antialiasing. */
function requestedAntialias(canvas: HTMLCanvasElement | null): boolean | undefined {
  return canvas?.getContext("webgl2")?.getContextAttributes()?.antialias;
}

afterEach(async () => {
  await allowMotion();
  await page.viewport(DESKTOP.width, DESKTOP.height);
  delete document.documentElement.dataset["paint"];
});

describe("BlockStage", () => {
  it("shows the named drawing and no canvas when motion is reduced", async () => {
    await preferReducedMotion();
    const screen = await render(<BlockStage blocks={blocks} label="Two pieces" />);

    await expect.element(screen.getByRole("img", { name: "Two pieces" })).toBeVisible();
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(screen.container.querySelector("canvas")).toBeNull();
    expect(stageAt(screen.container).dataset["stage"]).toBe("poster");
  });

  it("waits for a first interaction on phones, then lifts the drawing into a light scene", async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const screen = await render(<BlockStage blocks={blocks} label="Phone pieces" />);
    const stage = stageAt(screen.container);

    await afterIdle();
    expect(stage.dataset["stage"]).toBe("poster");
    expect(stage.querySelector("canvas")).toBeNull();

    window.dispatchEvent(new Event("pointerdown"));
    await expect.poll(() => stage.dataset["stage"], LIVE_TIMEOUT).toBe("live");
    expect(requestedAntialias(stage.querySelector("canvas"))).toBe(false);
  });

  it("lifts the drawing into a lit scene on large screens and repaints it", async () => {
    const screen = await render(
      <BlockStage blocks={blocks} label="Desk pieces" grain={grainTexture()} />,
    );

    await expect.poll(() => stageAt(screen.container).dataset["stage"], LIVE_TIMEOUT).toBe("live");
    expect(screen.container.querySelector("canvas")).not.toBeNull();

    document.documentElement.dataset["paint"] = "green";
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 10, clientY: 10 }));
    await afterIdle();

    expect(stageAt(screen.container).dataset["stage"]).toBe("live");
    await expect.element(screen.getByRole("img", { name: "Desk pieces" })).toBeInTheDocument();
  });
});
