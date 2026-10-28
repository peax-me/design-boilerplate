---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0007. Tailwind CSS v4 with a locked theme

## Context and problem statement

The owner's main pain is agents producing off-scale sizes, ad-hoc spacing, and cramped or poorly placed elements. Conventions alone do not stop this: with Tailwind's default theme, `p-13`, `mt-[22px]` and `bg-blue-500` are all valid. How do we make styling outside the design system impossible?

## Decision drivers

- Only design-system tokens produce styles; anything else fails lint.
- Spacing comes from the parent layout (`gap`), so layouts stay symmetric.
- Applications compose design-system components instead of styling.
- A utility-first workflow that agents and the shadcn ecosystem already use.

## Considered options

- Tailwind CSS v4 with a locked theme and lint restrictions
- Tailwind CSS v4 with the default theme and written conventions
- CSS Modules
- Panda CSS
- vanilla-extract

## Decision outcome

Chosen option: "Tailwind CSS v4 with a locked theme and lint restrictions".

The theme starts with `--*: initial`, which removes every default token, so only design-system tokens (ADR-0008) generate utilities:

```css
@theme {
  --*: initial;
  /* design-system tokens only */
}
```

`p-13` and `bg-blue-500` become unknown classes, reported by `better-tailwindcss/no-unknown-classes`. `better-tailwindcss/no-restricted-classes` also bans:

| Banned                                      | Examples                                    | Use instead                              |
| ------------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| Arbitrary values and properties             | `p-[13px]`, `bg-primary/[0.37]`, `[mask:…]` | A token, or a new token in `packages/ui` |
| CSS-variable shorthand                      | `p-(--x)`                                   | A token utility                          |
| Margins, except `*-auto`                    | `mt-*`, `-mx-*`                             | `gap` on a flex/grid parent; `mx-auto`   |
| Single-side paddings                        | `pt-*`, `pl-*`                              | `p-*`, `px-*`, `py-*`                    |
| Margin-based stacking                       | `space-x-*`, `space-y-*`                    | `gap`                                    |
| Off-scale z-index, durations, border widths | `z-37`, `duration-250`, `border-3`          | Values from the token scale              |

The last row is needed because Tailwind v4 generates these utilities from any number, independently of the theme.

Applications (`apps/*`) may not pass `className` or `style` at all: they compose `@repo/ui` components and choose among typed props (ADR-0009). Only `packages/ui` writes utility classes.

Verified on Oxlint 1.90, eslint-plugin-better-tailwindcss 4.10 and Tailwind CSS 4.3.3.

The default theme with conventions is the status quo that produced the problem. CSS Modules and vanilla-extract accept any CSS value unless a separate linter checks it. Panda CSS can restrict values to tokens at type level, but adds a code-generation step, and the shadcn registry and Base UI examples we build on are written in Tailwind.

### Consequences

- Good, because off-scale values fail lint before review, with an error pointing at the class.
- Good, because gap-only spacing and symmetric paddings remove a class of misaligned layouts.
- Good, because apps cannot drift from the design system: a missing variant is added to `packages/ui`.
- Bad, because snippets from Tailwind docs and registries (`p-4`, `text-sm`) fail until mapped to our tokens.
- Bad, because one-off needs (optical alignment, an unusual layout) require a design-system change first.
- Bad, because the restriction patterns are regular expressions maintained alongside the token scale.

## More information

- Tailwind theme variables: https://tailwindcss.com/docs/theme
- eslint-plugin-better-tailwindcss: https://github.com/schoero/eslint-plugin-better-tailwindcss
- Related: ADR-0006 (lint), ADR-0008 (tokens), ADR-0009 (components), ADR-0012 (runtime design audit).
- Revisit if a legitimate pattern repeatedly needs an escape hatch; add a token or component rather than relaxing the lint.
