import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { QualityTier } from "../src/lib/quality-tier.ts";
import { StageCanvas } from "../src/scene/stage-canvas.tsx";

const SETTLE_MS = 500;
const DEVICE_PIXEL_RATIO = 3;
const STAGE = { width: 240, height: 120 };

function FrameCounter({ onFrame }: { onFrame: () => void }) {
  useFrame(onFrame);
  return (
    <mesh>
      <boxGeometry />
      <meshBasicMaterial />
    </mesh>
  );
}

interface StageProps {
  tier: QualityTier;
  onFrame: () => void;
  /* Page height above the canvas, to push it out of the window. */
  spacer?: string;
}

function Stage({ tier, onFrame, spacer }: StageProps) {
  return (
    <>
      {spacer === undefined ? null : <div style={{ height: spacer }} />}
      <div style={STAGE}>
        <StageCanvas tier={tier}>
          <FrameCounter onFrame={onFrame} />
        </StageCanvas>
      </div>
    </>
  );
}

function canvasOf(container: HTMLElement): HTMLCanvasElement {
  const canvas = container.querySelector("canvas");
  if (canvas === null) {
    throw new Error("The stage has no canvas");
  }
  return canvas;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.scrollTo(0, 0);
});

describe("StageCanvas", () => {
  it("renders frames from the GSAP ticker while the canvas is in the window", async () => {
    const onFrame = vi.fn<() => void>();
    await render(<Stage tier="full" onFrame={onFrame} />);

    await expect.poll(() => onFrame.mock.calls.length).toBeGreaterThan(0);
  });

  it("renders no frame below the window and resumes once scrolled into view", async () => {
    const onFrame = vi.fn<() => void>();
    const screen = await render(<Stage tier="full" onFrame={onFrame} spacer="300vh" />);

    await new Promise((resolve) => {
      setTimeout(resolve, SETTLE_MS);
    });
    expect(onFrame).not.toHaveBeenCalled();

    canvasOf(screen.container).scrollIntoView();
    await expect.poll(() => onFrame.mock.calls.length).toBeGreaterThan(0);
  });

  it("leaves the ticker when it unmounts", async () => {
    const add = vi.spyOn(gsap.ticker, "add");
    const remove = vi.spyOn(gsap.ticker, "remove");
    const screen = await render(<Stage tier="light" onFrame={vi.fn<() => void>()} />);

    await expect.poll(() => add.mock.calls.length).toBeGreaterThan(0);
    await screen.unmount();

    expect(remove).toHaveBeenCalledWith(add.mock.lastCall?.[0]);
  });

  it.each([
    { tier: "light", canvasWidth: STAGE.width * 1.5, antialias: false },
    { tier: "full", canvasWidth: STAGE.width * 2, antialias: true },
  ] as const)(
    "sizes and smooths the $tier tier for a dense display",
    async ({ tier, canvasWidth, antialias }) => {
      vi.stubGlobal("devicePixelRatio", DEVICE_PIXEL_RATIO);
      const screen = await render(<Stage tier={tier} onFrame={vi.fn<() => void>()} />);
      const canvas = canvasOf(screen.container);

      await expect.poll(() => canvas.width).toBe(canvasWidth);
      expect(canvas.getContext("webgl2")?.getContextAttributes()?.antialias).toBe(antialias);
    },
  );
});
