# Design Boilerplate

A starting point for every new project: a Turborepo with a Next.js front end and a design system that neither people nor agents can drift from.

- **Tokens live in code.** `packages/ui/src/styles/theme.css` is the only source of colours, sizes, type and motion. The Tailwind theme is locked to it.
- **Lint blocks invention.** Arbitrary values, margins, asymmetric paddings and off-scale values fail. Apps cannot style at all: they compose design-system components.
- **The browser verifies.** Every page is audited on mobile, tablet and desktop, in light and dark: WCAG 2.2 AA, token conformance, symmetric paddings, overlaps, touch targets, horizontal overflow, plus Lighthouse budgets.
- **Decisions are recorded.** Every architecture choice is an ADR that a human approves.
- **Agents are first-class.** `AGENTS.md`, project skills, hooks that lint every edit, and a design reviewer agent.

## Quick start

Requirements: Node.js 24 and pnpm 12 (`npm install -g pnpm@12`). An older global pnpm cannot switch to pnpm 12 on its own.

```bash
pnpm install
pnpm dev          # site on :3000, Storybook on :6006
pnpm check        # format, lint, types, tests, dead code, ADRs
pnpm test:e2e     # build + browser design audit
```

In Conductor, each workspace is installed automatically and gets its own ports through the `dev`, `check` and `e2e` actions (`.conductor/settings.toml`).

## Stack

Next.js 16 (App Router, Cache Components, React Compiler) · React 19.3 · TypeScript 7 · Tailwind CSS 4 · Base UI · TanStack Query · GSAP + Lenis · Storybook 10 · Vitest 5 · Playwright · Oxlint + Oxfmt · Turborepo + pnpm. Each choice is explained in [`docs/adr`](docs/adr/README.md).

## Method

Every project follows the same phases, each closed by your approval: context → visual direction → design system → Figma → story (copy and scroll storyboard) → build → verify. The `project-kickoff` skill drives it; ask your agent to "start a new project".

## Where to look

- [`AGENTS.md`](AGENTS.md): commands, structure, rules and skill routing.
- [`docs/design/principles.md`](docs/design/principles.md): the design rules tooling cannot check.
- [`docs/adr`](docs/adr/README.md): architecture decisions awaiting or holding approval.
- [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md): the component inventory.
