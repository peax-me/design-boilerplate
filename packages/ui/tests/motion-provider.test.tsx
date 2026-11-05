import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { MotionProvider } from "../src/motion/motion-provider.tsx";
import { afterIdle } from "./support/box-stage.tsx";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";

function smoothScrolling(): boolean {
  return document.documentElement.classList.contains("lenis");
}

afterEach(async () => {
  await allowMotion();
});

describe("MotionProvider", () => {
  it("enables smooth scrolling on the document", async () => {
    const screen = await render(
      <MotionProvider>
        <p>Page</p>
      </MotionProvider>,
    );

    await expect.element(screen.getByText("Page")).toBeVisible();
    await expect.poll(smoothScrolling).toBe(true);
  });

  it("keeps native scrolling when the user prefers reduced motion", async () => {
    await preferReducedMotion();
    const screen = await render(
      <MotionProvider>
        <p>Page</p>
      </MotionProvider>,
    );

    await expect.element(screen.getByText("Page")).toBeVisible();
    await afterIdle();
    expect(smoothScrolling()).toBe(false);
  });
});
