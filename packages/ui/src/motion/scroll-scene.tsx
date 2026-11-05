"use client";

import { useGSAP } from "@gsap/react";
import { cva } from "class-variance-authority";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useRef } from "react";

import { ease, sceneLength, scrub } from "./tokens.ts";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ALLOW_MOTION = "(prefers-reduced-motion: no-preference)";

const breakpointQuery = {
  all: ALLOW_MOTION,
  md: `(min-width: 48rem) and ${ALLOW_MOTION}`,
} as const;

/* With motion, the stage sticks to the top of the window: CSS holds it in place, so nothing shifts the layout. */
const stageVariants = cva("grid grid-cols-1 place-items-center overflow-clip", {
  variants: {
    minWidth: {
      all: "motion-safe:sticky motion-safe:top-0 motion-safe:h-dvh motion-reduce:py-24",
      md: "py-24 md:motion-safe:sticky md:motion-safe:top-0 md:motion-safe:h-dvh md:motion-safe:py-0",
    },
  },
});

/* One window of scroll after the stage, during which the stage stays held and the story scrubs. */
const holdVariants = cva("h-dvh", {
  variants: {
    minWidth: {
      all: "motion-reduce:hidden",
      md: "hidden md:motion-safe:block",
    },
  },
});

interface ScrollSceneProps {
  children: ReactNode;
  /* Shown instead of the scene under reduced motion: every stage of the story as a still plate. */
  still?: ReactNode;
  choreography: (timeline: gsap.core.Timeline) => void;
  length?: keyof typeof sceneLength;
  minWidth?: keyof typeof breakpointQuery;
}

export function ScrollScene({
  children,
  still,
  choreography,
  length = "medium",
  minWidth = "all",
}: ScrollSceneProps) {
  const track = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={track} data-slot="scroll-scene">
      <div className={stageVariants({ minWidth })}>
        {still === undefined ? (
          children
        ) : (
          <>
            <div className="w-full motion-reduce:hidden">{children}</div>
            <div className="hidden w-full motion-reduce:block">{still}</div>
          </>
        )}
      </div>
      {Array.from({ length: sceneLength[length] }, (_, screen) => (
        <div key={screen} className={holdVariants({ minWidth })} />
      ))}
    </div>
  );
}
