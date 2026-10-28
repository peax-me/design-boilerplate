---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0021. Technology and brand logos from Simple Icons

## Context and problem statement

Pages name the technologies and services they use, and a logo next to a name makes a list scannable. lucide, the icon set of the design system, has no brand logos. Where do logos come from without hand-drawing them or downloading files per project?

## Decision drivers

- One consistent source, drawn on the same 24-unit grid as the icons.
- Logos take the text colour, so they follow tokens and schemes.
- Only the logos a page uses reach the browser.

## Considered options

- `simple-icons` (CC0 data, one path per brand) rendered by a `BrandMark` component
- SVG files downloaded per project into `public/`
- Stock icons through the Magnific MCP

## Decision outcome

Chosen option: "`simple-icons` rendered by `BrandMark`", because it covers several thousand brands as tree-shakable named exports and `BrandMark` paints them with `fill-current`.

- `BrandMark` (`@repo/ui/components/brand-mark`) takes an icon object (`siNextdotjs`…) and a size; it is decorative and always sits next to the name in text.
- Pages import only the icons they show; the package marks itself free of side effects, so the rest is dropped from the bundle.

Per-project files drift in size and grid, and stock icons are not maintained against brand changes.

### Consequences

- Good, because every logo shares one grid and one colour rule.
- Bad, because the data is CC0 but the marks are trademarks: each brand's guidelines still apply, and a logo must never suggest endorsement.
- Bad, because the package is large on disk; a bundler that fails to tree-shake it would ship every logo.

## More information

- Simple Icons: https://simpleicons.org
- Disclaimer: https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md
- Related: ADR-0009 (component architecture).
- Revisit if a page needs coloured or multi-path brand assets.
