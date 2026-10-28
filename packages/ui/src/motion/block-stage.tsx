"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import { IsoBlocks } from "../components/iso-blocks.tsx";
import { cn } from "../lib/cn.ts";
import { whenIdle } from "../lib/idle.ts";
import type { Block } from "../lib/isometric.ts";
import { duration, ease, stagger } from "./tokens.ts";

gsap.registerPlugin(useGSAP);

const ALLOW_MOTION = "(prefers-reduced-motion: no-preference)";
const DEPTH_QUERY = `(min-width: 48rem) and ${ALLOW_MOTION}`;
const DROP = -3;

const BlockScene = lazy(async () => {
  const { BlockScene: scene } = await import("../scene/block-scene.tsx");
  return { default: scene };
});

interface BlockStageProps {
  blocks: Block[];
  label: string;
  grain?: string;
  className?: string;
}

export function BlockStage({ blocks, label, grain, className }: BlockStageProps) {
  const stage = useRef<HTMLDivElement>(null);
  const [wantsDepth, setWantsDepth] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => {
    setReady(true);
  }, []);

  useGSAP(
    () => {
      gsap.matchMedia().add(ALLOW_MOTION, () => {
        gsap.from("[data-scene-item]", {
          y: DROP,
          opacity: 0,
          duration: duration.slow,
          ease: ease.emphasized,
          stagger: stagger.tight,
        });
      });
    },
    { scope: stage },
  );

  useEffect(
    () =>
      whenIdle(() => {
        setWantsDepth(window.matchMedia(DEPTH_QUERY).matches);
      }),
    [],
  );

  return (
    <div
      ref={stage}
      data-slot="block-stage"
      data-depth={ready ? "ready" : "poster"}
      className={cn("relative", className)}
    >
      <IsoBlocks
        blocks={blocks}
        label={label}
        grain={grain}
        className={cn("transition-opacity duration-500", ready && "opacity-0")}
      />
      {wantsDepth ? (
        <Suspense fallback={null}>
          <BlockScene
            blocks={blocks}
            grain={grain}
            onReady={onReady}
            className={cn(
              "absolute -inset-12 transition-opacity duration-500",
              ready ? "opacity-100" : "opacity-0",
            )}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
