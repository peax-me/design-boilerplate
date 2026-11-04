import { useFrame } from "@react-three/fiber";
import { lazy, useRef } from "react";

import type { SceneProps } from "../../src/motion/stage.tsx";
import { StageCanvas } from "../../src/scene/stage-canvas.tsx";

/* Turned a little so the box reads as a volume. */
const TURN: [number, number, number] = [0.5, 0.6, 0];

function Box({ onReady }: Pick<SceneProps, "onReady">) {
  const drawn = useRef(false);

  useFrame(() => {
    if (drawn.current) {
      return;
    }
    drawn.current = true;
    onReady();
  });

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
