---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0018. Inspiration, visual assets and 3D through skills and the Magnific MCP

## Context and problem statement

Projects started from this boilerplate need an original visual direction, images, icons, cut-outs, video loops and sometimes 3D models. Without a method, agents fall back to category clichés, pick stock or generators at random, spend credits without asking and ship files with no licence trail. Which tools and rules do agents follow to find inspiration, produce assets and add 3D?

## Decision drivers

- Originality: references are gathered and turned into principles before a direction is chosen.
- One paid media provider, so cost, licences and history stay in one account.
- No credit is spent without a quote and an explicit yes from the user.
- Every shipped asset has a known source and licence.
- No runtime dependency enters the boilerplate before a project needs it (YAGNI).

## Considered options

- Project skills (`design-inspiration`, `asset-production`, `scene-3d`) on top of the Magnific MCP, with vendored reference skills
- Third-party generation skills (Nano Banana, fal, inference.sh, RunComfy) as the primary tools
- No method: agents decide per task

## Decision outcome

Chosen option: "Project skills on top of the Magnific MCP", because Magnific already covers stock, image, vector, video and 3D generation, background removal and upscaling behind one account, and its catalog ranks models and quotes prices live. Third-party skills each add a CLI, an API key and a second bill, and their static model and price tables were already stale when evaluated.

- **Magnific MCP** (`https://mcp.magnific.com`, OAuth, no secret in the repository) in `.mcp.json` is the single paid media provider.
- **`design-inspiration`**: impeccable `shape` first, then Are.na (free) and Refero (paid) MCPs installed at user scope by whoever uses them, Playwright for motion references, Magnific for mood frames. References go in `DESIGN.md` with the principle borrowed from each.
- **`asset-production`**: sourcing order (repository → lucide icons → earlier Magnific work → Magnific stock → generation); `simulate_cost` and an explicit yes before any paid call; prompts built from `DESIGN.md` and `theme.css`; masters in `assets/source/`, shipped files in the feature folder; one provenance entry per shipped file in `assets/provenance.json`.
- **`scene-3d`**: the `threejs-*` skills (CloudAI-X) are vendored as references. The 3D runtime and its stage live in `@repo/ui` (ADR-0019).
- **`image`** (marketingskills) is vendored as a reference for placement sizes and failure modes; its stock sources, markup and alt-text advice are overridden by `asset-production`.
- The first image or video of a project adds media components to `@repo/ui` and the `images` settings to `next.config.ts`, through the `design-system` skill and an ADR.

### Consequences

- Good, because directions start from stated principles, not from defaults.
- Good, because spend is always quoted and approved, and every asset has a licence trail.
- Good, because the boilerplate ships no image or video runtime it does not use.
- Bad, because Magnific is a paid subscription; without it, generation falls back to stock and client files.
- Bad, because AI output carries a commercial licence on paid plans but no legal indemnity, and licence persistence after a subscription ends is unconfirmed.
- Bad, because result URLs expire and some output formats are undocumented; files must be downloaded at once.
- Bad, because the provenance manifest is enforced by the skill, not by a gate in `pnpm check`.

## More information

- Magnific licences: https://www.magnific.com/ai/docs/licenses-attribution
- Related: ADR-0008 (tokens), ADR-0011 (motion), ADR-0014 (agent setup).
- Revisit when a project ships its first assets (add a provenance gate to `pnpm check`), or if Magnific changes plans or licence terms.
