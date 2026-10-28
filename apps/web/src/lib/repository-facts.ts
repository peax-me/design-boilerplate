import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface RepositoryFacts {
  tokens: number;
  components: number;
  skills: number;
  decisions: number;
  performanceBudget: number;
}

const COMPONENT_FOLDERS = ["components", "layout", "typography", "motion"];
const DECLARATION = /^\s*(--[\w-]+(?:\\\.[\w-]+)?)\s*:/gmu;
const PERFORMANCE = /"categories:performance":\s*\[\s*"error",\s*\{\s*"minScore":\s*([\d.]+)/u;
const DECISION_FILE = /^\d{4}-.+\.md$/u;

export function themeTokens(css: string): string[] {
  return css
    .split("@theme")
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf("\n}")))
    .flatMap((block) => [...block.matchAll(DECLARATION)].map((match) => String(match[1])))
    .filter((name) => !name.slice(2).includes("--") && !name.startsWith("--default-"));
}

export function performanceBudget(lighthouseConfig: string): number {
  const score = PERFORMANCE.exec(lighthouseConfig)?.[1];
  return score === undefined ? 0 : Math.round(Number(score) * 100);
}

function read(root: string, path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function countEntries(root: string, path: string, keep: (name: string) => boolean): number {
  return readdirSync(join(root, path)).filter((name) => keep(name)).length;
}

export function readRepositoryFacts(root: string): RepositoryFacts {
  return {
    tokens: themeTokens(read(root, "packages/ui/src/styles/theme.css")).length,
    components: COMPONENT_FOLDERS.reduce(
      (total, folder) =>
        total + countEntries(root, `packages/ui/src/${folder}`, (name) => name.endsWith(".tsx")),
      0,
    ),
    skills: countEntries(root, ".claude/skills", (name) => !name.startsWith(".")),
    decisions: countEntries(root, "docs/adr", (name) => DECISION_FILE.test(name)),
    performanceBudget: performanceBudget(read(root, "apps/web/lighthouserc.json")),
  };
}
