import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { repoBin, repoRoot, workspaceRootOf } from "../src/repo.ts";

const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(resolve(tmpdir(), "workspace-root-"));
  temporaryDirectories.push(directory);
  return directory;
}

function workspaceAt(directory: string): string {
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, "pnpm-workspace.yaml"), "packages: []\n");
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("repo paths", () => {
  it("points at the workspace root", () => {
    expect(existsSync(resolve(repoRoot, "pnpm-workspace.yaml"))).toBe(true);
  });

  it("resolves locally installed binaries", () => {
    expect(existsSync(repoBin("oxlint"))).toBe(true);
  });

  it("resolves a binary of another workspace from that workspace", () => {
    expect(repoBin("oxlint", "/elsewhere")).toBe("/elsewhere/node_modules/.bin/oxlint");
  });
});

describe("workspaceRootOf", () => {
  it("finds this repository for its own files", () => {
    expect(workspaceRootOf(resolve(repoRoot, "tooling/src/repo.ts"))).toBe(repoRoot);
  });

  it("finds a worktree nested in a checkout, not the checkout around it", () => {
    const checkout = workspaceAt(temporaryDirectory());
    const worktree = workspaceAt(resolve(checkout, ".claude/worktrees/feature"));

    expect(workspaceRootOf(resolve(worktree, "packages/ui/src/stage.tsx"))).toBe(worktree);
  });

  it("falls back to this repository for a file outside any workspace", () => {
    expect(workspaceRootOf(resolve(temporaryDirectory(), "notes/file.ts"))).toBe(repoRoot);
  });
});
