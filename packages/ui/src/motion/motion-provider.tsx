"use client";

import { lazy, type ReactNode } from "react";

import { AfterIdle } from "./after-idle.tsx";

const LazySmoothScroll = lazy(async () => {
  const { SmoothScroll } = await import("./smooth-scroll.tsx");
  return { default: SmoothScroll };
});

interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <>
      {children}
      <AfterIdle>
        <LazySmoothScroll />
      </AfterIdle>
    </>
  );
}
