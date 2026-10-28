"use client";

import { useEffect, useState } from "react";

import { whenIdle } from "../lib/idle.ts";
import { ACROSS, DOWN } from "../lib/isometric.ts";

/* One grain tile spans the same block length as on the 3D stage, laid along each face's axes. */
const GRAIN_SPAN = 1 / 0.3;
const grainAxes = {
  top: `matrix(${ACROSS} ${DOWN} ${-ACROSS} ${DOWN} 0 0)`,
  left: `matrix(${ACROSS} ${DOWN} 0 1 0 0)`,
  right: `matrix(${-ACROSS} ${DOWN} 0 1 0 0)`,
} as const;

export type FaceName = keyof typeof grainAxes;

/* The texture loads once the page is idle so it never delays the first paint; faces stay plain until then. */
export function GrainPatterns({ id, grain }: { id: string; grain: string }) {
  const [ready, setReady] = useState(false);
  useEffect(
    () =>
      whenIdle(() => {
        setReady(true);
      }),
    [],
  );
  if (!ready) {
    return null;
  }
  return (
    <defs>
      {Object.entries(grainAxes).map(([face, axes]) => (
        <pattern
          key={face}
          id={`${id}-${face}`}
          patternUnits="userSpaceOnUse"
          width={GRAIN_SPAN}
          height={GRAIN_SPAN}
          patternTransform={axes}
        >
          <image href={grain} width={GRAIN_SPAN} height={GRAIN_SPAN} preserveAspectRatio="none" />
        </pattern>
      ))}
    </defs>
  );
}
