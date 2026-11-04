"use client";

import { useState } from "react";

import type { Block } from "../lib/isometric.ts";
import type { SceneProps } from "../motion/stage.tsx";
import { BlockGroup } from "./block-group.tsx";
import { IsometricCamera } from "./isometric-camera.tsx";
import { StageCanvas } from "./stage-canvas.tsx";

interface BlockSceneProps extends SceneProps {
  blocks: Block[];
  grain: string | undefined;
  className?: string;
}

export function BlockScene({ blocks, grain, tier, onReady, className }: BlockSceneProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const shadows = tier === "full";
  return (
    <div ref={setHost} className={className}>
      {host === null ? null : (
        <StageCanvas tier={tier} flat shadows={shadows}>
          <IsometricCamera blocks={blocks} bleed={-host.offsetLeft} />
          <ambientLight intensity={2} />
          <directionalLight
            castShadow
            intensity={1.6}
            position={[6, 30, 16]}
            shadow-mapSize={[1024, 1024]}
          >
            <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.1, 100]} />
          </directionalLight>
          <BlockGroup
            blocks={blocks}
            grain={grain}
            host={host}
            shadows={shadows}
            onReady={onReady}
          />
        </StageCanvas>
      )}
    </div>
  );
}
