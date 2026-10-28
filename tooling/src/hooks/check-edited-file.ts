import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { isFormattable, isLintable, readEditedFile } from "../hook-input.ts";
import { repoBin, repoRoot } from "../repo.ts";

const BLOCKING_EXIT_CODE = 2;

function run(binary: string, args: string[]): string | undefined {
  const result = spawnSync(repoBin(binary), args, { cwd: repoRoot, encoding: "utf8" });
  return result.status === 0 ? undefined : `${result.stdout}${result.stderr}`;
}

const payload: unknown = JSON.parse(readFileSync(0, "utf8"));
const edited = readEditedFile(payload);
const failures = [
  edited !== undefined && isFormattable(edited.filePath)
    ? run("oxfmt", [edited.filePath])
    : undefined,
  edited !== undefined && isLintable(edited.filePath)
    ? run("oxlint", ["--type-aware", "--deny-warnings", edited.filePath])
    : undefined,
].filter((failure) => failure !== undefined);

if (failures.length > 0) {
  console.error(`Fix these issues before continuing:\n${failures.join("\n")}`);
  process.exitCode = BLOCKING_EXIT_CODE;
}
