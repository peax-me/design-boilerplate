import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import { useRef } from "react";
import { afterEach, describe, expect, it, type Mock, onTestFinished, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { QualityTier } from "../src/lib/quality-tier.ts";
import { playbackFor, StagePlaybackContext } from "../src/motion/stage-playback-context.ts";
import { StageCanvas } from "../src/scene/stage-canvas.tsx";
import { FrameCounter } from "./support/frame-counter.tsx";
import { pause, SETTLE_MS } from "./support/pause.ts";

/* The first frame waits for a WebGL context, slower when many browsers share the machine. */
const RENDER_TIMEOUT = { timeout: 15_000 };
/* Longer than a second: a delta that spanned the wait would exceed 1. */
const PAUSE_MS = 1100;
const SAMPLED_FRAMES = 4;
/* A frame moves a scene by 0.1 s at most; the subtraction behind a delta may round a hair above it. */
const FRAME_CAP_SECONDS = 0.1;
const LARGEST_DELTA = FRAME_CAP_SECONDS + 1e-9;
/* Five frames a second: a gap between two frames is longer than the cap, unless GSAP catches up after a late tick. */
const SLOW_DEVICE_FPS = 5;
const GSAP_DEFAULT_FPS = 240;
const DEVICE_PIXEL_RATIO = 3;
const STAGE = { width: 240, height: 120 };

interface StageProps {
  tier: QualityTier;
  onFrame: (delta: number) => void;
  /* Page height above the canvas, to push it out of the window. */
  spacer?: string;
  /* The visitor paused the stage around the canvas. */
  paused?: boolean;
  width?: number;
}

function Stage({ tier, onFrame, spacer, paused = false, width = STAGE.width }: StageProps) {
  return (
    <StagePlaybackContext value={playbackFor(paused)}>
      {spacer === undefined ? null : <div style={{ height: spacer }} />}
      <div style={{ width, height: STAGE.height }}>
        <StageCanvas tier={tier}>
          <FrameCounter onFrame={onFrame} />
        </StageCanvas>
      </div>
    </StagePlaybackContext>
  );
}

/* A lit box that reports how many shader programs the renderer holds when its first frame is drawn. */
function FirstFramePrograms({ onFirstFrame }: { onFirstFrame: (programs: number) => void }) {
  const drawn = useRef(false);

  useFrame((state) => {
    if (drawn.current) {
      return;
    }
    drawn.current = true;
    onFirstFrame(state.gl.info.programs?.length ?? 0);
  });

  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  );
}

function canvasOf(container: HTMLElement): HTMLCanvasElement {
  const canvas = container.querySelector("canvas");
  if (canvas === null) {
    throw new Error("The stage has no canvas");
  }
  return canvas;
}

/* The GSAP ticker sleeps with no listener and its time stands still: another animation keeps it running, as on a real page. */
async function runTickerFor(milliseconds: number): Promise<void> {
  const tick = vi.fn<() => void>();
  gsap.ticker.add(tick);
  await pause(milliseconds);
  gsap.ticker.remove(tick);
}

/* A visitor scrolling without a pause: the page sends a scroll event every frame. Timed here rather than tied to frames, so a busy
   machine with slow frames cannot leave a gap long enough for a scroll-debounced measure to settle. */
const SCROLL_EVENT_INTERVAL_MS = 10;

function scrollWithoutPause(): () => void {
  const interval = setInterval(() => {
    document.dispatchEvent(new Event("scroll", { bubbles: true }));
  }, SCROLL_EVENT_INTERVAL_MS);
  return () => {
    clearInterval(interval);
  };
}

function frameSpy(): Mock<(delta: number) => void> {
  return vi.fn<(delta: number) => void>();
}

function deltasOf(onFrame: Mock<(delta: number) => void>): number[] {
  return onFrame.mock.calls.map(([delta]) => delta);
}

async function renderThenPause(onFrame: Mock<(delta: number) => void>) {
  const screen = await render(<Stage tier="full" onFrame={onFrame} />);
  await expect.poll(() => onFrame.mock.calls.length, RENDER_TIMEOUT).toBeGreaterThan(0);
  await screen.rerender(<Stage tier="full" onFrame={onFrame} paused />);
  await pause(SETTLE_MS);
  return { screen, framesWhenPaused: onFrame.mock.calls.length };
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

  it("compiles the scene's shader programs before drawing its first frame", async () => {
    const onFirstFrame = vi.fn<(programs: number) => void>();
    await render(
      <div style={STAGE}>
        <StageCanvas tier="full">
          <FirstFramePrograms onFirstFrame={onFirstFrame} />
        </StageCanvas>
      </div>,
    );

    await expect.poll(() => onFirstFrame.mock.calls.length, RENDER_TIMEOUT).toBe(1);
    expect(onFirstFrame.mock.lastCall?.[0]).toBeGreaterThan(0);
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
    /* A late tick makes GSAP schedule the next one at once, so a frame may move less than the cap: none stands still, and the cap bites. */
    const deltas = deltasOf(onFrame);
    expect(Math.min(...deltas)).toBeGreaterThan(0);
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

  it("draws its first frame while the page keeps scrolling", async () => {
    onTestFinished(scrollWithoutPause());
    const onFrame = frameSpy();
    await render(<Stage tier="full" onFrame={onFrame} />);

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

  it("renders no frame while its stage is paused, then resumes by at most 0.1 s a frame", async () => {
    const onFrame = frameSpy();
    const { screen, framesWhenPaused } = await renderThenPause(onFrame);

    await pause(PAUSE_MS);
    expect(onFrame.mock.calls.length).toBe(framesWhenPaused);

    await screen.rerender(<Stage tier="full" onFrame={onFrame} />);
    await expect
      .poll(() => onFrame.mock.calls.length, RENDER_TIMEOUT)
      .toBeGreaterThan(framesWhenPaused + SAMPLED_FRAMES);
    const deltasBack = deltasOf(onFrame).slice(framesWhenPaused);
    expect(Math.min(...deltasBack)).toBeGreaterThan(0);
    expect(Math.max(...deltasBack)).toBeLessThanOrEqual(LARGEST_DELTA);
  });

  it("draws its paused frame again, without moving it, once resized", async () => {
    const onFrame = frameSpy();
    const { screen, framesWhenPaused } = await renderThenPause(onFrame);

    await screen.rerender(<Stage tier="full" onFrame={onFrame} paused width={STAGE.width * 2} />);

    await expect.poll(() => onFrame.mock.calls.length, RENDER_TIMEOUT).toBe(framesWhenPaused + 1);
    expect(onFrame.mock.lastCall?.[0]).toBe(0);
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
