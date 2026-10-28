---
name: adr
description: Record a technical decision as an ADR awaiting human approval. Use whenever a change adds or replaces a technology, dependency, skill, MCP server, tool, pattern, convention, folder structure or configuration that others must follow, or when the user asks to document a decision. Never for visual design choices.
---

# Architecture Decision Record

Every architecture or technical decision gets an ADR, and only a human approves it.

## When

Write one before implementing when the change:

- adds, removes or replaces a dependency or tool;
- introduces a pattern, convention, folder or naming rule;
- changes build, test, lint, CI, deployment or security configuration;
- contradicts or supersedes an existing ADR.

Bug fixes and features that follow existing ADRs need none. Design choices never get one: a direction, palette, typeface, layout or the copy of a page belongs in `DESIGN.md` and `theme.css`, and an ADR states only the technical mechanism behind it.

## How

1. Read `docs/adr/README.md` and the ADRs related to the change.
2. Copy `docs/adr/template.md` to `docs/adr/NNNN-kebab-title.md` with the next number.
3. Fill every section. List at least two real options with honest trade-offs. Facts must be verifiable (versions, docs links); no invented numbers.
4. Keep `status: proposed`. Never write `accepted` or `rejected`: a hook blocks it, and the decision belongs to the user.
5. Add the ADR to the index in `docs/adr/README.md`.
6. Superseding: the new ADR names the one it replaces in "More information". The user updates the old one's status.
7. Tell the user the ADR awaits their decision. `pnpm adr:check` and CI stay red until they decide.
