---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0017. Conductor workspace configuration in the repository

## Context and problem statement

The owner runs several coding agents in parallel with Conductor, one git worktree per workspace. Each new workspace must install dependencies and browsers without manual steps, and several workspaces must run the site, Storybook and the end-to-end audit at the same time without port collisions. Where does that configuration live, and how do processes get distinct ports?

## Decision drivers

- A new workspace is ready to work after setup, locally and in Conductor cloud workspaces.
- Workspaces run concurrently: no fixed ports.
- One source of truth, versioned with the code and shared with the team.
- Setup must survive a machine whose global pnpm is older than the version pinned in `packageManager` (ADR-0003).

## Considered options

- Shared `.conductor/settings.toml` in the repository, ports from `CONDUCTOR_PORT`
- Per-developer settings only (`settings.local.toml` or user settings)
- Legacy `conductor.json`

## Decision outcome

Chosen option: "Shared `.conductor/settings.toml`", because it is the documented team-shared layer, it is validated by a published JSON schema, and it is reviewed like code.

- `scripts.setup`: installs the `packageManager` pnpm globally if `pnpm --version` fails, then `pnpm install --frozen-lockfile`, then the Playwright Chromium browser (`--with-deps` in cloud workspaces).
- Actions: `dev` (default, local) runs the site on `CONDUCTOR_PORT` and Storybook on `CONDUCTOR_PORT + 1`; `check` runs `pnpm check`; `e2e` runs the build and design audit with Playwright's server on `CONDUCTOR_PORT + 2`. `run_mode = "concurrent"` because nothing is shared between workspaces.
- Ports reach the tools through `PORT` (Next.js), `STORYBOOK_PORT` (Storybook script) and `E2E_PORT` (Playwright config), declared in `passThroughEnv` in `turbo.json` because Turborepo filters environment variables in strict mode.
- `preview_urls` open the site and Storybook from the terminal panel.
- `.env*` files are copied by Conductor's default files-to-copy pattern; no extra configuration.

Per-developer settings would leave every teammate to rebuild the same scripts. `conductor.json` is the legacy format the Mac client ignores once a settings TOML exists.

### Consequences

- Good, because a new workspace installs, tests and serves without manual steps.
- Good, because concurrent workspaces never fight over ports 3000, 6006 or 3100.
- Bad, because the Mac app reads the shared file from the default branch on the remote: it takes effect after this branch is merged.
- Bad, because the setup script may install pnpm globally on a machine where it is missing or too old.

## More information

- Conductor scripts: https://conductor.build/docs/reference/scripts
- Settings precedence: https://conductor.build/docs/reference/settings
- Schema: https://conductor.build/schemas/settings.repo.schema.json
- Revisit if the project adds a shared resource (database, Docker stack): switch to `run_mode = "nonconcurrent"` or Spotlight testing.
