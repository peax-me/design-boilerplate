import type { ComponentProps } from "react";

import { IsoBlocks } from "../../src/components/iso-blocks.tsx";
import { whenIdle } from "../../src/lib/idle.ts";
import { Stage } from "../../src/motion/stage.tsx";
import { plainBox, plainScene } from "../../stories/support/plain-scene.tsx";
import { pause, SETTLE_MS } from "./pause.ts";

type StageProps = ComponentProps<typeof Stage>;

interface BoxStageProps extends Omit<StageProps, "poster" | "renderScene"> {
  name: string;
  renderScene?: StageProps["renderScene"];
}

/* A stage with a named drawing of a box as its poster and, unless told otherwise, the neutral box as its scene. */
export function BoxStage({ name, renderScene = plainScene, ...stageProps }: BoxStageProps) {
  return (
    <Stage
      poster={<IsoBlocks blocks={plainBox} label={name} />}
      renderScene={renderScene}
      {...stageProps}
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
