import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { presetGroups } from "../src/theme/presets.ts";

const theme = readFileSync(new URL("../src/styles/theme.css", import.meta.url), "utf8");

describe("token presets", () => {
  it("declares every option as a selector in theme.css", () => {
    for (const group of presetGroups) {
      for (const option of group.options) {
        expect(theme).toContain(`[${group.attribute}="${option.value}"]`);
      }
    }
  });

  it("lists the default option of each group first", () => {
    for (const group of presetGroups) {
      expect(group.options[0]?.value).toBe(group.defaultValue);
    }
  });
});
