import "../src/styles/globals.css";
import { Mesh, type Scene, ShadowMaterial } from "three";
import { describe, expect, it } from "vitest";

import { pause } from "./support/pause.ts";
import { renderBlockGroup } from "./support/rendered-block-group.tsx";

const FRAMES_MS = 300;

function countShadowGrounds(scene: Scene): number {
  let grounds = 0;
  scene.traverse((object) => {
    if (object instanceof Mesh && object.material instanceof ShadowMaterial) {
      grounds += 1;
    }
  });
  return grounds;
}

describe("BlockGroup", () => {
  it.each([
    { shadows: true, grounds: 1 },
    { shadows: false, grounds: 0 },
  ])("draws $grounds shadow ground when shadows is $shadows", async ({ shadows, grounds }) => {
    const { scene } = await renderBlockGroup(shadows);

    expect(countShadowGrounds(scene)).toBe(grounds);
  });

  it("reports its first frame once, however many frames follow", async () => {
    const { onReady } = await renderBlockGroup(true);

    await pause(FRAMES_MS);

    expect(onReady).toHaveBeenCalledOnce();
  });
});
