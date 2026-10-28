import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { performanceBudget, readRepositoryFacts, themeTokens } from "../src/lib/repository-facts";

const css = `
@theme static {
  --*: initial;
  --spacing-0\\.5: 0.125rem;
  --spacing-4: 1rem;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.125rem;
  --default-font-family: var(--font-sans);
}

@theme static inline {
  --color-accent: var(--accent);
}

:root {
  --accent: yellow;
}

`;

describe("repository facts", () => {
  it("lists the tokens declared in @theme blocks, without sub-properties or defaults", () => {
    expect(themeTokens(css)).toEqual([
      "--spacing-0\\.5",
      "--spacing-4",
      "--text-xs",
      "--color-accent",
    ]);
  });

  it("reads the performance budget from the Lighthouse configuration", () => {
    const config =
      '{"ci":{"assert":{"assertions":{"categories:performance":["error",{"minScore":0.95}]}}}}';
    expect(performanceBudget(config)).toBe(95);
    expect(performanceBudget("{}")).toBe(0);
  });

  it("counts the real repository", () => {
    const root = fileURLToPath(new URL("../../..", import.meta.url));
    const facts = readRepositoryFacts(root);

    expect(facts.tokens).toBeGreaterThan(50);
    expect(facts.components).toBeGreaterThan(15);
    expect(facts.skills).toBeGreaterThan(30);
    expect(facts.decisions).toBeGreaterThan(15);
    expect(facts.performanceBudget).toBe(95);
  });
});
