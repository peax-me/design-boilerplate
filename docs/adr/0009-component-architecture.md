---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0009. Design-system component architecture

## Context and problem statement

Applications may not style anything themselves (ADR-0007), so `packages/ui` must provide everything a page needs: layout, typography, interactive components and motion. Components must be accessible, ship as little JavaScript as possible, and be extendable by agents without leaving the token scale. How is the library structured, and what is it built on?

## Decision drivers

- Accessible interactive components (keyboard, focus, ARIA) without writing that logic ourselves.
- Unstyled primitives, so the locked tokens are the only styling.
- Layout and typography render on the server with zero client JavaScript.
- Conventions agents already know (shadcn/ui).
- Typed props as the only customization surface for apps.

## Considered options

- Base UI headless primitives with shadcn/ui conventions
- Radix-based shadcn/ui
- React Aria Components
- Ark UI
- Styled libraries (Mantine, Chakra UI)

## Decision outcome

Chosen option: "Base UI headless primitives with shadcn/ui conventions".

| Import path             | Content                                                                  | Rendering                          |
| ----------------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| `@repo/ui/layout/*`     | `Container`, `Section`, `Stack`, `Inline`, `Grid`                        | Server-Component-safe              |
| `@repo/ui/typography/*` | `Heading`, `Text`                                                        | Server-Component-safe              |
| `@repo/ui/components/*` | `Button`, `ButtonLink`, `TextLink`, `Badge`, `Card`, `Separator`, `Icon` | Server, or client when interactive |
| `@repo/ui/motion/*`     | Motion primitives (ADR-0011)                                             | Client                             |

Rules:

- Interactive components wrap Base UI 1.9 primitives and compose through Base UI's `render` prop.
- Links are never buttons: Base UI `Button` gives an `<a>` rendered through `render` the `button` role, so `ButtonLink` and `TextLink` use `useRender` to render a real link (`render={<Link href="…" />}` for Next.js).
- shadcn/ui conventions: variants with `cva`; `cn` = `clsx` + `tailwind-merge` configured for our custom scale; `data-slot` attributes on component parts.
- Layout and typography primitives use no hooks and no `"use client"`; polymorphism goes through a typed `as` prop.
- No barrel files; one export path per folder (ADR-0002).
- Icons come from `lucide-react` (tree-shaken, one component per icon), sized only through the `Icon` component or the parent's `[&_svg]` size.
- The shadcn CLI (`components.json`) may pull registry components; they must be adapted to the locked tokens, and lint fails until they are.

Radix-based shadcn/ui is the common setup, but Base UI covers the same needs with an explicit `render` prop instead of `asChild` element cloning, and comes from the creators of Radix, Floating UI and Material UI. React Aria Components bring their own styling conventions (render props, state-driven class names). Ark UI targets several frameworks, which we do not need. Mantine and Chakra ship their own theme systems, which conflict with the token lock.

### Consequences

- Good, because accessibility behaviour comes from a maintained headless library.
- Good, because layout and typography add no client JavaScript.
- Good, because apps express intent through typed props only, so off-scale output cannot be expressed.
- Bad, because `tailwind-merge` must know our token names; otherwise it can resolve conflicts wrongly (for example a custom `text-*` size against a `text-*` colour). Its configuration must follow every scale change.
- Bad, because registry components need manual adaptation before they pass lint.
- Bad, because a typed polymorphic `as` prop adds type complexity to primitives.

## More information

- Base UI: https://base-ui.com/
- shadcn/ui: https://ui.shadcn.com/docs
- class-variance-authority: https://cva.style/docs
- tailwind-merge configuration: https://github.com/dcastil/tailwind-merge/blob/main/docs/configuration.md
- Revisit if Base UI lacks a primitive we need and building it would be substantial.
