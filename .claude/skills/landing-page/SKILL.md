---
name: landing-page
description: Plan, write and build a landing or marketing page that converts, from message hierarchy to verified page. Use when the user asks for a landing page, home page, product page, pricing page, campaign page or a redesign of one, or wants a page to convert better.
---

# Landing page

A landing page has one job: move one visitor to one action. Copy comes before layout, layout before motion. Work in this order and show each artefact to the user before the next step.

## 1. Context

Read `.agents/product-marketing.md` and `PRODUCT.md`. If either is missing, run the `project-kickoff` skill, phase 1, first. Write down, in one line each: the visitor, their problem, the promised outcome, the primary action.

## 2. Message hierarchy

With the `copywriting` skill, decide before any section exists:

| Beat      | Question it answers                 |
| --------- | ----------------------------------- |
| Promise   | What do I get?                      |
| Mechanism | Why does it work?                   |
| Proof     | Why should I believe it?            |
| Objection | What stops me, and why it shouldn't |
| Action    | What do I do now?                   |

Pick the frame from the visitor's awareness (PAS for problem-aware, StoryBrand for solution-aware, direct offer for product-aware). Every claim needs proof that exists; flag missing proof as `[NEED: …]` rather than inventing it.

## 3. Section plan

One beat per section, one job per section. Typical order: hero (promise + primary action) → mechanism → proof → objections → final action. For each section write: beat, headline, supporting line, components it uses (`@repo/ui` only), the asset it needs if any (`asset-production` asset list), and whether it is a scroll scene.

Rules from `docs/design/principles.md` apply: one focal point per viewport, one primary action per view, accent colour rationed.

## 4. Storyboard

Choose at most three sections to become scroll scenes with the `scroll-storytelling` skill. The rest of the page stays calm.

**Gate:** the user approves copy, section plan, asset list and storyboard.

## 5. Build

1. Produce the assets with `asset-production`.
2. Create `apps/web/src/features/<page>/` with one file per section (`hero-section.tsx`, …) and one per scene (`*-scene.tsx`, client component). The route file only composes sections.
3. Compose with `Section`, `Container`, `Stack`, `Inline`, `Grid`, `Heading`, `Text`, `Button`, `ButtonLink`, `Card`, `Badge`, `Icon`. Missing a visual? Use the `design-system` skill; never style in the app.
4. Add the route to `apps/web/e2e/support/routes.ts`.

## 6. Review

1. `copy-editing` skill on the final copy, then `cro` skill on the built page (value clarity, CTA hierarchy, trust, friction).
2. `impeccable` `critique` in Persuade mode, and the `design-reviewer` agent at mobile, tablet and desktop.
3. `pnpm check`, `pnpm test:e2e`, `pnpm --filter @repo/web lighthouse`.

## Anti-patterns

- Fade-up on every section, gradient text, decorative blobs, generic three-icon feature rows.
- Several primary buttons competing in one viewport.
- Eyebrow labels above every heading, `→` in every link.
- Placeholder logos, invented testimonials or metrics, generated faces or product screens.
