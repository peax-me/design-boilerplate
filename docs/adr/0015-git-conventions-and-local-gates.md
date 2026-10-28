---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0015. Git conventions and local gates

## Context and problem statement

Agents and humans commit to the same repository. History must be readable, and obvious problems (unformatted files, lint errors, malformed commit messages) should be caught before they reach CI. Which commit conventions and local Git hooks do we use?

## Decision drivers

- Consistent, machine-readable commit history.
- Commit headers of at most 100 characters (owner rule).
- Fast local feedback on staged files only.
- Hook installation that works while install scripts are denied (ADR-0003).
- Every change reviewed before it reaches `main`.

## Considered options

- Conventional Commits + commitlint + lefthook
- Conventional Commits + commitlint + husky + lint-staged
- No local hooks, CI only

## Decision outcome

Chosen option: "Conventional Commits + commitlint + lefthook".

- commitlint 21 with `@commitlint/config-conventional` and `header-max-length` set to 100 (owner rule).
- lefthook 2:
  - `pre-commit`: `oxfmt` and `oxlint` on staged files;
  - `commit-msg`: commitlint.
- Hooks are installed by the root `prepare` script, because lefthook's install script is denied (ADR-0003).
- Work happens on feature branches and reaches `main` through pull requests.
- A pull request template carries a checklist based on the definition of done in `AGENTS.md` (ADR-0014).

husky with lint-staged needs two packages to do what lefthook does with one binary and one configuration file. CI-only checks give feedback only after a push.

### Consequences

- Good, because commit types make history scannable.
- Good, because formatting and lint issues are caught before the commit exists.
- Bad, because hooks can be skipped with `git commit --no-verify`; CI (ADR-0016) remains the authority.
- Bad, because checking only staged files misses errors those changes cause elsewhere; CI typecheck and full lint catch them.
- Bad, because a clone installed with `pnpm install --ignore-scripts` skips `prepare` and has no hooks.

## More information

- Conventional Commits: https://www.conventionalcommits.org/en/v1.0.0/
- commitlint: https://commitlint.js.org/
- lefthook: https://github.com/evilmartians/lefthook
- Revisit if commit hooks become slow enough that people bypass them.
