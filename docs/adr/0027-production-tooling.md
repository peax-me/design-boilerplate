---
status: proposed
date: 2026-11-04
decision-makers: [project owner]
---

# 0027. Production tooling

## Context and problem statement

Animated pages need produced visuals: video, 3D models, frame sequences, HDRIs and splats. ADR-0018 made Magnific the single paid media provider and let `scene-3d` use the Blender MCP per machine. That MCP runs arbitrary Python sent by the agent. Which tools produce and process visuals, and under which constraints?

## Decision drivers

- One paid provider and one spending cap: 30,000 Magnific credits per page, exploration, drafts and retries included.
- No tool that runs arbitrary code without a guard in the pipeline.
- Every shipped asset is licensed for commercial use (ADR-0024).
- Scripts are reviewed and versioned like any other tool.

## Considered options

- Magnific as the only paid provider, plus local command-line tools
- The Blender MCP in the pipeline
- A second paid provider for world or splat generation (Marble)

## Decision outcome

Chosen option: "Magnific as the only paid provider, plus local command-line tools", because it keeps one bill, one cap and no network-facing code execution. The Blender MCP loses on security: three CVEs in June 2026 (CVE-2026-10661, CVE-2026-10662, CVE-2026-10688) and telemetry on by default. A second paid provider would spend outside the cap.

- **Magnific** (ADR-0018): video (Seedance 2.5 first, with start and end frames to loop or chain shots), 3D (Tripo, Hunyuan, Meshy, Trellis), depth maps and video background removal. `video_view_frames` and `video_analyze` are free and judge a render. Costs observed on 2026-11-04: Seedance 2.5 10 s 1080p 7,900 credits, draft 2,000, Tripo 3D model 580.
- **Blender on the command line**, `blender -b -P script.py`, without network access: lighten a model, sample a mesh into a point cloud, render a poster, export GLB. Scripts are reviewed and versioned as tools. It replaces the Blender MCP.
- **ffmpeg, avifenc and cwebp** produce frame sequences, scrub videos and posters. The builder may use `sharp` where it is already installed.
- **Poly Haven** (CC0) provides HDRIs and PBR textures.
- **Brush** (Apache-2.0, local) trains splats from Magnific images or videos. Spark displays them (ADR-0024).

Generated visuals live in the client project that uses them, never in the boilerplate. The provenance record of ADR-0018 applies to every file produced with these tools.

### Consequences

- Good, because no tool in the pipeline executes code received over a network.
- Good, because one provider and one cap make spend easy to count.
- Good, because the local tools are free and permissively licensed (CC0, Apache-2.0).
- Bad, because Blender scripts replace live control of a scene: each task needs a script, and iteration is slower.
- Bad, because Blender, ffmpeg, avifenc, cwebp and Brush must be installed on each machine; `pnpm install` does not provide them.
- Bad, because without Marble a splat needs a local Brush training step.
- Bad, because the cap is tight against video prices: at 7,900 credits per final 10 s 1080p clip, three clips fit in a page, and drafts count too.

## More information

- Magnific licences: https://www.magnific.com/ai/docs/licenses-attribution
- Blender command line: https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html
- Poly Haven licence: https://polyhaven.com/license
- Brush: https://github.com/ArthurBrussee/brush
- Related: ADR-0022 (media pipeline), ADR-0024 (licence policy), ADR-0028 (autonomous mode).
- Amends ADR-0018: command-line Blender replaces the optional Blender MCP in `scene-3d`.
- Revisit when a project needs interactive Blender authoring that scripts cannot cover, or when Magnific changes plans or credit prices.
