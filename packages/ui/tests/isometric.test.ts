import { describe, expect, it } from "vitest";

import {
  type Block,
  blockFaces,
  cornerRadius,
  drawingBounds,
  paintOrder,
  project,
} from "../src/lib/isometric.ts";

const cube: Block = {
  id: "cube",
  x: 0,
  y: 0,
  z: 0,
  width: 1,
  depth: 1,
  height: 1,
  material: "maple",
};

describe("isometric projection", () => {
  it("projects the ground axes down and sideways, and height straight up", () => {
    const [xRight, xDown] = project(1, 0, 0);
    const [yRight, yDown] = project(0, 1, 0);
    expect(xRight).toBeCloseTo(Math.sqrt(3) / 2);
    expect(xDown).toBeCloseTo(0.5);
    expect(yRight).toBeCloseTo(-Math.sqrt(3) / 2);
    expect(yDown).toBeCloseTo(0.5);
    expect(project(0, 0, 1)).toEqual([0, -1]);
  });

  it("returns the three visible faces of a block", () => {
    const faces = blockFaces(cube);
    expect(faces.top).toHaveLength(4);
    expect(faces.top[0]).toEqual(project(0, 0, 1));
    expect(faces.left[0]).toEqual(project(0, 1, 0));
    expect(faces.right[0]).toEqual(project(1, 0, 0));
  });

  it("draws far blocks before near ones", () => {
    const near = { ...cube, id: "near", x: 2, y: 2 };
    const far = { ...cube, id: "far" };
    const stacked = { ...cube, id: "stacked", z: 1 };
    expect(paintOrder([near, stacked, far]).map((block) => block.id)).toEqual([
      "far",
      "stacked",
      "near",
    ]);
  });

  it("draws a long plank in front of a block it covers", () => {
    const block = { ...cube, id: "block", x: 8, y: 2, width: 3, depth: 3, height: 2 };
    const plank = { ...cube, id: "plank", x: 0, y: 6, width: 11, depth: 2, height: 1 };
    expect(paintOrder([plank, block]).map((piece) => piece.id)).toEqual(["block", "plank"]);
  });

  it("draws a block before the one stacked on it", () => {
    const base = { ...cube, id: "base", width: 3, depth: 3 };
    const top = { ...cube, id: "top", x: 1, y: 1, z: 1 };
    expect(paintOrder([top, base]).map((piece) => piece.id)).toEqual(["base", "top"]);
  });

  it("frames every block with a margin", () => {
    const bounds = drawingBounds([cube], 0.5);
    const [right] = project(1, 0, 0);
    expect(bounds.x).toBeCloseTo(-right - 0.5);
    expect(bounds.y).toBeCloseTo(-1.5);
    expect(bounds.width).toBeCloseTo(right * 2 + 1);
    expect(bounds.height).toBeCloseTo(3);
  });
});

describe("corner radius", () => {
  it("follows the corner scale and never exceeds half the thinnest side", () => {
    expect(cornerRadius(cube, 0)).toBe(0);
    expect(cornerRadius(cube, 1)).toBeCloseTo(1 / 12);
    expect(cornerRadius({ ...cube, height: 0.1 }, 3)).toBeCloseTo(0.04);
  });
});
