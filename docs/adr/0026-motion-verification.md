---
status: proposed
date: 2026-11-04
decision-makers: [project owner]
---

# 0026. Motion verification

## Context and problem statement

The design audit and the design review see still frames. A blank, frozen or janky canvas passes both. Lighthouse CI collects `/` only, and frame times measured on SwiftShader (software WebGL, used in CI) say nothing about a real GPU. How does an agent see and judge the motion it produces, and which checks fail the build?

## Decision drivers

- Agents must judge motion, not only screenshots.
- A blank canvas, a frozen canvas, a shader error and a missing reduced-motion fallback fail automatically.
- `pnpm test:e2e` runs without a GPU, so it cannot assert frame times.
- The Lighthouse budgets of ADR-0016 must hold on every route and on both form factors, not on `/` alone.
- Console errors and warnings unrelated to WebGL or shaders (React DevTools, HMR) must not fail the audit.
- Telemetry is off on every MCP server that allows it.

## Considered options

- A motion check in `packages/design-audit` on SwiftShader, a local real-GPU perf run, and Lighthouse on every route and form factor
- Still screenshots only, as today
- Frame-time assertions in CI on SwiftShader

## Decision outcome

Chosen option: "A motion check in `packages/design-audit`, a local real-GPU perf run, and Lighthouse on every route and form factor", because each check runs where its measure is meaningful. Still screenshots cannot tell a frozen canvas from a calm one, and SwiftShader timings would gate the build on a number that does not exist on a real device.

Motion check, run by `pnpm test:e2e` on SwiftShader:

- Scripted scroll over progress steps, one capture per step, assembled into a contact sheet.
- Blank canvas: the standard deviation of luminance on a 32×32 grid is below 2.
- Frozen canvas: the mean difference between two captures 500 ms apart is below 0.5, where motion is expected.
- A WebGL or shader error in the console fails the run. Console errors and warnings unrelated to WebGL or shaders do not.
- A pass with reduced motion enabled.
- The WebGL renderer string is logged.

Perf budgets on a real GPU, run locally: CPU throttled 4×, 95th percentile of frame times ≤ 20 ms, no long animation frame above 100 ms during scroll. These are starting values, adjusted after the trial runs.

Lighthouse on mobile and desktop for every route of `apps/web/e2e/support/routes.ts`: performance ≥ 0.95, accessibility, best practices and SEO = 1.

MCP servers in `.mcp.json`, with telemetry off on every server that allows it:

- `npx -y @playwright/mcp@0.0.84 --caps=devtools` replaces 0.0.83. The capability adds video and tracing tools. Playwright MCP has no telemetry option.
- `npx -y chrome-devtools-mcp@1.12.0 --no-usage-statistics` is added for performance traces, CPU throttling, screencast, Lighthouse and reduced-motion emulation. Chrome DevTools MCP sends usage statistics to Google unless that flag is set.
- `next-devtools-mcp@0.4.0` stays and gains the `env` entry `NEXT_TELEMETRY_DISABLED=1`.
- The Blender MCP joins the list through ADR-0027, with its own telemetry setting.

The `motion-review` skill and the extended `design-reviewer` agent judge recordings and contact sheets against a written quality grid. The repository ships no reference image: the only images to compare against are the project's own references from `design-inspiration`.

### Consequences

- Good, because blank canvases, frozen canvases and shader errors fail `pnpm test:e2e`.
- Good, because agents get a recording and a contact sheet, evidence of motion rather than a still.
- Good, because Lighthouse covers every route on both form factors.
- Bad, because the real-GPU run is local and manual; CI cannot assert frame times.
- Bad, because the thresholds are starting values; the frozen check only applies where motion is expected, so a deliberately static scene must say so.
- Bad, because Lighthouse on every route and form factor lengthens CI.
- Bad, because the two browser MCP servers can run JavaScript in the page. Limiting that to the project's local server is a skill rule that permissions cannot enforce (ADR-0028).

## More information

- Playwright MCP: https://github.com/microsoft/playwright-mcp
- Chrome DevTools MCP and its usage statistics: https://github.com/ChromeDevTools/chrome-devtools-mcp
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- Related: ADR-0012 (testing), ADR-0025 (stage host), ADR-0027 (Blender MCP), ADR-0028 (autonomous mode).
- Partially supersedes ADR-0014: its list of pinned project MCP servers (`next-devtools-mcp` and `@playwright/mcp`). Playwright moves to 0.0.84 with `--caps=devtools`, `next-devtools-mcp` gains `NEXT_TELEMETRY_DISABLED=1`, and Chrome DevTools MCP (this ADR) and the Blender MCP (ADR-0027) join the list. The rest of ADR-0014 stays accepted.
- Partially supersedes ADR-0016: its Lighthouse CI gate, which sets budgets without a route or form-factor scope and collects `/` only. The gate now covers every route of `apps/web/e2e/support/routes.ts` on mobile and desktop, with the same budgets. The rest of ADR-0016 stays accepted.
- Revisit after the trial runs, to adjust the thresholds, or when CI gets a real GPU, which would let the perf budgets move into the gates.
