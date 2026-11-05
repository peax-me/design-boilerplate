---
status: accepted
date: 2026-11-04
decision-makers: [project owner]
---

# 0024. Real-time rendering arsenal and licence policy

## Context and problem statement

Premium animated pages rely on live shaders, GPU particles, scroll-driven video, real-time 3D scenes, post-processing and scanned splats. The boilerplate ships no effect and no effect library, because `knip` rejects unused dependencies. An agent that builds a page alone cannot wait for a human each time it needs a library, a helper or an effect component. Which engine, libraries, skills and licences are allowed up front?

## Decision drivers

- Agents run alone, so stops for decisions outside the accepted ADRs must stay rare (ADR-0028).
- WebGL2 runs on phones and desktops; WebGPU is not yet a safe default.
- Everything shipped to a client is licensed for commercial use.
- No speculative dependency: a library is installed when a project uses it (golden rule 6).
- GSAP stays the only animation library (ADR-0011).

## Considered options

- WebGL2 with React Three Fiber 9 and the pmndrs libraries, approved as a set
- WebGPU and TSL as the default engine (React Three Fiber 10)
- One ADR per project and per library

## Decision outcome

Chosen option: "WebGL2 with React Three Fiber 9 and the pmndrs libraries, approved as a set", because it covers every technique in scope on stable releases, and approving the set once is what lets a run finish without a human. WebGPU loses as a default: the three.js documentation for LLMs (`llms.txt`, r187) still recommends `WebGLRenderer`, and React Three Fiber 10, which defaults to WebGPU, is alpha only. One ADR per library would stop every run at its first helper.

Engine and libraries, with the versions checked on 2026-11-04:

- WebGL2 is the default engine. WebGPU and TSL are allowed only when a scene exceeds one million particles.
- `@react-three/fiber` 9 and `three`, already dependencies of `@repo/ui` (ADR-0025). The repository pins `three` 0.186.1, which sits below the `postprocessing` 6.x peer limit.
- `@react-three/postprocessing` 3.x (3.2.2, peer React Three Fiber ≥ 9.7) with `postprocessing` 6.x (6.39.6, peer `three` < 0.188).
- `@react-three/drei` 10.x (10.7.9). Helpers are imported one by one. Decoders are self-hosted, because the Draco loader of drei points to a third-party CDN by default.
- `@sparkjsdev/spark` 2.x (2.4.0, MIT) renders Gaussian splats.

Skills:

- The eight CloudAI-X skills (`threejs-shaders`, `threejs-postprocessing`, `threejs-materials`, `threejs-textures`, `threejs-lighting`, `threejs-geometry`, `threejs-interaction`, `threejs-fundamentals`), MIT, vendored and pinned in `skills-lock.json` like the five already there.
- The project skills `shader-craft`, `gpu-particles` and `cinematic-footage`. Their recipes are rewritten from MIT or Apache-2.0 sources.

Coverage and installation:

- Effect components, scene primitives and video components built with these libraries and skills are covered by this ADR, without an ADR per project. So are the `next.config` image settings they imply.
- A project installs a library only when it uses it, and pins it then in the pnpm catalog (ADR-0003). The majors above are the only ones an agent may choose.

Licence policy for the code and assets a project ships:

- Allowed: MIT, Apache-2.0, BSD, Zlib, CC0, and Magnific outputs under Magnific's terms (ADR-0018).
- Excluded: LYGIA (Prosperity licence, non-commercial), Shadertoy code without an explicit permissive licence, self-hosted Hunyuan weights (their licence excludes the EU) and Apple SHARP (research only).

### Consequences

- Good, because an agent writes any effect in scope without stopping, while the human reviews the arsenal once.
- Good, because one engine, one set of majors and one licence rule keep client pages maintainable and safe to deliver.
- Good, because the boilerplate still ships no effect library and `knip` stays clean.
- Bad, because the pmndrs peer ranges are tight: `postprocessing` 6.x blocks `three` 0.188 and later, and `@react-three/postprocessing` 3.x needs React Three Fiber 9.7 or later.
- Bad, because a scene past one million particles needs a second rendering path (WebGPU and TSL).
- Bad, because approving whole classes of components means individual effects are not reviewed as decisions; motion verification (ADR-0026) and design review check them instead.
- Bad, because licences are checked by agents following the skills; no gate in `pnpm check` enforces them.

## More information

- React Three Fiber: https://r3f.docs.pmnd.rs
- three.js: https://threejs.org/docs
- three.js documentation for LLMs: https://github.com/mrdoob/three.js/blob/dev/docs/llms.txt
- postprocessing: https://github.com/pmndrs/postprocessing
- drei: https://github.com/pmndrs/drei
- Spark: https://github.com/sparkjsdev/spark
- Prosperity licence (LYGIA): https://prosperitylicense.com
- Related: ADR-0003 (catalogs), ADR-0011 (motion), ADR-0019 (superseded by ADR-0025; its deferral of `@react-three/drei` ends here), ADR-0022 (media pipeline), ADR-0025 (stage host), ADR-0026 (verification), ADR-0027 (production tooling), ADR-0028 (autonomous mode).
- Partially supersedes ADR-0018: its requirement that the first video of a project adds media components "through the `design-system` skill and an ADR". Video components built with the arsenal need no project ADR. The rest of ADR-0018 stays accepted.
- Partially supersedes ADR-0022: its revisit condition "or video", now answered by this ADR. The rest of ADR-0022 stays accepted.
- Revisit when React Three Fiber 10 reaches beta.
