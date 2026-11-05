import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { isFormattable, isLintable, readEditedFile } from "../hook-input.ts";
import { repoBin, repoRoot, workspaceRootOf } from "../repo.ts";

const BLOCKING_EXIT_CODE = 2;

/* Each file is checked by the workspace that holds it, with that workspace's binaries and config: a worktree nested in this checkout inherits these hooks, but not this checkout's lint. */
function run(root: string, binary: string, args: string[]): string | undefined {
  const result = spawnSync(repoBin(binary, root), args, { cwd: root, encoding: "utf8" });
  return result.status === 0 ? undefined : `${result.stdout}${result.stderr}`;
}

const payload: unknown = JSON.parse(readFileSync(0, "utf8"));
const edited = readEditedFile(payload);
const root = edited === undefined ? repoRoot : workspaceRootOf(edited.filePath);
const failures = [
  edited !== undefined && isFormattable(edited.filePath)
    ? run(root, "oxfmt", [edited.filePath])
    : undefined,
  edited !== undefined && isLintable(edited.filePath)
    ? run(root, "oxlint", ["--type-aware", "--deny-warnings", edited.filePath])
    : undefined,
].filter((failure) => failure !== undefined);

if (failures.length > 0) {
  console.error(`Fix these issues before continuing:\n${failures.join("\n")}`);
  process.exitCode = BLOCKING_EXIT_CODE;
}
