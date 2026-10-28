import "../src/styles/globals.css";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveMaterial } from "../src/lib/css-color.ts";

afterEach(() => {
  delete document.documentElement.dataset["paint"];
  vi.restoreAllMocks();
});

describe("resolveMaterial", () => {
  it("reads a paint token as sRGB channels", () => {
    const [red, green, blue] = resolveMaterial(document.body, "lacquer");

    expect(red).toBeGreaterThan(200);
    expect(green).toBeGreaterThan(150);
    expect(blue).toBeLessThan(120);
  });

  it("follows the paint preset on the page", () => {
    document.documentElement.dataset["paint"] = "green";

    const [red, green] = resolveMaterial(document.body, "lacquer");

    expect(green).toBeGreaterThan(red);
  });

  it("falls back to black when the browser has no 2D canvas", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    expect(resolveMaterial(document.body, "lacquer")).toEqual([0, 0, 0]);
  });
});
