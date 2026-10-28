# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-10-28

## Product Overview

**One-liner:** A Next.js monorepo and agent toolkit for designing with your agent, built from one design system that keeps every piece on scale.
**What it does:** Locks every visual value to design tokens, rejects anything off-scale in lint and in agent hooks, audits every page in a real browser, records decisions as ADRs approved by a human, and mirrors the system in Figma.
**Product category:** Project starter (boilerplate) for agent-driven product development.
**Product type:** Open-source repository to fork.
**Business model:** Free; used to start Shunpo's own client projects.

## Target Audience

**Primary use case:** Starting a new website or product with coding agents (Claude Code first) without losing design quality.
**Jobs to be done:**

- Start a project with a complete, enforced design system on day one.
- Let agents ship UI fast while every value stays on the scale.
- Keep code, design and decisions in one reviewable place.

## Personas

| Persona                     | Cares about                 | Challenge                                   | Value we promise                                   |
| --------------------------- | --------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Design engineer / UX lead   | Visual consistency, craft   | Agents invent sizes, colours and spacing    | Off-scale values fail before a pull request exists |
| Founder or freelance studio | Speed without rework        | Every new project starts from scratch       | Fork, brief the agent, approve each phase          |
| Tech lead                   | Code quality, decisions, CI | Conventions live in reviews, not in tooling | Strict TypeScript, lint, tests and ADR gates       |

## Problems & Pain Points

**Core problem:** Agents produce interfaces that drift from the design system: arbitrary values, cramped spacing, inconsistent sizes.
**Why alternatives fall short:**

- Starters (create-next-app, shadcn templates) ship components but let any class through.
- Rules in a prompt or a style guide are advice; nothing blocks the agent.

**What it costs them:** Review time spent on pixel fixes, inconsistent pages, eroded trust in agent output.

## Differentiation

**Key differentiators:**

- Locked Tailwind theme: only tokens generate utilities.
- Apps cannot style; pages compose design-system components.
- A browser audit checks token values, symmetric padding, overlaps, touch targets and WCAG 2.2 AA on three viewports in light and dark.
- Creative toolkit: skills for directions, design systems, generated assets (Magnific), scroll choreography and 3D, conversion copy and Figma prototypes, plus hooks that lint every edit and a design reviewer agent.
- Every technical choice is an ADR that only a human can accept.

## Objections

| Objection                 | Response                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| Too strict to be original | Originality goes into tokens and variants in `packages/ui`; pages compose them.                     |
| Do I need Figma?          | No. Code is the source of truth; the Figma mirror is optional.                                      |
| Only for Claude Code?     | Claude Code gets hooks and skills; any agent reading AGENTS.md follows the rules, CI enforces them. |
| Can I change the stack?   | Yes: write an ADR that supersedes the current one.                                                  |

## Brand Voice

| Attribute | Means                                | Doesn't mean            | Example line                                     |
| --------- | ------------------------------------ | ----------------------- | ------------------------------------------------ |
| Precise   | Names the file, the rule, the number | Jargon for its own sake | "Off-scale values fail lint."                    |
| Calm      | Short sentences, no hype             | Cold                    | "Fork it, brief your agent, approve each phase." |

**Never use:** "revolutionary", "blazing fast", "AI-powered magic", invented metrics or testimonials.

## Proof Points

**Metrics (verifiable in the repository):** the landing page counts tokens, components, skills and ADRs from the repository at build time; never hard-code them in copy. CI budgets: Lighthouse performance ≥ 95, accessibility, best practices and SEO = 100; 18 browser checks per route.
**Testimonials:** none yet. Do not invent any.

## Goals

**Conversion action:** Fork the repository on GitHub.

## Changelog

- v1 (2026-10-28) — Initial context for the boilerplate's own landing page.
