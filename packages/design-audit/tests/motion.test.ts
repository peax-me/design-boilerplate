import { describe, expect, it } from "vitest";

import {
  findBlankCanvases,
  findFrozenCanvases,
  findRenderErrors,
  luminanceDeviation,
  meanDifference,
} from "../src/motion.ts";

const flat = Array.from({ length: 1024 }, () => 12);
const checker = Array.from({ length: 1024 }, (_, index) => (index % 2 === 0 ? 0 : 255));

describe("luminanceDeviation and meanDifference", () => {
  it("measures spread and change", () => {
    expect(luminanceDeviation([0, 255])).toBe(127.5);
    expect(meanDifference([0, 10], [10, 0])).toBe(10);
  });
});

describe("findBlankCanvases", () => {
  it("flags a canvas that renders one flat colour", () => {
    expect(findBlankCanvases([{ canvas: "hero", progress: 0.5, luminance: flat }])).toEqual([
      { rule: "blank-canvas", canvas: "hero", detail: "deviation 0.00 at 50%" },
    ]);
  });

  it("accepts a canvas whose luminance varies", () => {
    expect(findBlankCanvases([{ canvas: "hero", progress: 0, luminance: checker }])).toEqual([]);
  });
});

describe("findFrozenCanvases", () => {
  it("flags an ambient canvas whose frames never change", () => {
    expect(findFrozenCanvases([{ canvas: "hero", first: checker, second: checker }])).toEqual([
      { rule: "frozen-canvas", canvas: "hero", detail: "mean difference 0.00 over 500 ms" },
    ]);
  });

  it("accepts an ambient canvas whose frames change", () => {
    const shifted = checker.map((value) => Math.abs(value - 10));
    expect(findFrozenCanvases([{ canvas: "hero", first: checker, second: shifted }])).toEqual([]);
  });
});

describe("findRenderErrors", () => {
  it("reports WebGL and shader errors only", () => {
    const messages = [
      "THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false",
      "Download the React DevTools for a better development experience",
    ];
    expect(findRenderErrors(messages)).toEqual([
      { rule: "render-error", canvas: "page", detail: messages[0] },
    ]);
  });

  it.each([
    "THREE.WebGLRenderer: Context Lost.",
    "THREE.WebGLRenderer: Error creating WebGL context.",
  ])("reports three's own context failure: %s", (message) => {
    expect(findRenderErrors([message])).toEqual([
      { rule: "render-error", canvas: "page", detail: message },
    ]);
  });

  it("reports nothing when the console is quiet", () => {
    expect(findRenderErrors([])).toEqual([]);
  });
});
