import "../src/styles/globals.css";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { CodeBlock } from "../src/components/code-block.tsx";
import { CodeLine } from "../src/components/code-line.tsx";
import { Container } from "../src/layout/container.tsx";
import { ScrollScene } from "../src/motion/scroll-scene.tsx";
import { sceneLength } from "../src/motion/tokens.ts";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";
import { DESKTOP, PHONE } from "./support/viewports.ts";

/* The scroll distance a scene holds its stage for: its height beyond its stage's. */
function holdOf(container: HTMLElement): number {
  const scene = container.querySelector("[data-slot='scroll-scene']");
  const stage = scene?.firstElementChild;
  return (
    (scene?.getBoundingClientRect().height ?? 0) - (stage?.getBoundingClientRect().height ?? 0)
  );
}

afterEach(async () => {
  await allowMotion();
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

describe("ScrollScene", () => {
  it("renders the final state without choreography when the user prefers reduced motion", async () => {
    await preferReducedMotion();
    const choreography = vi.fn<(timeline: gsap.core.Timeline) => void>();
    const screen = await render(
      <ScrollScene choreography={choreography}>
        <p>Static content</p>
      </ScrollScene>,
    );

    await expect.element(screen.getByText("Static content")).toBeVisible();
    expect(choreography).not.toHaveBeenCalled();
    expect(holdOf(screen.container)).toBe(0);
  });

  it("keeps the final state on small screens when the scene starts at a breakpoint", async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const choreography = vi.fn<(timeline: gsap.core.Timeline) => void>();
    const screen = await render(
      <ScrollScene choreography={choreography} minWidth="md">
        <p>Phone content</p>
      </ScrollScene>,
    );

    await expect.element(screen.getByText("Phone content")).toBeVisible();
    expect(choreography).not.toHaveBeenCalled();
    expect(holdOf(screen.container)).toBe(0);
  });

  it("plays the choreography from the breakpoint up", async () => {
    await page.viewport(DESKTOP.width, DESKTOP.height);
    const choreography = vi.fn<(timeline: gsap.core.Timeline) => void>();
    const screen = await render(
      <ScrollScene choreography={choreography} minWidth="md">
        <p>Desktop content</p>
      </ScrollScene>,
    );

    await expect.element(screen.getByText("Desktop content")).toBeVisible();
    await expect.poll(() => choreography.mock.calls.length).toBe(1);
    expect(holdOf(screen.container)).toBeCloseTo(sceneLength.medium * window.innerHeight, 0);
  });

  it("keeps content within a phone screen when a code line is long", async () => {
    await page.viewport(PHONE.width, PHONE.height);
    const choreography = vi.fn<(timeline: gsap.core.Timeline) => void>();
    const screen = await render(
      <ScrollScene choreography={choreography} minWidth="md">
        <Container data-testid="content">
          <CodeBlock title="Long output">
            <CodeLine>✓ [desktop] uses only tokens, symmetric paddings and no overlaps</CodeLine>
          </CodeBlock>
        </Container>
      </ScrollScene>,
    );

    const content = screen.getByTestId("content").element().getBoundingClientRect();
    expect(content.width).toBeLessThanOrEqual(PHONE.width);
  });

  it("shows the still plates instead of the scene when motion is reduced", async () => {
    await preferReducedMotion();
    const choreography = vi.fn<(timeline: gsap.core.Timeline) => void>();
    const screen = await render(
      <ScrollScene choreography={choreography} still={<p>Still plates</p>}>
        <p>Animated scene</p>
      </ScrollScene>,
    );

    await expect.element(screen.getByText("Still plates")).toBeVisible();
    await expect.element(screen.getByText("Animated scene")).not.toBeVisible();
  });

  it("shows the scene and hides the still plates when motion is allowed", async () => {
    const choreography = vi.fn<(timeline: gsap.core.Timeline) => void>();
    const screen = await render(
      <ScrollScene choreography={choreography} still={<p>Plates</p>}>
        <p>Scene</p>
      </ScrollScene>,
    );

    await expect.element(screen.getByText("Scene")).toBeVisible();
    await expect.element(screen.getByText("Plates")).not.toBeVisible();
  });
});
