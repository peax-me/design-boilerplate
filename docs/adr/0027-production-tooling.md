---
status: accepted
date: 2026-11-04
decision-makers: [project owner]
---

# 0027. Production tooling

## Context and problem statement

Animated pages need produced visuals: video, 3D models, frame sequences, HDRIs and splats. ADR-0018 made Magnific the single paid media provider. The `scene-3d` skill so far treated the Blender MCP as optional, installed per machine at user scope, because the server runs Python sent by the agent, and three CVEs were reported against the Blender MCP in June 2026 (CVE-2026-10661, CVE-2026-10662, CVE-2026-10688). Which tools produce and process visuals, and under which constraints?

## Decision drivers

- One paid provider and one spending cap: 30,000 Magnific credits per page, exploration, drafts and retries included.
- An agent can build, clean and render a Blender scene in one session.
- Code an agent sends to a tool runs under a guard, and telemetry is off on every MCP server that allows it.
- Every shipped asset is licensed for commercial use (ADR-0024).
- Scripts that run outside that guard are versioned in the project.

## Considered options

- Magnific as the only paid provider, plus the Blender MCP in safe mode and local command-line tools
- Blender through the command line only
- A second paid provider for world or splat generation (Marble)

## Decision outcome

Chosen option: "Magnific as the only paid provider, plus the Blender MCP in safe mode and local command-line tools", because it keeps one bill and one cap, and the Blender MCP covers building, cleaning and lightening a scene, rendering and GLB export in one session. Command line only gives up that session. A second paid provider would spend outside the cap.

Mandated by the project owner: the Blender MCP. The project owner reports that the June 2026 CVEs are fixed in current releases. The configuration choices around it:

- **Blender MCP**: `uvx mcp-for-blender@2.2.7` in `.mcp.json`. Version 2.2.7 was released on 2026-11-04, and the exact version is pinned.
- `DISABLE_TELEMETRY=true` turns off all telemetry, including the anonymous usage record.
- `BLENDER_MCP_SAFE_MODE=1` validates every script. It blocks direct file reads and writes, running other programs, network access and persistent code. Modelling, materials, rendering, saving and import and export keep working.
- The Blender add-on is installed on each machine with `uvx mcp-for-blender@2.2.7 install-addon`, and Blender must be open for the MCP to work.
- **Blender on the command line**, `blender -b -P script.py`, stays for headless batch jobs. It has no safe mode, so it only runs scripts from the project's versioned `assets/3d/source/scripts/`.

The other tools:

- **Magnific** (ADR-0018): video (Seedance 2.5 first, with start and end frames to loop or chain shots), 3D (Tripo, Hunyuan, Meshy, Trellis), depth maps and video background removal. `video_view_frames` and `video_analyze` are free and judge a render. Costs observed on 2026-11-04: Seedance 2.5 10 s 1080p 7,900 credits, draft 2,000, Tripo 3D model 580.
- **ffmpeg, avifenc and cwebp** produce frame sequences, scrub videos and posters. The builder may use `sharp` where it is already installed.
- **Poly Haven** (CC0) provides HDRIs and PBR textures.
- **Brush** (Apache-2.0, local) trains splats from Magnific images or videos. Spark displays them (ADR-0024).

Generated visuals live in the client project that uses them, never in the boilerplate. The provenance record of ADR-0018 applies to every file produced with these tools.

### Consequences

- Good, because the agent works on a Blender scene directly, and safe mode bounds what its scripts can do.
- Good, because telemetry is off, including the anonymous usage record.
- Good, because one provider and one cap make spend easy to count.
- Good, because the local tools are free and permissively licensed (CC0, Apache-2.0).
- Bad, because in autonomous runs (ADR-0028) agent-written Python runs in Blender without human review. Through the MCP it is bounded by safe mode. Through headless `blender -b -P`, which has no safe mode, it is bounded only by the rule that scripts live, versioned, in `assets/3d/source/scripts/`.
- Bad, because the socket server of the add-on (`localhost:9876` by default) has no authentication or encryption: any local process that reaches the port can run Python in Blender and bypass safe mode.
- Bad, because the fix of the June 2026 CVEs rests on the project owner's report. The cited vulnerability reports do not confirm a fixed version: the fieldguide page covers the older `blender-mcp` server and lists none, and PyPI mentions no CVE. The exact version is pinned, so later releases do not enter until someone adopts them on purpose.
- Bad, because Blender, the add-on, `uvx`, ffmpeg, avifenc, cwebp and Brush must be installed on each machine, and Blender must be open for the MCP; `pnpm install` does not provide them.
- Bad, because without Marble a splat needs a local Brush training step.
- Bad, because the cap is tight against video prices: at 7,900 credits per final 10 s 1080p clip, three clips fit in a page, and drafts count too.

## More information

- Blender MCP package: https://pypi.org/project/mcp-for-blender/
- Upstream vulnerability report for CVE-2026-10688 (older `blender-mcp` server, not a fix confirmation): https://fieldguide.lutrasecurity.com/CVE-2026-10688/
- Magnific licences: https://www.magnific.com/ai/docs/licenses-attribution
- Blender command line: https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html
- Poly Haven licence: https://polyhaven.com/license
- Brush: https://github.com/ArthurBrussee/brush
- Related: ADR-0018 (Magnific, provenance), ADR-0022 (media pipeline), ADR-0024 (licence policy), ADR-0026 (MCP server list and telemetry rule), ADR-0028 (autonomous mode).
- The Blender MCP joins `.mcp.json`. The partial supersession of the ADR-0014 server list is recorded in ADR-0026.
- Revisit when a Blender MCP release changes the safe mode or the telemetry options, or when Magnific changes plans or credit prices.
