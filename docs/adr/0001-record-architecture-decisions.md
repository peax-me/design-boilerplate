---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0001. Record architecture decisions with mandatory human approval

## Context and problem statement

This repository is the boilerplate every new project starts from, and most of its code is written by AI agents. A technical choice an agent makes implicitly is hard to audit, easy to contradict in a later session, and gets copied into every project created from the boilerplate. The project owner requires that every architecture or technical decision is written down and validated by a human. How do we record decisions so that agents can propose them but never ratify them?

## Decision drivers

- Every decision is traceable to an explicit human approval (owner requirement).
- Agents read the decision log before a task and stay consistent across sessions.
- Approval is enforced by tooling, not by a convention an agent can forget.
- Plain Markdown in the repository, reviewed in pull requests, no extra service.

## Considered options

- MADR 4 in `docs/adr/` with tool-enforced human approval
- Michael Nygard's original ADR format
- Log4brains (ADR tooling with a generated site)
- No ADRs; decisions live in pull request descriptions

## Decision outcome

Chosen option: "MADR 4 in `docs/adr/` with tool-enforced human approval", because MADR's fixed sections (drivers, options, consequences) put the trade-offs in front of the human reviewer, its YAML frontmatter exposes a machine-readable `status` that a hook and CI can check, and it needs nothing beyond Markdown.

Rules:

- One file per decision: `docs/adr/NNNN-kebab-title.md`, created from `docs/adr/template.md` and listed in `docs/adr/README.md`.
- Statuses: `proposed`, `accepted`, `rejected`, `deprecated`, `superseded`.
- Agents only write `status: proposed`. Only a human sets `accepted` or `rejected`.
- An accepted ADR is immutable. A changed decision is a new ADR that supersedes the old one; the old ADR's status becomes `superseded` and it links its successor.

Enforcement:

- `tooling/src/hooks/guard-adr-status.ts`: a Claude Code `PreToolUse` hook that blocks an agent write setting `status: accepted` or `status: rejected`.
- `tooling/src/check-adrs.ts`, run as `pnpm adr:check` locally and in CI (ADR-0016): fails while any ADR is `proposed`, or when an ADR is malformed (missing status, unknown status, file name not matching `NNNN-kebab-title.md`).

Nygard's format has a free-text status and no drivers or options sections, which weakens both validation and review. Log4brains adds a dependency and a generated site; a Markdown index is enough. Having no ADRs fails the owner's requirement.

### Consequences

- Good, because every decision has a human sign-off visible in the git history.
- Good, because accepted ADRs give agents explicit constraints instead of re-deciding.
- Good, because CI makes it impossible to merge an unreviewed decision unnoticed.
- Bad, because CI stays red until a human reviews each proposed ADR, including this initial set (0001 to 0016); this latency is intended.
- Bad, because the hook only sees the Claude Code tool calls it is registered for; other agent tools, or a shell command editing the file, are caught only by CI and pull request review.
- Bad, because small decisions carry the cost of writing an ADR.

## More information

- MADR: https://adr.github.io/madr/
- ADR overview: https://adr.github.io/
- Nygard, "Documenting Architecture Decisions": https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- Log4brains: https://github.com/thomvaill/log4brains
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- Revisit when another agent tool becomes primary (the hook must be ported) or when the flat index becomes hard to navigate.
