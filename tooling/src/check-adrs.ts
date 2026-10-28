import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { findAdrProblems } from "./adr.ts";
import { repoRoot } from "./repo.ts";

const adrDirectory = resolve(repoRoot, "docs/adr");
const files = readdirSync(adrDirectory)
  .filter((name) => /^\d/u.test(name))
  .map((name) => ({ name, content: readFileSync(resolve(adrDirectory, name), "utf8") }));

const problems = findAdrProblems(files);
for (const { file, problem } of problems) {
  console.error(`docs/adr/${file}: ${problem}`);
}
process.exitCode = problems.length === 0 ? 0 : 1;
