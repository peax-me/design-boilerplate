"use client";

import { Canvas, type CanvasProps, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect } from "react";

import { pixelRatio, type QualityTier } from "../lib/quality-tier.ts";

/* A frame moves a scene by this much at most: a pause (offscreen, background tab) is not replayed, and a slow device still moves. */
const MAX_FRAME_DELTA_SECONDS = 0.1;

/* R3F renders only when advanced (frameloop "never"). GSAP's ticker is the one clock for every scene, and a canvas outside the window costs no frame.
   R3F measures delta from its own clock, in the unit of the timestamp given: seconds here. That clock is held at most one capped frame behind the ticker. */
function TickerFrames(): null {
  const advance = useThree((state) => state.advance);
  const clock = useThree((state) => state.clock);
  const canvas = useThree((state) => state.gl.domElement);

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
      advance(time);
    }
    gsap.ticker.add(advanceInWindow);

    return () => {
      gsap.ticker.remove(advanceInWindow);
      observer.disconnect();
    };
  }, [advance, canvas, clock]);

  return null;
}

interface StageCanvasProps extends Omit<CanvasProps, "dpr" | "frameloop" | "gl"> {
  tier: QualityTier;
}

export function StageCanvas({ tier, children, ...canvasProps }: StageCanvasProps) {
  return (
    <Canvas
      {...canvasProps}
      dpr={pixelRatio[tier]}
      frameloop="never"
      gl={{ antialias: tier === "full" }}
    >
      <TickerFrames />
      {children}
    </Canvas>
  );
}
