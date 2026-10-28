import { describe, expect, it } from "vitest";

import { type ElementSnapshot, findDesignViolations, type TokenScales } from "../src/analyze.ts";

const scales: TokenScales = {
  spacing: ["0px", "4px", "8px", "16px", "24px"],
  fontSize: ["14px", "16px", "24px"],
  radius: ["0px", "6px", "10px"],
};

function snapshot(overrides: Partial<ElementSnapshot> = {}): ElementSnapshot {
  return {
    id: 1,
    parentId: null,
    label: "div",
    layout: "flow",
    inFlow: true,
    interactive: false,
    padding: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    gap: { row: "normal", column: "normal" },
    fontSize: "16px",
    radius: "0px",
    box: { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 },
    ...overrides,
  };
}

describe("findDesignViolations", () => {
  it("accepts an element built only from tokens", () => {
    const element = snapshot({
      padding: { top: "8px", right: "16px", bottom: "8px", left: "16px" },
      gap: { row: "24px", column: "24px" },
      radius: "10px",
    });
    expect(findDesignViolations(scales, [element])).toEqual([]);
  });

  it("reports paddings and gaps outside the spacing scale", () => {
    const element = snapshot({
      padding: { top: "13px", right: "16px", bottom: "13px", left: "16px" },
      gap: { row: "normal", column: "10px" },
    });
    expect(findDesignViolations(scales, [element])).toEqual([
      { rule: "off-scale-spacing", element: "div", detail: "13px" },
      { rule: "off-scale-spacing", element: "div", detail: "13px" },
      { rule: "off-scale-spacing", element: "div", detail: "10px" },
    ]);
  });

  it("reports font sizes outside the type scale", () => {
    const element = snapshot({ label: "p[data-slot=text]", fontSize: "15px" });
    expect(findDesignViolations(scales, [element])).toEqual([
      { rule: "off-scale-font-size", element: "p[data-slot=text]", detail: "15px" },
    ]);
  });

  it("reports radii outside the scale but accepts fully rounded shapes", () => {
    const pill = snapshot({ id: 1, radius: "3.35544e+07px" });
    const odd = snapshot({ id: 2, radius: "7px" });
    expect(findDesignViolations(scales, [pill, odd])).toEqual([
      { rule: "off-scale-radius", element: "div", detail: "7px" },
    ]);
  });

  it("reports asymmetric paddings", () => {
    const element = snapshot({
      padding: { top: "8px", right: "16px", bottom: "8px", left: "8px" },
    });
    expect(findDesignViolations(scales, [element])).toEqual([
      { rule: "asymmetric-padding", element: "div", detail: "8px 16px 8px 8px" },
    ]);
  });

  it("reports interactive targets smaller than 24px", () => {
    const element = snapshot({
      label: "button",
      interactive: true,
      box: { left: 0, top: 0, right: 20, bottom: 20, width: 20, height: 20 },
    });
    expect(findDesignViolations(scales, [element])).toEqual([
      { rule: "small-target", element: "button", detail: "20x20" },
    ]);
  });

  it("accepts interactive targets of at least 24px in both dimensions", () => {
    const comfortable = snapshot({ id: 1, label: "button", interactive: true });
    const flat = snapshot({
      id: 2,
      label: "a[data-slot=button-link]",
      interactive: true,
      box: { left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 },
    });
    expect(findDesignViolations(scales, [comfortable, flat])).toEqual([
      { rule: "small-target", element: "a[data-slot=button-link]", detail: "100x20" },
    ]);
  });

  it("reports overlapping siblings inside flex and grid containers only", () => {
    const flexParent = snapshot({ id: 1, label: "div[data-slot=stack]", layout: "flex" });
    const flowParent = snapshot({ id: 2, label: "section" });
    const box = { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 };
    const shifted = { left: 0, top: 30, right: 100, bottom: 70, width: 100, height: 40 };
    const elements = [
      flexParent,
      flowParent,
      snapshot({ id: 3, parentId: 1, label: "h2", box }),
      snapshot({ id: 4, parentId: 1, label: "p", box: shifted }),
      snapshot({ id: 5, parentId: 2, label: "h2", box }),
      snapshot({ id: 6, parentId: 2, label: "p", box: shifted }),
    ];
    expect(findDesignViolations(scales, elements)).toEqual([
      { rule: "overlap", element: "h2", detail: "overlaps p" },
    ]);
  });

  it("ignores out-of-flow children when looking for overlaps", () => {
    const box = { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 };
    const elements = [
      snapshot({ id: 1, layout: "grid" }),
      snapshot({ id: 2, parentId: 1, box }),
      snapshot({ id: 3, parentId: 1, box, inFlow: false }),
    ];
    expect(findDesignViolations(scales, elements)).toEqual([]);
  });
});
