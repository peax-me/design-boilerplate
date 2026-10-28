---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0013. Figma integration from code to Figma

## Context and problem statement

The owner wants the design system linked to Figma, while tokens and components live in code (ADR-0008). Without a defined workflow, Figma and code drift apart and agents implement whichever they read last. How do code and Figma stay linked, in which direction, and with which tools?

## Decision drivers

- Code is the single source of truth (owner's decision).
- Figma variables and components mirror code tokens and components.
- Agents generating UI from Figma reuse existing components instead of recreating them.
- Drift between Figma and code is detected, not discovered by accident.
- Official, supported tooling.

## Considered options

- Code → Figma with the official Figma plugin skills and Code Connect
- Figma → code (Figma variables as source of truth)
- Continuous two-way synchronisation
- No Figma linkage

## Decision outcome

Chosen option: "Code → Figma with the official Figma plugin skills and Code Connect".

Workflow:

1. Push tokens to Figma variables and components to a Figma library with the official Figma plugin skills `figma-generate-library` and `figma-generate-design`.
2. Map Figma components to code with Code Connect parserless templates in `packages/ui/figma/*.figma.ts` (`@figma/code-connect` 2.1), linted and type-checked with the code, published through the Figma MCP (`send_code_connect_mappings`) or the `figma connect publish` CLI. Publishing requires an Organization or Enterprise workspace: on the current Professional team Figma rejects it (verified 2026-10-28), so the templates wait in the repository until the library moves.
3. Treat edits made in Figma as proposals: implement them in code with `figma-design-to-code`, then push the result back to Figma.
4. Run parity checks between Figma and code to detect drift.

The library is organised in three pages (`Cover`, `Foundations`, `Components` with one section per component family), variables mirror `theme.css` (Color Light/Dark, Spacing, Radius, Typography Desktop/Mobile) and text styles are bound to them. The project skill `figma-sync` documents this workflow. The Figma MCP server and skills come from the official Figma plugin, enabled for the project in `.claude/settings.json` (ADR-0014).

Figma as source was rejected by the owner (ADR-0008). No continuous automatic two-way sync between Figma and code exists today (verified). Having no linkage leaves drift undetected.

### Consequences

- Good, because Figma reflects what ships, and agents reading Figma get mapped code components.
- Good, because design changes go through the same review and lint as any code change.
- Bad, because Code Connect requires a Figma Organization or Enterprise plan and published components.
- Bad, because pushing to Figma is an agent-run step, not continuous; Figma lags code until it runs.
- Bad, because designers cannot change the system directly in Figma; their changes wait for a code change.
- Bad, because each developer needs Figma authentication for the MCP server.

## More information

- Figma MCP server: https://developers.figma.com/docs/figma-mcp-server/
- Code Connect: https://developers.figma.com/docs/code-connect/
- Code Connect repository: https://github.com/figma/code-connect
- Revisit if Figma ships a supported continuous code-to-Figma synchronisation.
