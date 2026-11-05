"use client";

import { lazy, useRef } from "react";

import { IsoBlocks } from "../components/iso-blocks.tsx";
import type { Block } from "../lib/isometric.ts";
import { AfterIdle } from "./after-idle.tsx";
import { Stage } from "./stage.tsx";

/* One import for the stage to prepare and the lazy scene to render. */
function loadBlockScene() {
  return import("../scene/block-scene.tsx");
}

const LazyBlockScene = lazy(async () => {
  const { BlockScene } = await loadBlockScene();
  return { default: BlockScene };
});

const LazyDropIn = lazy(async () => {
  const { DropIn } = await import("./drop-in.tsx");
  return { default: DropIn };
});

interface BlockStageProps {
  blocks: Block[];
  label: string;
  grain?: string;
  className?: string;
}

export function BlockStage({ blocks, label, grain, className }: BlockStageProps) {
  const drawing = useRef<HTMLDivElement>(null);

  return (
    <div ref={drawing} data-slot="block-stage" className={className}>
      <Stage
        poster={<IsoBlocks blocks={blocks} label={label} grain={grain} />}
        prepareScene={loadBlockScene}
        renderScene={(scene) => (
          <LazyBlockScene {...scene} blocks={blocks} grain={grain} className="absolute -inset-12" />
        )}
      />
      <AfterIdle>
        <LazyDropIn scope={drawing} />
      </AfterIdle>
    </div>
  );
}
