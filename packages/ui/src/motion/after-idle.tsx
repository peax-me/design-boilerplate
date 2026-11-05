"use client";

import { type ReactNode, Suspense } from "react";

import { useIdle } from "../lib/use-idle.ts";

interface AfterIdleProps {
  /* Usually a lazy component: its module, and GSAP or Lenis with it, loads only then, so the first paint never waits for it. */
  children: ReactNode;
}

/* Renders its children once the page is idle, in a boundary of their own: a lazy child never suspends the page around it. */
export function AfterIdle({ children }: AfterIdleProps) {
  const idle = useIdle();

  if (!idle) {
    return null;
  }
  return <Suspense fallback={null}>{children}</Suspense>;
}
