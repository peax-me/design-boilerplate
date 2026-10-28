import { resolve } from "node:path";

export const repoRoot = resolve(import.meta.dirname, "../..");

export function repoBin(name: string): string {
  return resolve(repoRoot, "node_modules/.bin", name);
}
