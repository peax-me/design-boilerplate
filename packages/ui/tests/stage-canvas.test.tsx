import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import { afterEach, describe, expect, it, type Mock, onTestFinished, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { QualityTier } from "../src/lib/quality-tier.ts";
import { StageCanvas } from "../src/scene/stage-canvas.tsx";

const SETTLE_MS = 500;
/* The first frame waits for a WebGL context, slower when many browsers share the machine. */
const RENDER_TIMEOUT = { timeout: 15_000 };
/* Longer than a second: a delta that spanned the wait would exceed 1. */
const PAUSE_MS = 1100;
const SAMPLED_FRAMES = 4;
/* A frame moves a scene by 0.1 s at most; the subtraction behind a delta may round a hair above it. */
const FRAME_CAP_SECONDS = 0.1;
const LARGEST_DELTA = FRAME_CAP_SECONDS + 1e-9;
/* Five frames a second: every gap between two frames is longer than the cap. */
const SLOW_DEVICE_FPS = 5;
const GSAP_DEFAULT_FPS = 240;
const DEVICE_PIXEL_RATIO = 3;
const STAGE = { width: 240, height: 120 };

function FrameCounter({ onFrame }: { onFrame: (delta: number) => void }) {
  useFrame((_state, delta) => {
    onFrame(delta);
  });
  return (
    <mesh>
      <boxGeometry />
      <meshBasicMaterial />
    </mesh>
  );
}

interface StageProps {
  tier: QualityTier;
  onFrame: (delta: number) => void;
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

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/* The GSAP ticker sleeps with no listener and its time stands still: another animation keeps it running, as on a real page. */
async function runTickerFor(milliseconds: number): Promise<void> {
  const tick = vi.fn<() => void>();
  gsap.ticker.add(tick);
  await pause(milliseconds);
  gsap.ticker.remove(tick);
}

function frameSpy(): Mock<(delta: number) => void> {
  return vi.fn<(delta: number) => void>();
}

function deltasOf(onFrame: Mock<(delta: number) => void>): number[] {
  return onFrame.mock.calls.map(([delta]) => delta);
}

async function renderThenLeaveWindow(onFrame: Mock<(delta: number) => void>) {
  const screen = await render(<Stage tier="full" onFrame={onFrame} spacer="300vh" />);
  const canvas = canvasOf(screen.container);
  canvas.scrollIntoView();
  await expect.poll(() => onFrame.mock.calls.length, RENDER_TIMEOUT).toBeGreaterThan(0);
  window.scrollTo(0, 0);
  await pause(PAUSE_MS);
  return { canvas, framesWhenLeft: onFrame.mock.calls.length };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.scrollTo(0, 0);
});

describe("StageCanvas", () => {
  it("renders frames from the GSAP ticker while the canvas is in the window", async () => {
    const onFrame = frameSpy();
    await render(<Stage tier="full" onFrame={onFrame} />);

    await expect.poll(() => onFrame.mock.calls.length, RENDER_TIMEOUT).toBeGreaterThan(0);
  });

  it("moves every frame by at most 0.1 s, the first one included, on a scene mounted late", async () => {
    await runTickerFor(PAUSE_MS);
    const onFrame = frameSpy();
    await render(<Stage tier="full" onFrame={onFrame} />);

    await expect
      .poll(() => onFrame.mock.calls.length, RENDER_TIMEOUT)
      .toBeGreaterThan(SAMPLED_FRAMES);
    const deltas = deltasOf(onFrame);
    expect(Math.min(...deltas)).toBeGreaterThan(0);
    expect(Math.max(...deltas)).toBeLessThanOrEqual(LARGEST_DELTA);
  });

  it("keeps a slow device moving by 0.1 s a frame instead of freezing it", async () => {
    gsap.ticker.fps(SLOW_DEVICE_FPS);
    onTestFinished(() => {
      gsap.ticker.fps(GSAP_DEFAULT_FPS);
    });
    const onFrame = frameSpy();
    await render(<Stage tier="full" onFrame={onFrame} />);

    await expect
      .poll(() => onFrame.mock.calls.length, RENDER_TIMEOUT)
      .toBeGreaterThan(SAMPLED_FRAMES);
    const deltas = deltasOf(onFrame);
    expect(Math.min(...deltas)).toBeCloseTo(FRAME_CAP_SECONDS, 6);
    expect(Math.max(...deltas)).toBeCloseTo(FRAME_CAP_SECONDS, 6);
  });

  it("renders no frame below the window and resumes once scrolled into view", async () => {
    const onFrame = frameSpy();
    const screen = await render(<Stage tier="full" onFrame={onFrame} spacer="300vh" />);

    await pause(SETTLE_MS);
    expect(onFrame).not.toHaveBeenCalled();

    canvasOf(screen.container).scrollIntoView();
    await expect.poll(() => onFrame.mock.calls.length, RENDER_TIMEOUT).toBeGreaterThan(0);
  });

  it("stops rendering once scrolled out of the window", async () => {
    const onFrame = frameSpy();
    const { framesWhenLeft } = await renderThenLeaveWindow(onFrame);

    await pause(SETTLE_MS);

    expect(onFrame.mock.calls.length).toBe(framesWhenLeft);
  });

  it("moves every frame by at most 0.1 s once the canvas returns to the window", async () => {
    const onFrame = frameSpy();
    const { canvas, framesWhenLeft } = await renderThenLeaveWindow(onFrame);

    canvas.scrollIntoView();
    await expect
      .poll(() => onFrame.mock.calls.length, RENDER_TIMEOUT)
      .toBeGreaterThan(framesWhenLeft + SAMPLED_FRAMES);

    const deltasBack = deltasOf(onFrame).slice(framesWhenLeft);
    expect(Math.min(...deltasBack)).toBeGreaterThan(0);
    expect(Math.max(...deltasBack)).toBeLessThanOrEqual(LARGEST_DELTA);
  });

  it("leaves the ticker when it unmounts", async () => {
    const add = vi.spyOn(gsap.ticker, "add");
    const remove = vi.spyOn(gsap.ticker, "remove");
    const screen = await render(<Stage tier="light" onFrame={frameSpy()} />);

    await expect.poll(() => add.mock.calls.length, RENDER_TIMEOUT).toBeGreaterThan(0);
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
      const screen = await render(<Stage tier={tier} onFrame={frameSpy()} />);
      const canvas = canvasOf(screen.container);

      await expect.poll(() => canvas.width, RENDER_TIMEOUT).toBe(canvasWidth);
      expect(canvas.getContext("webgl2")?.getContextAttributes()?.antialias).toBe(antialias);
    },
  );
});
