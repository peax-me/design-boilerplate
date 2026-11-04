"use client";

import { Canvas, type CanvasProps, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect } from "react";

import { pixelRatio, type QualityTier } from "../lib/quality-tier.ts";

/* A gap longer than this between two advanced frames is a pause (offscreen, background tab), not motion. */
const MAX_FRAME_GAP_SECONDS = 0.1;

/* R3F renders only when advanced (frameloop "never"). GSAP's ticker is the one clock for every scene, and a canvas outside the window costs no frame.
   R3F measures delta from its own clock, in the unit of the timestamp given: seconds here. After a pause that clock is reset to the ticker time, so the first frame back has no jump. */
function TickerFrames(): null {
  const advance = useThree((state) => state.advance);
  const clock = useThree((state) => state.clock);
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    let inWindow = false;
    let lastAdvance = Number.NEGATIVE_INFINITY;
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
      if (time - lastAdvance > MAX_FRAME_GAP_SECONDS) {
        clock.elapsedTime = time;
      }
      lastAdvance = time;
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
