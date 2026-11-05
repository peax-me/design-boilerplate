"use client";

import { type ReactNode, Suspense } from "react";

import { SilentBoundary } from "../lib/silent-boundary.tsx";
import { useIdle } from "../lib/use-idle.ts";

interface AfterIdleProps {
  /* Usually a lazy component: its module, and GSAP or Lenis with it, loads only then, so the first paint never waits for it. */
  children: ReactNode;
}

/* Renders its children once the page is idle, in boundaries of their own: a lazy child never suspends the page around it, and one that fails to load (a dropped request, a chunk replaced by a deploy) leaves the page without its motion, complete as under reduced motion. */
export function AfterIdle({ children }: AfterIdleProps) {
  const idle = useIdle();

  if (!idle) {
    return null;
  }
  return (
    <SilentBoundary>
      <Suspense fallback={null}>{children}</Suspense>
    </SilentBoundary>
  );
}
