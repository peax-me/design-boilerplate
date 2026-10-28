import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { findDesignViolations } from "@repo/design-audit/analyze";
import { collectElements, collectTokenScales } from "@repo/design-audit/collect";

import { routes } from "./support/routes.ts";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme, contextOptions: { reducedMotion: "reduce" } });

    for (const route of routes) {
      test.describe(route, () => {
        test.beforeEach(async ({ page }) => {
          await page.goto(route);
        });

        test("meets WCAG 2.2 AA", async ({ page }) => {
          const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
          expect(results.violations).toEqual([]);
        });

        test("never scrolls horizontally", async ({ page }) => {
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow).toBe(0);
        });

        test("uses only tokens, symmetric paddings, comfortable targets and no overlaps", async ({
          page,
        }) => {
          const scales = await page.evaluate(collectTokenScales);
          const elements = await page.evaluate(collectElements);
          expect(findDesignViolations(scales, elements)).toEqual([]);
        });
      });
    }
  });
}
