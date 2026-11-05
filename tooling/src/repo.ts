import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const repoRoot = resolve(import.meta.dirname, "../..");

export function repoBin(name: string, root = repoRoot): string {
  return resolve(root, "node_modules/.bin", name);
}

/* The workspace that holds a file. A git worktree nested inside a checkout is a workspace of its own, with its own lint config and binaries; a file outside any workspace belongs to this repository. */
export function workspaceRootOf(filePath: string): string {
  const directory = dirname(filePath);
  if (existsSync(resolve(directory, "pnpm-workspace.yaml"))) {
    return directory;
  }
  if (dirname(directory) === directory) {
    return repoRoot;
  }
  return workspaceRootOf(directory);
}
