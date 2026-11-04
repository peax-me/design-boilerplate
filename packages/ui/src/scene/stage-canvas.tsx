"use client";

import { Canvas, type CanvasProps, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect } from "react";

import { pixelRatio, type QualityTier } from "../lib/quality-tier.ts";

/* R3F renders only when advanced (frameloop "never"): one clock, GSAP's, drives every scene, and an offscreen canvas costs no frame. */
function TickerFrames(): null {
  const advance = useThree((state) => state.advance);
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
      if (inWindow) {
        advance(time * 1000);
      }
    }
    gsap.ticker.add(advanceInWindow);

    return () => {
      gsap.ticker.remove(advanceInWindow);
      observer.disconnect();
    };
  }, [advance, canvas]);

  return null;
}

interface StageCanvasProps extends Omit<CanvasProps, "dpr" | "frameloop"> {
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
