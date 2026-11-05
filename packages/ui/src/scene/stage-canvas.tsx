"use client";

import { Canvas, type CanvasProps, type RootState, useStore, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { use, useEffect, useState } from "react";

import { pixelRatio, type QualityTier } from "../lib/quality-tier.ts";
import { StagePlaybackContext } from "../motion/stage-playback-context.ts";
import { useRethrow } from "./use-rethrow.ts";

/* A frame moves a scene by this much at most: a pause (offscreen, paused by the visitor, background tab) is not replayed, and a slow device still moves. */
const MAX_FRAME_DELTA_SECONDS = 0.1;

/* R3F renders only when advanced (frameloop "never"). GSAP's ticker is the one clock for every scene, and a canvas outside the window costs no frame.
   R3F measures delta from its own clock, in the unit of the timestamp given: seconds here. That clock is held at most one capped frame behind the ticker.
   A frame that throws leaves the ticker, so the page's other ticker work keeps running, and its error reaches the stage, which brings the poster back. */
function TickerFrames(): null {
  const advance = useThree((state) => state.advance);
  const clock = useThree((state) => state.clock);
  const canvas = useThree((state) => state.gl.domElement);
  const rethrow = useRethrow();

  useEffect(() => {
    let inWindow = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        inWindow = entry.isIntersecting;
      }
    });
    observer.observe(canvas);

    function advanceInWindow(time: number): void {
      if (!inWindow) {
        return;
      }
      clock.elapsedTime = Math.max(clock.elapsedTime, time - MAX_FRAME_DELTA_SECONDS);
      try {
        advance(time);
      } catch (error) {
        gsap.ticker.remove(advanceInWindow);
        rethrow(error);
      }
    }
    gsap.ticker.add(advanceInWindow);

    return () => {
      gsap.ticker.remove(advanceInWindow);
      observer.disconnect();
    };
  }, [advance, canvas, clock, rethrow]);

  return null;
}

function resized(state: RootState, previous: RootState): boolean {
  return state.size.width !== previous.size.width || state.size.height !== previous.size.height;
}

/* Resizing clears the canvas and nothing advances a paused scene: it draws the same frame again, at the same time. */
function HeldFrame(): null {
  const store = useStore();

  useEffect(
    () =>
      store.subscribe((state, previous) => {
        if (resized(state, previous)) {
          state.advance(state.clock.elapsedTime);
        }
      }),
    [store],
  );

  return null;
}

/* The scene's shader programs compile before its first frame, in parallel where the GPU allows it (KHR_parallel_shader_compile): that frame, and the onReady it fires, draw without a compile stall.
   A compile that fails reaches the stage, which brings the poster back. */
function CompiledFrames({ paused }: { paused: boolean }) {
  const get = useThree((state) => state.get);
  const [compiled, setCompiled] = useState(false);
  const rethrow = useRethrow();

  useEffect(() => {
    let mounted = true;
    async function compile(): Promise<void> {
      const { gl, scene, camera } = get();
      try {
        await gl.compileAsync(scene, camera);
      } catch (error) {
        if (mounted) {
          rethrow(error);
        }
        return;
      }
      if (mounted) {
        setCompiled(true);
      }
    }
    void compile();
    return () => {
      mounted = false;
    };
  }, [get, rethrow]);

  if (!compiled) {
    return null;
  }
  return paused ? <HeldFrame /> : <TickerFrames />;
}

/* R3F re-measures its box on every scroll event, debounced by 50 ms: a visitor who never pauses would keep the canvas unsized and undrawn.
   A stage needs its size, never its position, so only a resize measures it. */
const MEASURE_SIZE_ONLY = { scroll: false };

interface StageCanvasProps extends Omit<CanvasProps, "dpr" | "frameloop" | "gl" | "resize"> {
  tier: QualityTier;
}

export function StageCanvas({ tier, children, ...canvasProps }: StageCanvasProps) {
  const { paused } = use(StagePlaybackContext);

  return (
    <Canvas
      {...canvasProps}
      dpr={pixelRatio[tier]}
      frameloop="never"
      gl={{ antialias: tier === "full" }}
      resize={MEASURE_SIZE_ONLY}
    >
      <CompiledFrames paused={paused} />
      {children}
    </Canvas>
  );
}
