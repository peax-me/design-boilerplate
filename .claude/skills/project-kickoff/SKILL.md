---
name: project-kickoff
description: Start a new project from this boilerplate, from the brief to the first verified page. Use when the user starts a new site or app, says "new project", "kickoff", "start from the boilerplate", or wants to set up brand, design system, Figma and first pages in order.
---

# Project kickoff

The method every project follows. Each phase ends with a gate: show the result, get the user's approval, then move on. Never skip a gate, never run two phases at once.

## Phase 1 — Context

1. Run the `product-marketing` skill. It writes `.agents/product-marketing.md`: audience, problem, positioning, proof, voice.
2. Run `impeccable` `init`. It writes `PRODUCT.md`: product purpose, users, surfaces and their modes. Reference the positioning in `.agents/product-marketing.md` instead of restating it.

**Gate:** the user confirms both files describe their product correctly.

## Phase 2 — Visual direction

1. Run `design-inspiration`: a reference board, then two or three directions built on `impeccable` (new-work / shape): point of view, type pairing, colour intent, motion personality. Mood frames go through the quote gate of `asset-production`.
2. Write the result to `DESIGN.md` as **direction only**: point of view, references, do and don't. Token values never go in `DESIGN.md`; they live in `packages/ui/src/styles/theme.css`, the single source of truth (ADR 0008). If a skill asks to write values into `DESIGN.md`, write the reference to `theme.css` instead.

**Gate:** the user approves the direction (show two or three options when the brief is open).

## Phase 3 — Design system

Follow the `design-system` skill, "Retheme" section:

1. Translate the direction into tokens in `theme.css`: colour roles (OKLCH, light and dark), fonts, type scale, radii, shadows, easings.
2. Load the fonts with `next/font` in `apps/web/src/app/layout.tsx` and `@fontsource-variable/*` in `packages/ui/.storybook/preview.css`.
3. Add or adapt components the direction needs (new variants first).
4. Run `pnpm --filter @repo/ui dev` and review `Foundations/Tokens` and every component story in light and dark.

**Gate:** the user approves Storybook screenshots. Any structural change (new library, new pattern) gets an ADR with `status: proposed` (`adr` skill).

## Phase 4 — Figma

Follow the `figma-sync` skill: push tokens to Figma variables, components to the library, then map them with Code Connect when the plan allows it.

**Gate:** the user sees the library in Figma.

## Phase 5 — Story

For each marketing page, follow the `landing-page` skill: message hierarchy, section plan, copy, then the scroll storyboard (`scroll-storytelling`) and the asset list (`asset-production`: images, icons, cut-outs, loops, 3D models).

**Gate:** the user approves copy, storyboard and asset list before any page code.

## Phase 6 — Build

1. Produce the approved assets with `asset-production` (quote and approval before any credit is spent) and 3D models with `scene-3d`.
2. Compose each page in `apps/web/src/features/<feature>/` from `@repo/ui` only. Pages in `apps/web/src/app/` stay thin.
3. Add each route to `apps/web/e2e/support/routes.ts` so the design audit covers it.
4. Write tests first (`tdd` skill) for any logic.

## Phase 7 — Verify

1. `pnpm check` and `pnpm test:e2e` pass (lint, types, tests, dead code, ADRs, WCAG 2.2 AA, token audit, overflow).
2. `pnpm --filter @repo/web lighthouse` meets the budgets.
3. Dispatch the `design-reviewer` agent on every page and fix its findings.

**Gate:** the user reviews the deployed preview.
