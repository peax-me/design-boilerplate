import "../src/styles/globals.css";
import { gsap } from "gsap";
import type { Object3D, Scene } from "three";
import { describe, expect, it } from "vitest";

import { pause, SETTLE_MS } from "./support/pause.ts";
import { renderBlockGroup } from "./support/rendered-block-group.tsx";

function blockGroupIn(scene: Scene): Object3D {
  const group = scene.children.find((child) => child.type === "Group");
  if (group === undefined) {
    throw new Error("The scene holds no block group");
  }
  return group;
}

function movePointer(pointerType: string, clientX: number): void {
  window.dispatchEvent(new PointerEvent("pointermove", { pointerType, clientX }));
}

describe("BlockGroup pointer", () => {
  it("never tilts under a finger, which means scroll on a phone", async () => {
    const { scene } = await renderBlockGroup(false);
    const group = blockGroupIn(scene);

    movePointer("touch", 0);
    await pause(SETTLE_MS);

    expect(group.rotation.y).toBe(0);
  });

  it("follows the mouse through one tween, however often it moves", async () => {
    const { scene } = await renderBlockGroup(false);
    const group = blockGroupIn(scene);

    movePointer("mouse", 0);
    movePointer("mouse", window.innerWidth / 4);
    movePointer("mouse", 0);

    await expect.poll(() => group.rotation.y).toBeLessThan(0);
    expect(gsap.getTweensOf(group.rotation)).toHaveLength(1);
  });
});
