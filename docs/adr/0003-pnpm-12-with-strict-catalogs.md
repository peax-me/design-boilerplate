---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0003. pnpm 12 with strict catalogs

## Context and problem statement

The monorepo (ADR-0002) needs a package manager. With several workspaces, the same dependency drifts to different versions in each `package.json`, and dependency install scripts are a supply-chain risk. Which package manager and policy keep versions consistent, installs safe, and fresh clones working?

## Decision drivers

- One version per dependency across all workspaces (one React, one TypeScript).
- Install scripts denied unless explicitly allowed.
- Latest stable toolchain (owner's requirement).
- Reproducible installs: the package manager itself is pinned and verified.
- Strict `node_modules` isolation: no phantom dependencies.
- Compatibility with Turborepo, Next.js, Storybook and Playwright on Node 24.

## Considered options

- pnpm 12 with `catalogMode: strict` and `allowBuilds`
- pnpm 11 with the same settings
- Bun
- npm workspaces
- Yarn 4

## Decision outcome

Chosen option: "pnpm 12 with `catalogMode: strict` and `allowBuilds`". Mandated by the project owner after the trade-off below was raised.

Configuration (`pnpm-workspace.yaml` and root `package.json`):

- `packageManager: pnpm@12.15.0`; Node 24 (`.node-version`, `engines.node: ">=24"`).
- `catalogMode: strict`: every dependency version is declared once under `catalog:`, and workspaces reference it as `"catalog:"`.
- `allowBuilds`: install scripts are denied by default; `esbuild: false` and `lefthook: false` are listed explicitly. Lefthook's Git hooks are installed by the root `prepare` script instead (ADR-0015).

pnpm 12 (Rust rewrite, released 2026-08-26) ships a self-contained native binary. Its lockfile keeps format 9.0 and adds a first document that pins pnpm itself with per-platform integrity hashes; Turborepo 2.11 parses it (verified with per-package dependency hashes). pnpm 11 would let a globally installed pnpm 10 switch versions automatically, which pnpm 12 does not (verified: `ENOEXEC`), so developers install pnpm 12 once (`npm install -g pnpm@12`, verified). CI uses `pnpm/setup@v3`, which installs the signature-verified pnpm binary and the Node version from `.node-version`. npm has no catalogs, hoists dependencies (phantom dependencies are importable) and runs install scripts by default. Bun and Yarn 4 meet no driver better than pnpm, and Bun adds a second toolchain next to Node 24.

### Consequences

- Good, because a version bump is a one-line catalog change that applies everywhere.
- Good, because a compromised dependency cannot run code at install time unless allowed.
- Good, because pnpm's isolated `node_modules` fails on undeclared imports.
- Bad, because adding a dependency means adding it to the catalog too (intended friction).
- Bad, because a dependency that needs its install script must be allowed deliberately; forgetting it can surface later as a runtime error.
- Bad, because machines with pnpm 10 must install pnpm 12 manually once; the README says how.
- Bad, because pnpm 12 is two months old; tools that read the lockfile (Renovate, Vercel, Dependabot) must support its pnpm pinning document.

## More information

- Catalogs: https://pnpm.io/catalogs
- Settings (`catalogMode`, `allowBuilds`): https://pnpm.io/settings
- Workspaces: https://pnpm.io/workspaces
- `pnpm/setup` action: https://github.com/pnpm/setup
- Revisit if a deployment platform or dependency bot cannot read the pnpm 12 lockfile.
