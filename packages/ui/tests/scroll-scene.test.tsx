import "../src/styles/globals.css";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { CodeBlock } from "../src/components/code-block.tsx";
import { CodeLine } from "../src/components/code-line.tsx";
import { Container } from "../src/layout/container.tsx";
import { ScrollScene } from "../src/motion/scroll-scene.tsx";
import { allowMotion, preferReducedMotion } from "./support/reduced-motion.ts";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

afterEach(async () => {
  await allowMotion();
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

describe("ScrollScene", () => {
  it("pins the stage and hands a scrubbed timeline to the choreography", async () => {
    const choreography = vi.fn<(timeline: gsap.core.Timeline) => void>();
    const screen = await render(
      <ScrollScene choreography={choreography}>
        <p>Scene content</p>
      </ScrollScene>,
    );

    await expect.element(screen.getByText("Scene content")).toBeVisible();
    expect(choreography).toHaveBeenCalledOnce();
    expect(screen.container.querySelector(".pin-spacer")).not.toBeNull();
  });

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
    expect(screen.container.querySelector(".pin-spacer")).toBeNull();
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
    expect(screen.container.querySelector(".pin-spacer")).toBeNull();
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
    expect(choreography).toHaveBeenCalledOnce();
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
