import type { ReactNode } from "react";

import { IsoBlocks } from "../../src/components/iso-blocks.tsx";
import { whenIdle } from "../../src/lib/idle.ts";
import { type SceneProps, Stage } from "../../src/motion/stage.tsx";
import { plainBox, plainScene } from "../../stories/support/plain-scene.tsx";
import { pause } from "./pause.ts";

/* Time for the work an idle stage starts (tier, observers, listeners) to settle. */
const SETTLE_MS = 500;

interface BoxStageProps {
  name: string;
  ambient?: boolean;
  renderScene?: (scene: SceneProps) => ReactNode;
}

/* A stage with a named drawing of a box as its poster and, unless told otherwise, the neutral box as its scene. */
export function BoxStage({ name, ambient = false, renderScene = plainScene }: BoxStageProps) {
  return (
    <Stage
      poster={<IsoBlocks blocks={plainBox} label={name} />}
      renderScene={renderScene}
      ambient={ambient}
    />
  );
}

export function stageAt(container: HTMLElement, index = 0): HTMLElement {
  const stage = container.querySelectorAll<HTMLElement>("[data-slot='stage']")[index];
  if (stage === undefined) {
    throw new Error(`No stage at ${index}`);
  }
  return stage;
}

/* Idle callbacks run in order: the stage asked first, so its idle work has run when this resolves. */
export async function afterIdle(): Promise<void> {
  await new Promise<void>((resolve) => {
    whenIdle(resolve);
  });
  await pause(SETTLE_MS);
}
