---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0014. Agent-first repository setup

## Context and problem statement

AI agents write most of the code in this repository and in every project started from it. Without a structured setup they load irrelevant context, pick conflicting skills, and leave lint errors and design-system violations for humans to find. How do we organise instructions, skills, hooks and tool servers for agents?

## Decision drivers

- One entry point that any agent tool can read.
- Local rules next to the code they govern, loaded only when relevant.
- Reproducible skills: the same versions on every machine and in every clone.
- One skill per domain, so triggers do not conflict.
- Immediate, blocking feedback after each edit.
- Agents cannot approve their own decisions (ADR-0001).

## Considered options

- `AGENTS.md` hierarchy + vendored, pinned skills + Claude Code hooks + project MCP servers
- A single large `CLAUDE.md`
- Globally installed skills only
- Cursor rules

## Decision outcome

Chosen option: "`AGENTS.md` hierarchy + vendored, pinned skills + Claude Code hooks + project MCP servers".

Instructions:

- Root `AGENTS.md` is the single entry point: concise map, commands, golden rules, skill routing table, definition of done.
- Each workspace has its own `AGENTS.md` with local rules.
- `CLAUDE.md` files only `@import` their sibling `AGENTS.md`.

Skills are vendored in `.claude/skills/` with the `skills` CLI 1.7 and pinned in `skills-lock.json`, one primary skill per domain:

| Domain                            | Skill                |
| --------------------------------- | -------------------- |
| Design judgment                   | impeccable           |
| Component rules                   | shadcn               |
| Animation implementation          | GSAP official skills |
| Motion craft                      | Emil Kowalski skills |
| Copy and conversion (CRO)         | marketingskills      |
| React performance and composition | Vercel skills        |
| Test-driven development           | Matt Pocock `tdd`    |

Custom project skills fill the gaps: project kickoff methodology, landing page, scroll storytelling, design-system extension, Figma sync (ADR-0013), Figma prototyping on top of `use_figma` (no maintained prototyping MCP or skill was worth depending on; the dedicated MCPs need their own Figma plugin and have little adoption), ADR writing (ADR-0001).

Hooks in `.claude/settings.json` (implemented in `tooling/src/hooks/`): format and lint every edited file and block the agent until it is clean (ADR-0006); guard ADR status (ADR-0001). The same file enables the official Figma plugin (MCP server and skills). MCP servers in `.mcp.json`, pinned: `next-devtools-mcp` (dev-server errors, routes, compilation) and `@playwright/mcp` (screenshots for the `design-reviewer` agent in `.claude/agents/`).

A single large `CLAUDE.md` loads every rule into every session and serves one tool only. Globally installed skills differ per machine. Cursor rules serve Cursor only.

### Consequences

- Good, because every agent starts from the same map and the same pinned skills.
- Good, because lint and format errors are fixed in the same turn they are introduced.
- Good, because `AGENTS.md` is read by several agent tools, not only Claude Code.
- Bad, because vendored skills are third-party instructions; each update must be reviewed like code.
- Bad, because blocking hooks add latency to every edit.
- Bad, because hooks only run in Claude Code; other agents rely on lefthook (ADR-0015) and CI (ADR-0016).
- Bad, because the skill set needs curation as new skills overlap existing domains.
- Bad, because the `impeccable` skill runs a launcher that downloads a checksum-verified native binary from its GitHub releases on first use; `shadcn` runs `npx shadcn@latest info` when loaded. Both execute third-party code on the developer's machine.

## More information

- AGENTS.md: https://agents.md/
- Claude Code memory and imports: https://code.claude.com/docs/en/memory
- Claude Code skills: https://code.claude.com/docs/en/skills
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- Claude Code MCP: https://code.claude.com/docs/en/mcp
- `skills` CLI: https://github.com/vercel-labs/skills
- Revisit when a vendored skill is no longer maintained, or when two skills keep triggering on the same task.
