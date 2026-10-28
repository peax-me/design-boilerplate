import { commands } from "vitest/browser";

declare module "vitest/browser" {
  interface BrowserCommands {
    emulateReducedMotion: (reduce: boolean) => Promise<void>;
  }
}

export async function preferReducedMotion(): Promise<void> {
  await commands.emulateReducedMotion(true);
}

export async function allowMotion(): Promise<void> {
  await commands.emulateReducedMotion(false);
}
