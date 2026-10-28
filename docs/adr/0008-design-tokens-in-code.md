---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0008. Design tokens live in code

## Context and problem statement

The locked Tailwind theme (ADR-0007) only works if a complete token set exists, and components, the runtime design audit (ADR-0012) and Figma (ADR-0013) must all agree on it. Where do tokens live, in which format, and what do they cover?

## Decision drivers

- One source of truth: code is canonical and Figma mirrors it (owner's decision).
- No build step between a token definition and its Tailwind utilities.
- Tokens readable at runtime by the design audit and the Figma export.
- Perceptually consistent colours and automatic light/dark support.
- Complete scales, so agents never need an off-scale value.

## Considered options

- CSS custom properties in a Tailwind `@theme static` block
- W3C DTCG JSON compiled with Terrazzo or Style Dictionary
- Figma variables as the source of truth

## Decision outcome

Chosen option: "CSS custom properties in a Tailwind `@theme static` block", in `packages/ui/src/styles/theme.css`. Code is the source of truth by the owner's decision. `static` makes Tailwind emit every variable, used or not, so audits and the Figma export can read the full set at runtime.

| Group      | Content                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colour     | OKLCH values with semantic roles only: `background`, `foreground`, `muted`, `surface`, `primary`, `accent`, `border`, `ring`, `destructive`, …                                                                                                                                                                                                                                                          |
| Light/dark | Each role is a `light-dark()` pair, resolved by the OS preference through `color-scheme`. Pairs are declared as raw variables (`--primary`) on `:root`, `.scheme-light` and `.scheme-dark`, and mapped to `--color-*` in `@theme static inline`. The build polyfills `light-dark()` on the element that declares it, so redeclaring on each scheme class lets `Section scheme` islands flip every token |
| Typography | Type scale where each size carries its line height and tracking; display sizes are fluid with `clamp()`                                                                                                                                                                                                                                                                                                 |
| Spacing    | Named scale on a 4px grid                                                                                                                                                                                                                                                                                                                                                                               |
| Other      | Radii, shadows, easings, breakpoints, containers                                                                                                                                                                                                                                                                                                                                                        |

Motion tokens (durations, easings, scene lengths) are covered in ADR-0011.

Typefaces are referenced through font-family variables (`--font-family-sans`, `--font-family-display`), set by `next/font` in the app (self-hosted, no layout shift) and by `@fontsource*` in Storybook. Which faces a project uses is a design choice recorded in `DESIGN.md`; each project rethemes fonts and values while keeping token names.

DTCG JSON with Terrazzo or Style Dictionary adds a build step and a mapping configuration that duplicates what `@theme` already expresses. Figma variables as the source were rejected by the owner.

### Consequences

- Good, because a token change is one edit in one file, visible immediately in utilities, Storybook and the app.
- Good, because semantic roles make dark mode a property of the token, not of each component.
- Good, because OKLCH lightness is perceptually uniform, so lightness steps look consistent across hues.
- Bad, because there is no manual theme switch; the scheme follows the OS. Adding one later means setting `color-scheme` from a user preference.
- Bad, because `light-dark()` and `oklch()` require current browsers; no fallback is provided for older ones.
- Bad, because tokens are not in a platform-neutral format; native platforms would need a converter.
- Bad, because the Figma mirror must be regenerated after token changes (ADR-0013).

## More information

- Tailwind theme variables (`@theme`, `static`): https://tailwindcss.com/docs/theme
- `light-dark()`: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark
- `oklch()`: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch
- Design Tokens Community Group: https://www.designtokens.org/
- Revisit if tokens must feed native platforms or other non-CSS consumers (then DTCG JSON with Terrazzo or Style Dictionary).
