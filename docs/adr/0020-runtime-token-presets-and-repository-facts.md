---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0020. Runtime token presets and unit tests in the web app

## Context and problem statement

Pages may let visitors switch parts of the design system at runtime (accent colour, typeface, spacing module, corners, colour scheme), and the web app now holds logic of its own, such as reading repository files during prerendering. How do runtime switches stay inside the token system, and how is app logic tested?

## Decision drivers

- Tokens live only in `theme.css` (ADR-0008); a switch must never introduce a free value.
- Switches are instant, accessible and respect reduced motion.
- Logic is tested first, in `tests/`, with enforced coverage (ADR-0012).

## Considered options

- Presets as attribute selectors in `theme.css`, toggled on `<html>` by a `TokenTray` component
- Inline CSS variables written from JavaScript
- A theme provider holding values in React state

## Decision outcome

Chosen option: "Presets as attribute selectors in `theme.css`", because every value stays in the token file, the browser recomputes every utility at once, and the component only toggles data attributes.

- `theme.css` declares `data-paint`, `data-face`, `data-module`, `data-corners` and `data-table` presets. Spacing and radii scale from `--module-scale` and `--corner-scale`.
- `packages/ui/src/theme/presets.ts` lists the presets; a unit test checks each one exists in `theme.css`.
- `TokenTray` uses native radio inputs and applies a preset inside a view transition, skipped under reduced motion. Several trays stay in sync through the attributes themselves. Fonts used only by a preset are loaded without preload.
- Logic in `apps/web` (for example reading repository files with `fs.readFileSync` during prerendering) lives in `src/lib/` and is tested by a Vitest unit project in `apps/web/tests`, with the same coverage thresholds as the other packages.

Inline variables from JavaScript would put values outside `theme.css`. A React theme provider would re-render the tree for a change the browser can apply alone.

### Consequences

- Good, because a visitor can only pick values that exist in the design system, the same constraint agents have.
- Good, because app logic gets the same test-first discipline as the packages.
- Bad, because presets multiply the states the browser audit should cover; it runs on defaults only.

## More information

- View Transition API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- Related: ADR-0008 (tokens), ADR-0012 (testing), ADR-0019 (3D stage).
- Revisit when presets need to persist across visits or when a project ships a theme switcher of its own.
