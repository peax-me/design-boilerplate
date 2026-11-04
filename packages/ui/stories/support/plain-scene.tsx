import { lazy } from "react";

import type { Block } from "../../src/lib/isometric.ts";
import type { SceneProps } from "../../src/motion/stage.tsx";
import { StageCanvas } from "../../src/scene/stage-canvas.tsx";
import { useFirstFrame } from "../../src/scene/use-first-frame.ts";

/* The same box drawn flat, for a poster. */
export const plainBox: Block[] = [
  { id: "box", x: 0, y: 0, z: 0, width: 2, depth: 2, height: 2, material: "paper" },
];

/* Turned a little so the box reads as a volume. */
const TURN: [number, number, number] = [0.5, 0.6, 0];

function Box({ onReady }: Pick<SceneProps, "onReady">) {
  useFirstFrame(onReady);

  return (
    <mesh rotation={TURN}>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  );
}

/* A neutral box: ready once its first frame is drawn, its tier readable on the canvas. */
function PlainScene({ tier, onReady }: SceneProps) {
  return (
    <StageCanvas tier={tier} data-tier={tier}>
      <Box onReady={onReady} />
    </StageCanvas>
  );
}

/* Lazy like a real scene, so the stage's Suspense boundary is exercised; a real effect imports its scene module there. */
const LazyPlainScene = lazy(() => Promise.resolve({ default: PlainScene }));

export function plainScene(scene: SceneProps) {
  return <LazyPlainScene {...scene} />;
}
