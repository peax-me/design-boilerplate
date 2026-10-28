import type { SampleLine } from "./code-sample";

export const quickStart: SampleLine[] = [
  { text: "# fork and clone", tone: "muted" },
  { text: "gh repo fork --clone \\" },
  { text: "  peax-me/design-boilerplate" },
  { text: "cd design-boilerplate && pnpm install" },
  { text: "# brief your agent", tone: "muted" },
  { text: 'claude "start a new project"' },
  { text: "# merge on green", tone: "muted" },
  { text: "pnpm check && pnpm test:e2e" },
];
