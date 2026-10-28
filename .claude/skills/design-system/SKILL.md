---
name: design-system
description: Use, extend or retheme the design system in packages/ui. Use whenever a page needs a visual that existing components cannot express, when adding a token, variant or component, when rethemeing for a new brand, or when a lint error says a class is unknown or restricted.
---

# Design system

`packages/ui` is the only place where visual decisions are made. Apps compose it; they cannot style (no `className`, no `style`). The theme is locked: a Tailwind utility exists only if its token is declared in `packages/ui/src/styles/theme.css`.

## Decide before you build

When a page needs something new, take the first option that works:

1. **Existing component and props.** Read the inventory in `packages/ui/AGENTS.md`.
2. **New variant** on an existing component (a new `cva` entry).
3. **New component** composed from existing primitives.
4. **New token** in `theme.css`. Rare: the scale is deliberately small. Adding a token is a design decision; say why in the commit.

Never work around the system: no arbitrary values (`p-[13px]`), no inline styles, no margins, no single-side paddings. Lint rejects them and the browser audit catches what lint cannot.

## Add a variant or component

1. Write the story first in `packages/ui/stories/<name>.stories.tsx`: one story per state, a `play` function for behaviour. Stories run as tests with an accessibility check (`a11y.test: "error"`).
2. Implement `packages/ui/src/<layout|typography|components|motion>/<name>.tsx`:
   - `cva` for variants, `cn` to merge `className` (for composition inside `packages/ui` only).
   - `data-slot="<name>"` on the root element.
   - Layout and typography stay Server-Component-safe: no hooks, a typed `as` prop for polymorphism.
   - Interactive components wrap a Base UI primitive (`@base-ui/react/*`); links use `useRender` with a `render` prop so apps can pass `<Link />`.
   - Navigation is a link (`ButtonLink`, `TextLink`), an action is a `Button`.
3. Pure logic gets a unit test in `packages/ui/tests/`.
4. Add the component and its props to the inventory in `packages/ui/AGENTS.md`.
5. Mirror it in the Figma library and add its Code Connect template in `packages/ui/figma/` (`figma-sync` skill).

## Add a token

1. Add it to `theme.css` in the right namespace (`--spacing-*`, `--text-*`…). A colour is two lines: the raw `light-dark(light, dark)` pair in OKLCH under `:root, .scheme-light, .scheme-dark` (`--brand: light-dark(…)`), and its mapping in `@theme static inline` (`--color-brand: var(--brand)`). Never put `light-dark()` inside `@theme`: scheme islands would keep the page's scheme.
2. If it introduces a new name in a scale that `tailwind-merge` cannot infer (font weights, tracking, easings, containers), add it to `packages/ui/src/lib/cn.ts` and extend `packages/ui/tests/cn.test.ts`.
3. Check `Foundations/Tokens` in Storybook: it reads tokens from the CSS, so it updates itself.

## Retheme for a new project

1. Edit values in `theme.css` only; keep token names so every component follows.
2. Check contrast in both schemes: run `pnpm --filter @repo/ui test` (Storybook a11y) and `pnpm test:e2e` (WCAG audit on light and dark).
3. Fonts: `next/font` variables `--font-family-sans` (text) and `--font-family-display` (headings) in the web layout, `@fontsource*` in `.storybook/preview.css`. Code uses the system monospace stack. Preload only the faces the first viewport shows; the Lighthouse budget counts every font requested before the first paint.

## Skills that cover parts of this work

- `shadcn` for component composition rules. Ignore its instructions to style with `className` in pages or to write tokens outside `theme.css`.
- `impeccable` (`layout`, `typeset`, `colorize`, `polish`, `audit`) for design judgment.
- `emil-design-eng` for interaction details.
- `vercel-composition-patterns` for component APIs.
