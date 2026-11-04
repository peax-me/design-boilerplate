---
status: proposed
date: 2026-11-04
decision-makers: [project owner]
---

# 0028. Autonomous mode

## Context and problem statement

From one sentence or a client brief, an agent must produce an animated page alone. The existing skills stop for a human at each gate (direction, storyboard, quote), and a pipeline that waits at every step is a failure. Yet only a human accepts an ADR (ADR-0001), and credits are real money. How does a run go from brief to verified page without a human, inside bounds the human has set?

## Decision drivers

- A run needs no human outside a small, explicit set of stops.
- Magnific spend is capped at 30,000 credits per page.
- Technical decisions stay human-approved (ADR-0001).
- Interactive sessions keep their validations.
- An agent's choices stay auditable after the run.
- An ordinary session does not stall on permission prompts for the tools of the arsenal.

## Considered options

- Autonomous mode with two hard stops, self-check points and an allow-list
- Human validation at every skill gate, as today
- Unbounded autonomy, with no hard stop

## Decision outcome

Chosen option: "Autonomous mode with two hard stops, self-check points and an allow-list", because it removes every wait except the two that carry real risk, money and unapproved technology. Human validation at every gate cannot meet the goal, and unbounded autonomy would let an agent overspend or adopt a technology nobody approved.

Hard stops:

- A Magnific spend that would take the page past 30,000 credits. The agent counts with `simulate_cost` before every paid call.
- A technical decision outside the accepted ADRs. The agent writes an ADR with `status: proposed` and stops. `pnpm check` stays red until the user accepts it.

To keep the second stop rare, ADR-0024 to ADR-0027 fix the arsenal once: allowed libraries and their major versions, and the components, patterns and configuration the techniques imply.

Self-check points: in an autonomous run, the validations of the existing skills become self-checks. The agent decides, logs its reason in `DESIGN.md` and reviews its own work with `motion-review` (ADR-0026). Interactive sessions keep the validations as they are.

Permissions: `.claude/settings.json` gains an allow-list for the arsenal tools (`blender`, `ffmpeg`, the image encoders, the Magnific MCP tools, Playwright and Chrome DevTools). Tools that run JavaScript in the page, such as frame measurement, are allowed only against the project's local server. Runs keep the current permission mode of the Conductor workspaces.

Orchestration: the `signature-experience` skill starts from a sentence or a brief and chains product context, direction, choice of technique family, storyboard, visual plan, code, then verification, critique and correction in a loop until the quality grid passes.

### Consequences

- Good, because a run goes from brief to verified page without waiting.
- Good, because every choice and its reason are logged in `DESIGN.md`.
- Good, because spend is bounded per page.
- Bad, because the agent grades its own work at the self-check points, which is weaker than a human validation; the automated checks of ADR-0026 and the user's review of the trial runs compensate.
- Bad, because the allow-list pre-approves paid Magnific calls, so the 30,000 cap rests on the agent's count with `simulate_cost`, not on a technical limit.
- Bad, because any decision outside the accepted ADRs still halts the run until the user accepts an ADR.

## More information

- Related: ADR-0001 (human approval), ADR-0014 (agent setup), ADR-0017 (Conductor workspaces), ADR-0024 to ADR-0027 (the arsenal).
- Amends ADR-0018: in an autonomous run, the explicit yes before a paid call becomes a check against the per-page cap.
- Revisit when the trial runs show that the stops fire too often or too rarely, or that the self-check points let defects through.
