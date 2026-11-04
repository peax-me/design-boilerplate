import "../src/styles/globals.css";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Mesh, type Scene, ShadowMaterial } from "three";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { Block } from "../src/lib/isometric.ts";
import { BlockGroup } from "../src/scene/block-group.tsx";
import { StageCanvas } from "../src/scene/stage-canvas.tsx";
import { LIVE_TIMEOUT } from "./support/live-timeout.ts";
import { pause } from "./support/pause.ts";

const FRAMES_MS = 300;
const STAGE = { width: 240, height: 120 };

const blocks: Block[] = [
  { id: "plank", x: 0, y: 0, z: 0, width: 4, depth: 1, height: 1, material: "maple" },
  { id: "cube", x: 0, y: 2, z: 0, width: 2, depth: 2, height: 2, material: "lacquer" },
];

function SceneProbe({ onScene }: { onScene: (scene: Scene) => void }) {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    onScene(scene);
  }, [onScene, scene]);
  return null;
}

function countShadowGrounds(scene: Scene): number {
  let grounds = 0;
  scene.traverse((object) => {
    if (object instanceof Mesh && object.material instanceof ShadowMaterial) {
      grounds += 1;
    }
  });
  return grounds;
}

async function renderGroup(shadows: boolean) {
  const onScene = vi.fn<(scene: Scene) => void>();
  const onReady = vi.fn<() => void>();
  await render(
    <div style={STAGE}>
      <StageCanvas tier="full" shadows={shadows}>
        <SceneProbe onScene={onScene} />
        <BlockGroup
          blocks={blocks}
          grain={undefined}
          host={document.body}
          shadows={shadows}
          onReady={onReady}
        />
      </StageCanvas>
    </div>,
  );
  await expect.poll(() => onReady.mock.calls.length, LIVE_TIMEOUT).toBeGreaterThan(0);
  const scene = onScene.mock.lastCall?.[0];
  if (scene === undefined) {
    throw new Error("The canvas never exposed its scene");
  }
  return { scene, onReady };
}

describe("BlockGroup", () => {
  it.each([
    { shadows: true, grounds: 1 },
    { shadows: false, grounds: 0 },
  ])("draws $grounds shadow ground when shadows is $shadows", async ({ shadows, grounds }) => {
    const { scene } = await renderGroup(shadows);

    expect(countShadowGrounds(scene)).toBe(grounds);
  });

  it("reports its first frame once, however many frames follow", async () => {
    const { onReady } = await renderGroup(true);

    await pause(FRAMES_MS);

    expect(onReady).toHaveBeenCalledOnce();
  });
});
