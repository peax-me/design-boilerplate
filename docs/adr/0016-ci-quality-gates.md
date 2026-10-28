---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0016. CI quality gates and hygiene

## Context and problem statement

Local hooks can be bypassed (ADR-0015) and only run in some tools (ADR-0014). The owner wants code quality, accessibility, performance and the absence of dead code enforced by tooling. What does CI check on each pull request before it can merge into `main`?

## Decision drivers

- Every rule enforced locally is also enforced where it cannot be skipped.
- Performance and accessibility verified on built pages, not assumed.
- No unused files, exports or dependencies ("no dead code").
- No unreviewed architecture decision merged (ADR-0001).
- Acceptable CI duration through caching.

## Considered options

- GitHub Actions running the full quality pipeline on pull requests
- Vercel deployment checks only
- Local pre-commit hooks only

## Decision outcome

Chosen option: "GitHub Actions running the full quality pipeline on pull requests".

| Gate                     | Command / tool                          | Fails when                                                   |
| ------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| Format                   | `pnpm format:check` (Oxfmt)             | A file is not formatted                                      |
| Lint                     | `pnpm lint` (Oxlint, `--deny-warnings`) | Any warning or error                                         |
| Types                    | `pnpm typecheck`                        | Any type error                                               |
| Unit, component, stories | `pnpm test` (Vitest, with coverage)     | A test fails or coverage is below its threshold              |
| Build                    | `pnpm build`                            | Any build error                                              |
| End-to-end, design audit | `pnpm test:e2e` (Playwright)            | A flow, axe check or design-audit check fails (ADR-0012)     |
| Lighthouse CI            | Lighthouse CI budgets                   | Performance < 0.95; accessibility, best practices or SEO < 1 |
| Dead code                | `pnpm knip`                             | Unused files, exports or dependencies                        |
| ADRs                     | `pnpm adr:check`                        | Any ADR is `proposed` or malformed                           |

Turborepo caching skips tasks whose inputs did not change; the cache backend (GitHub Actions cache or Turborepo remote cache) is chosen when the workflow is written. All gates are required status checks on `main`.

Vercel deployment checks do not run lint, tests or the ADR gate. Pre-commit hooks alone can be skipped and only see staged files.

### Consequences

- Good, because nothing reaches `main` without passing the same checks, whether written by a human or an agent.
- Good, because performance and accessibility regressions block merges instead of reaching production.
- Good, because knip keeps unused code out of the boilerplate, which would otherwise be copied into every new project.
- Bad, because the full pipeline (browsers, builds, Lighthouse) takes longer than lint and unit tests alone.
- Bad, because Lighthouse scores vary between runs; a 0.95 performance threshold on shared CI runners can fail intermittently, mitigated by several runs per URL (`numberOfRuns`).
- Lighthouse reports stay on the runner (`upload.target: filesystem`); nothing is published to a public storage.
- Bad, because knip needs configuration for framework entry points (Next.js, Storybook) to avoid false positives.
- Bad, because the ADR gate keeps CI red until a human accepts or rejects every proposed ADR, including this one.

## More information

- GitHub Actions: https://docs.github.com/en/actions
- Turborepo with GitHub Actions: https://turborepo.com/docs/guides/ci-vendors/github-actions
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- knip: https://knip.dev/
- Revisit the Lighthouse thresholds if they fail intermittently without a code change.
