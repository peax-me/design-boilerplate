"use client";

import { cva } from "class-variance-authority";
import { lazy, type ReactNode, useRef } from "react";

import { AfterIdle } from "./after-idle.tsx";
import type { SceneBreakpoint, SceneScrub } from "./scroll-scene-timeline.tsx";
import { sceneLength } from "./tokens.ts";

const LazyScrollSceneTimeline = lazy(async () => {
  const { ScrollSceneTimeline } = await import("./scroll-scene-timeline.tsx");
  return { default: ScrollSceneTimeline };
});

/* With motion, the stage sticks to the top of the window: CSS holds it in place, so nothing shifts the layout.
   The stage and its holds are measured in small-viewport units: a phone's toolbar that collapses or returns mid-scroll resizes neither the stage, its content nor the track, so the scrub, measured once, stays in step with the hold. */
const stageVariants = cva("grid grid-cols-1 place-items-center overflow-clip", {
  variants: {
    minWidth: {
      all: "motion-safe:sticky motion-safe:top-0 motion-safe:h-svh motion-reduce:py-24",
      md: "py-24 md:motion-safe:sticky md:motion-safe:top-0 md:motion-safe:h-svh md:motion-safe:py-0",
    },
  },
});

/* One window of scroll after the stage, during which the stage stays held and the story scrubs. */
const holdVariants = cva("h-svh", {
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
  minWidth?: SceneBreakpoint;
  /* direct for a world that smooths itself (a spring): a scrub on top would leave it behind its copy. */
  scrub?: SceneScrub;
}

export function ScrollScene({
  children,
  still,
  choreography,
  length = "medium",
  minWidth = "all",
  scrub = "smoothed",
}: ScrollSceneProps) {
  const track = useRef<HTMLDivElement>(null);

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
      <AfterIdle>
        <LazyScrollSceneTimeline
          track={track}
          choreography={choreography}
          minWidth={minWidth}
          scrub={scrub}
        />
      </AfterIdle>
    </div>
  );
}
