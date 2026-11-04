import type { SceneProps } from "../../src/motion/stage.tsx";
import { StageCanvas } from "../../src/scene/stage-canvas.tsx";
import { useFirstFrame } from "../../src/scene/use-first-frame.ts";
import { FrameCounter } from "./frame-counter.tsx";

function FirstFrame({ onReady }: Pick<SceneProps, "onReady">): null {
  useFirstFrame(onReady);
  return null;
}

/* A stage scene that reports each frame it draws. */
export function countedScene(onFrame: () => void) {
  return function renderCountedScene({ tier, onReady }: SceneProps) {
    return (
      <StageCanvas tier={tier}>
        <FirstFrame onReady={onReady} />
        <FrameCounter onFrame={onFrame} />
      </StageCanvas>
    );
  };
}
