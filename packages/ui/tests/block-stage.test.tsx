import "../src/styles/globals.css";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import type { Block } from "../src/lib/isometric.ts";
import { BlockStage } from "../src/motion/block-stage.tsx";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

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

function stageOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>("[data-slot='block-stage']");
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
    expect(stageOf(screen.container)?.dataset["depth"]).toBe("poster");
  });

  it("keeps the drawing on phones", async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const screen = await render(<BlockStage blocks={blocks} label="Phone pieces" />);

    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(screen.container.querySelector("canvas")).toBeNull();
  });

  it("lifts the drawing into a lit scene on large screens and repaints it", async () => {
    const screen = await render(
      <BlockStage blocks={blocks} label="Desk pieces" grain={grainTexture()} />,
    );

    await expect
      .poll(() => stageOf(screen.container)?.dataset["depth"], { timeout: 15_000 })
      .toBe("ready");
    expect(screen.container.querySelector("canvas")).not.toBeNull();

    document.documentElement.dataset["paint"] = "green";
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 10, clientY: 10 }));
    await expect.element(screen.getByRole("img", { name: "Desk pieces" })).toBeInTheDocument();
  });
});
