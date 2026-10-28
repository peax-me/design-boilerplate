---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0023. Static export to GitHub Pages

## Context and problem statement

The site needs a public URL without running a server. Every route of the web app is static, and the repository already lives on GitHub. How is it hosted and deployed?

## Decision drivers

- No server to run or pay for while every route is static.
- Deploy only what passed the quality gates (ADR-0016).
- Keep the server features (partial prerendering, image optimisation) for projects that later need a server host.

## Considered options

- Next.js static export deployed to GitHub Pages by a workflow
- A Node.js host (Vercel, a container) running `next start`
- Committing the exported files to a `gh-pages` branch

## Decision outcome

Chosen option: "Static export deployed to GitHub Pages by a workflow", because it costs nothing to run, needs no secret, and uses the repository's own hosting.

- `.github/workflows/pages.yml` runs after the CI workflow succeeds on `main` (or by hand), builds `@repo/web` with `PAGES_BASE_PATH` from `actions/configure-pages`, uploads `apps/web/out` and deploys it with `actions/deploy-pages`.
- `next.config.ts` switches to `output: "export"` with `basePath` only when `PAGES_BASE_PATH` is set. Partial prerendering (`cacheComponents`, `partialPrefetching`) and default image optimisation need a server, so the export turns them off; local builds, e2e and Lighthouse keep them.
- Files under `public/` referenced by string go through `process.env.NEXT_PUBLIC_BASE_PATH`; statically imported images get the base path from Next.js.
- `turbo.json` declares `PAGES_BASE_PATH` in the build's `env`, so an export and a server build never share a cache entry.

A Node.js host adds an account and a bill for pages that need no server. A `gh-pages` branch puts build output in git history.

### Consequences

- Good, because a push to `main` that passes CI publishes the site.
- Bad, because the export serves unoptimised images; pages must ship images already sized and compressed (`asset-production` skill).
- Bad, because GitHub Pages on a private repository requires a paid GitHub plan, and the published site is public even when the code is not.
- Bad, because a route that needs the server (cookies, route handlers on requests, ISR) breaks the export; it needs another host and a new ADR.

## More information

- Next.js static exports: `apps/web/node_modules/next/dist/docs/01-app/02-guides/static-exports.md`
- GitHub Pages with Actions: https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Related: ADR-0004 (Next.js), ADR-0016 (CI), ADR-0022 (images).
- Revisit when a route needs a server.
