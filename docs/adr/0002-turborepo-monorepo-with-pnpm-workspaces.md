---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0002. Turborepo monorepo with pnpm workspaces

## Context and problem statement

The boilerplate holds a Next.js application, a design system meant to be shared by every future app, and shared TypeScript configuration. The owner wants no backend now, only room for one later. Lint, typecheck and tests run very often because agents trigger them after edits. How do we structure the repository and run tasks across packages?

## Decision drivers

- One clone per project; the design system and the app change together in one pull request.
- A task graph that understands package dependencies and caches unchanged work.
- No build step for internal packages: edits in `packages/ui` are visible in the app immediately.
- A single tree agents can navigate, with explicit and stable import paths.
- Room for a backend without restructuring.

## Considered options

- Turborepo with pnpm workspaces
- Nx with pnpm workspaces
- pnpm workspaces alone (`pnpm -r`, `--filter`)
- Separate repositories, design system published as an npm package

## Decision outcome

Chosen option: "Turborepo with pnpm workspaces", because it adds a cached, dependency-aware task graph on top of pnpm workspaces with a single `turbo.json`, and nothing we do not need.

Packages consume each other's sources directly (no build step for `@repo/ui`). Tasks that read those sources (`build`, `typecheck`) depend on a script-less `transit` task (`dependsOn: ["^transit"]`), so a change in a workspace dependency invalidates their cache without running that dependency's own build. `apps/web/turbo.json` adds the repository files the landing page reads at build time to its `build` inputs.

| Path                         | Package                   | Role                                                         |
| ---------------------------- | ------------------------- | ------------------------------------------------------------ |
| `apps/web`                   | `@repo/web`               | Next.js application (ADR-0004)                               |
| `apps/api`                   | none yet                  | Reserved for a future backend; not created, own ADR required |
| `packages/ui`                | `@repo/ui`                | Design system (ADR-0007 to ADR-0009, ADR-0011)               |
| `packages/design-audit`      | `@repo/design-audit`      | In-browser design audit used by e2e tests (ADR-0012)         |
| `packages/typescript-config` | `@repo/typescript-config` | Shared `tsconfig` presets (ADR-0005)                         |
| `tooling`                    | `@repo/tooling`           | ADR gate and Claude Code hooks (ADR-0001, ADR-0014)          |

Configuration choices:

- Turborepo 2.11; root scripts (`dev`, `build`, `typecheck`, `test`, `test:e2e`) delegate to `turbo run`.
- Internal packages are "just-in-time" packages: consumed as TypeScript source and compiled by the consuming app's bundler, with no build step of their own.
- Each package declares an `exports` map with one subpath pattern per folder (e.g. `"./components/*": "./src/components/*.tsx"`), so imports read `@repo/ui/components/button`. No barrel files: an import loads only the module it names.
- Workspace dependencies use `workspace:*`; external versions come from the catalog (ADR-0003).

Nx brings generators, plugins and a project graph we would not use. pnpm alone runs scripts in topological order but has no task cache and no task-level dependency graph. Separate repositories add versioning and publishing to every design-system change and split the context agents need.

### Consequences

- Good, because a design-system change and its usage in the app land atomically.
- Good, because unchanged tasks are replayed from cache.
- Good, because per-folder exports keep import paths stable and avoid loading whole barrel modules.
- Bad, because just-in-time packages cannot be published or consumed outside this monorepo without adding a build.
- Bad, because every consumer must compile TypeScript/TSX with compatible settings.
- Bad, because wrong `inputs`, `outputs` or `env` declarations in `turbo.json` can replay stale cached results.

## More information

- Turborepo: https://turborepo.com/docs
- Internal packages (just-in-time vs compiled): https://turborepo.com/docs/core-concepts/internal-packages
- pnpm workspaces: https://pnpm.io/workspaces
- Node.js subpath patterns: https://nodejs.org/api/packages.html#subpath-patterns
- Revisit when the design system must be consumed outside this repository, or when `apps/api` is created.
