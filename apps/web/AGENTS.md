# @repo/web — Next.js site

## Rules

- Compose `@repo/ui` only. `className` and `style` are forbidden by lint (the root layout may set font variables on `<html>`).
- `src/app/**` holds routes, layouts and metadata only. Page sections live in `src/features/<feature>/<section>.tsx`, one section per file.
- Server Components by default. `"use client"` only for leaves that need it (scroll scenes, interactive widgets).
- Data: TanStack Query. Prefetch in Server Components with `getQueryClient()` from `src/lib/query-client.ts`, pass state through `HydrationBoundary`, read with `useQuery`/`useSuspenseQuery` in client leaves.
- Links: `ButtonLink` or `TextLink` with `render={<Link href="…" />}`. Typed routes are on.
- Every new route goes into `e2e/support/routes.ts`; the design audit then checks it on mobile, tablet and desktop in both colour schemes.

## Commands

- `pnpm --filter @repo/web dev` — dev server on `:3000`.
- `pnpm --filter @repo/web test:e2e` — needs a production build (`pnpm --filter @repo/web build`).
- `pnpm --filter @repo/web lighthouse` — Lighthouse budgets on the production build.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
