"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { lazy, useRef } from "react";

import { IsoBlocks } from "../components/iso-blocks.tsx";
import type { Block } from "../lib/isometric.ts";
import { Stage } from "./stage.tsx";
import { duration, ease, stagger } from "./tokens.ts";

gsap.registerPlugin(useGSAP);

const ALLOW_MOTION = "(prefers-reduced-motion: no-preference)";
const DROP = -3;

const LazyBlockScene = lazy(async () => {
  const { BlockScene } = await import("../scene/block-scene.tsx");
  return { default: BlockScene };
});

interface BlockStageProps {
  blocks: Block[];
  label: string;
  grain?: string;
  className?: string;
}

export function BlockStage({ blocks, label, grain, className }: BlockStageProps) {
  const drawing = useRef<HTMLDivElement>(null);

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
    { scope: drawing },
  );

  return (
    <div ref={drawing} data-slot="block-stage" className={className}>
      <Stage
        poster={<IsoBlocks blocks={blocks} label={label} grain={grain} />}
        renderScene={(scene) => (
          <LazyBlockScene {...scene} blocks={blocks} grain={grain} className="absolute -inset-12" />
        )}
      />
    </div>
  );
}
