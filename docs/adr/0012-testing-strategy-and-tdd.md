---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0012. Testing strategy and TDD

## Context and problem statement

Agents write most of the code, and the owner requires test-driven development. Tests must prove behaviour, accessibility and adherence to the design system on real rendering, not only on a simulated DOM. Which test layers, tools and rules do we use?

## Decision drivers

- Red-green-refactor for every change.
- Components tested in a real browser (layout, focus, pointer events).
- Stories double as specifications, so they cannot rot.
- Automated accessibility checks at component and page level.
- Runtime verification that rendered pages respect the design system.
- One browser automation stack.

## Considered options

- Vitest (node and browser mode) + Storybook tests + Playwright
- Jest + Testing Library + jsdom
- Cypress for component and end-to-end tests

## Decision outcome

Chosen option: "Vitest (node and browser mode) + Storybook tests + Playwright".

| Layer       | Tool                                                                   | Scope                                       |
| ----------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| Unit        | Vitest 5, node environment                                             | Pure logic                                  |
| Component   | Vitest 5 browser mode, Playwright Chromium, `vitest-browser-react`     | Component behaviour                         |
| Stories     | Storybook 10, `@storybook/addon-vitest`, `@storybook/addon-a11y` (axe) | Each story runs as a test with an axe check |
| End-to-end  | Playwright, in `apps/web/e2e`                                          | User flows and the design audit             |
| Performance | Lighthouse CI                                                          | Budgets (ADR-0016)                          |

The design audit (`packages/design-audit`) runs on every route at every breakpoint, in light and dark schemes, with reduced motion so it measures the final composition. It fails on: axe violations against WCAG 2.2 AA; horizontal overflow; asymmetric paddings; computed spacing, font-size or radius values outside the token scale; overlapping siblings in flex and grid containers; touch targets below 24 px. Collectors run in the page; the analysis is pure, unit-tested code.

Coverage thresholds: 90 % for `packages/ui`, 100 % for `packages/design-audit` and `tooling`. `pnpm test` enforces them; `pnpm --filter <package> test -- <file>` runs one file without coverage.

Rules:

- Red-green-refactor is mandatory: a failing test exists before the code that makes it pass. The `tdd` skill guides agents through the loop (ADR-0014).
- Tests live in `tests/` or `e2e/` directories, never next to source files.
- Coverage thresholds are enforced in CI.

Jest needs its own transform pipeline, while Vitest reuses the Vite setup Storybook already has. jsdom does no layout, so it cannot verify focus, overflow or computed styles. Cypress would be a second browser automation stack next to Playwright, which Vitest browser mode already uses. Chromatic (paid visual regression) is deferred.

### Consequences

- Good, because component tests and stories run against real browser rendering.
- Good, because the design audit catches off-scale output that lint cannot see (computed values, overflow, real layout).
- Good, because accessibility is checked at story and page level.
- Bad, because browser tests are slower than jsdom tests and need Playwright browsers installed in CI.
- Bad, because tooling cannot verify that tests were written first; review must check it.
- Bad, because there is no visual regression testing until Chromatic or an alternative is adopted.

## More information

- Vitest browser mode: https://vitest.dev/guide/browser/
- Storybook Vitest addon: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
- Storybook accessibility tests: https://storybook.js.org/docs/writing-tests/accessibility-testing
- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- Revisit visual regression testing once the design system stabilises.
