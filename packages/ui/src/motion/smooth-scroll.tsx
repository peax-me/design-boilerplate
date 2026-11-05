"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

function startSmoothScroll(): (() => void) | undefined {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return undefined;
  }

  const lenis = new Lenis({ autoRaf: false, anchors: true });
  function tick(seconds: number): void {
    lenis.raf(seconds * 1000);
  }

  lenis.on("scroll", () => {
    ScrollTrigger.update();
  });
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}

/* Lenis driven by GSAP's ticker, so smooth scrolling and ScrollTrigger share one frame loop. */
export function SmoothScroll(): null {
  useEffect(startSmoothScroll, []);
  return null;
}
