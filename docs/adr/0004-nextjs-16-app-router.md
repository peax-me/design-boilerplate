---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0004. Next.js 16 App Router configuration

## Context and problem statement

The first application is a conversion-focused marketing site (shunpo.fr) with long scroll-driven scenes. It needs fast first paint, good SEO, and little client JavaScript outside the interactive parts. The project owner mandated Next.js. Which Next.js configuration do we adopt?

## Decision drivers

- Static HTML shell served immediately, dynamic content streamed.
- Minimal client JavaScript; client code only where interaction or animation requires it.
- No hand-written memoization code from agents.
- Broken internal links caught at type-check time.
- Compatible with TypeScript 7 (ADR-0005) and Tailwind CSS v4 (ADR-0007).

## Considered options

- Next.js 16 App Router with Cache Components, Partial Prefetching, React Compiler and typed routes
- Next.js 16 App Router with default settings
- Next.js Pages Router

Other frameworks were not evaluated: the framework is mandated.

## Decision outcome

Chosen option: "Next.js 16 App Router with Cache Components, Partial Prefetching, React Compiler and typed routes". The framework is mandated by the project owner; the configuration below is ours.

`apps/web/next.config.ts`, Next.js 16.4.3 with React 19.3:

| Setting                                              | Effect                                                                                                  | Why                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `cacheComponents: true`                              | Data access is dynamic by default, `use cache` opts in; a static shell is prerendered, the rest streams | Fast first paint without stale-by-default data             |
| `partialPrefetching: true`                           | Links prefetch only the static parts of a route (requires `cacheComponents`)                            | Cheaper prefetching on link-heavy landing pages            |
| `reactCompiler: true`                                | Automatic memoization through `babel-plugin-react-compiler` 1.0                                         | No `useMemo`/`useCallback`/`memo` by hand (lint: ADR-0006) |
| `typedRoutes: true`                                  | `href` values are type-checked; `next typegen` runs before `tsc`                                        | Broken links fail `pnpm typecheck`                         |
| `turbopack.rules` `*.css` → `@tailwindcss/turbopack` | Tailwind compiled by its Turbopack loader                                                               | Tailwind v4 without the PostCSS plugin                     |

Rendering rules:

- Server Components by default.
- `"use client"` only on leaf components (interactive controls, motion scenes, providers), never on layouts or pages.

Default settings leave the static-shell and compiler benefits unused. The Pages Router has neither Server Components nor Cache Components.

### Consequences

- Good, because pages ship a prerendered shell and only leaf components hydrate.
- Good, because the React Compiler removes a class of manual memoization mistakes.
- Good, because route typos are compile errors.
- Bad, because Cache Components changes the data model: uncached data must be read inside `use cache` or behind a `<Suspense>` boundary, otherwise prerendering fails.
- Bad, because the React Compiler runs through Babel, which makes builds slightly slower than the default Rust-based pipeline.
- Bad, because Next.js 16 APIs differ from most training data; agents must read the version-matched docs in `node_modules/next/dist/docs/` (root `AGENTS.md`).

## More information

- Version-matched docs: `apps/web/node_modules/next/dist/docs/`
- https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
- https://nextjs.org/docs/app/api-reference/config/next-config-js/partialPrefetching
- https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler
- https://nextjs.org/docs/app/api-reference/config/next-config-js/typedRoutes
- https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
- React Compiler: https://react.dev/learn/react-compiler
- Revisit when `experimental.turbopackRustReactCompiler` (native React Compiler in Turbopack) becomes stable, or when a Next.js release changes the defaults of these settings.
