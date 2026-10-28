---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0022. Media component and image pipeline

## Context and problem statement

Pages need images, sourced from the repository, Figma exports or the Magnific MCP (ADR-0018). Apps cannot style (ADR-0007), and `@repo/ui` has no Next.js dependency. How does a page render an optimised image inside the design system?

## Decision drivers

- Images are optimised and sized by Next.js (`next/image`): modern formats, responsive `srcset`, no layout shift.
- The frame (radius, border, caption) is a design-system decision, not a page decision.
- `@repo/ui` stays framework-agnostic so Storybook and Vitest run without Next.js.

## Considered options

- `Media` in `@repo/ui` that frames an image element passed by the app
- A `Media` that imports `next/image` itself
- Plain `<img>` elements in pages

## Decision outcome

Chosen option: "`Media` frames an image element passed by the app", like `ButtonLink` takes a `render` element: the app passes `image={<Image src={…} alt="…" sizes="…" />}`, `Media` owns the frame, caption and sizing.

- Page images live next to their feature (`apps/web/src/features/<feature>/images/`) and are imported statically, so width, height and cache hashes are automatic.
- `next.config.ts` serves AVIF then WebP and allows quality 75 only (`qualities` is required since Next.js 16).
- Storybook stories and Vitest tests of `@repo/ui` may use `<img>`: the `nextjs/no-img-element` rule is off for `packages/ui/stories` and `packages/ui/tests` only, because Next.js is absent there.
- Every shipped image has a provenance entry in `assets/provenance.json` (ADR-0018).

### Consequences

- Good, because pages get optimised images without writing a class.
- Good, because the design system stays testable outside Next.js.
- Bad, because the app must remember `alt` and `sizes`; axe catches a missing `alt`, the design review checks `sizes`.

## More information

- Next.js Image: `apps/web/node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`
- Related: ADR-0007, ADR-0009, ADR-0018.
- Revisit when a page needs art direction (different crops per breakpoint) or video.
