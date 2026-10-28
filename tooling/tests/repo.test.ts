import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { repoBin, repoRoot } from "../src/repo.ts";

describe("repo paths", () => {
  it("points at the workspace root", () => {
    expect(existsSync(resolve(repoRoot, "pnpm-workspace.yaml"))).toBe(true);
  });

  it("resolves locally installed binaries", () => {
    expect(existsSync(repoBin("oxlint"))).toBe(true);
  });
});
