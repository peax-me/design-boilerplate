import type { BrowserCommandContext } from "vitest/node";

export async function emulateReducedMotion(
  { page }: BrowserCommandContext,
  reduce: boolean,
): Promise<void> {
  await page.emulateMedia({ reducedMotion: reduce ? "reduce" : "no-preference" });
}
