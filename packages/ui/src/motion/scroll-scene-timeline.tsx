"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

import { ease, scrub } from "./tokens.ts";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ALLOW_MOTION = "(prefers-reduced-motion: no-preference)";

const breakpointQuery = {
  all: ALLOW_MOTION,
  md: `(min-width: 48rem) and ${ALLOW_MOTION}`,
} as const;

export type SceneBreakpoint = keyof typeof breakpointQuery;

interface ScrollSceneTimelineProps {
  track: RefObject<HTMLDivElement | null>;
  choreography: (timeline: gsap.core.Timeline) => void;
  minWidth: SceneBreakpoint;
}

/* One timeline scrubbed across the track, from the breakpoint up and only when motion is allowed. */
export function ScrollSceneTimeline({
  track,
  choreography,
  minWidth,
}: ScrollSceneTimelineProps): null {
  useGSAP(
    () => {
      gsap.matchMedia().add(breakpointQuery[minWidth], () => {
        choreography(
          gsap.timeline({
            defaults: { ease: ease.standard },
            scrollTrigger: {
              trigger: track.current,
              start: "top top",
              end: "bottom bottom",
              scrub,
            },
          }),
        );
      });
    },
    { scope: track },
  );

  return null;
}
