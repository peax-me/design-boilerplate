import { IsoBlocks } from "../../src/components/iso-blocks.tsx";
import { whenIdle } from "../../src/lib/idle.ts";
import type { Block } from "../../src/lib/isometric.ts";
import { Stage } from "../../src/motion/stage.tsx";
import { plainScene } from "../../stories/support/plain-scene.tsx";

/* Time for the work an idle stage starts (tier, observers, listeners) to settle. */
const SETTLE_MS = 500;

const box: Block[] = [
  { id: "box", x: 0, y: 0, z: 0, width: 2, depth: 2, height: 2, material: "paper" },
];

interface BoxStageProps {
  name: string;
  ambient?: boolean;
}

/* A stage with a named drawing of a box as its poster and the neutral box as its scene. */
export function BoxStage({ name, ambient = false }: BoxStageProps) {
  return (
    <Stage poster={<IsoBlocks blocks={box} label={name} />} scene={plainScene} ambient={ambient} />
  );
}

export function stageAt(container: HTMLElement, index = 0): HTMLElement {
  const stage = container.querySelectorAll<HTMLElement>("[data-slot='stage']")[index];
  if (stage === undefined) {
    throw new Error(`No stage at ${index}`);
  }
  return stage;
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/* Idle callbacks run in order: the stage asked first, so its idle work has run when this resolves. */
export async function afterIdle(): Promise<void> {
  await new Promise<void>((resolve) => {
    whenIdle(resolve);
  });
  await pause(SETTLE_MS);
}
