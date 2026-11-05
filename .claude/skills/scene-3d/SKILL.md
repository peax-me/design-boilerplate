---
name: scene-3d
description: Build real-time 3D inside the design system. Source or generate a model (Magnific, Blender through its MCP in safe mode, Poly Haven), optimise it, light it with an HDRI, add water and reflections, bloom and light rays, show a scanned object as Gaussian splats with Spark, and drive it with GSAP scroll as the lazy scene of the Stage host, live on phones in the light tier, with the poster captured from the first frame. Use when the user wants a 3D model, a 3D hero, an object that turns or assembles on scroll, a WebGL scene, water or reflections, an HDRI-lit product, a scan or splat, or "complex 3D animation".
---

# 3D scene

3D earns its place when it explains something a flat image cannot: an object to inspect, a mechanism that assembles, a space to move through. It counts as the page's signature moment in the motion budget (`scroll-storytelling`). If a still image or a video loop tells the same story, use that instead. A surface, light or matter effect is a shader (`shader-craft`), a shape that transforms is particles (`gpu-particles`), a real place or a camera journey is footage (`cinematic-footage`).

## 1. Build on the stage

`three` and `@react-three/fiber` live in `@repo/ui` (ADR-0025, which supersedes ADR-0019). A 3D scene is the lazy scene of a `Stage` (`packages/ui/src/motion/stage.tsx`): `Stage` takes the `poster` and `renderScene({ tier, onReady })`, and the scene renders a `StageCanvas` and calls `useFirstFrame(onReady)`. Where each file lives, the effect component, the framing and the tests follow `shader-craft` §2, §7 and §8 and its `references/effect-skeleton.md`: a model scene is the same skeleton with a model where it has a full-screen plane. Apps pass data and a choreography, never a canvas.

`Stage` guarantees the loading, the tiers (`light` runs live on phones after a first interaction, `full` after idle), the fallback to the poster, the one clock and the pause control of an `ambient` stage: the contract, the clock rules and the resource lifecycle are in `shader-craft` §2 and §3, and a scene never rebuilds them. A scene reads `tier` and changes cost only (§7). In a 3D scene, flowing water or an idle turntable is what makes the stage `ambient`.

What is specific to 3D:

- A resource made by hand (`Water`, a render target, a `SplatMesh`, a video) lives in `useSceneResource`. Files load through suspense (`useGLTF`, `useLoader`): they cache by URL, and the stage keeps its poster while they load. Never `useGLTF.preload`: a phone that never interacts must not download the model.
- `@react-three/drei` 10 is allowed by ADR-0024, helpers imported one by one. Install it when a scene uses it, pinned in the pnpm catalog (`shader-craft` §2 gives the commands). Self-host what it fetches: its Draco and KTX2 decoders and the `preset` of `Environment` point to third-party CDNs. Never `ScrollControls`: the document scrolls, with Lenis.
- Tests first, as `shader-craft` §8.

## 2. Get the model

In this order: an existing model the client owns, a licensed model, generation with the Magnific MCP.

- Magnific: `models3d_text_generate` (text to 3D) or `models3d_generate` (image to 3D), then `models3d_remesh`, `models3d_retexture`, `models3d_rig`, `models3d_animate` as needed. Output is GLB.
- Each paid call is quoted first and recorded as `asset-production` §3 describes: an interactive session works from the quote the user approved, an autonomous run proceeds at or under the page's 30,000-credit cap and stops above it. Download the GLB immediately: result URLs expire.
- Keep sources out of the app: `assets/3d/source/<name>.glb`, with provenance recorded as `asset-production` describes. Poly Haven (CC0) supplies HDRIs and PBR textures: record their URL and licence too.
- **Blender MCP**, adopted by ADR-0027: server `blender` in `.mcp.json` (`uvx mcp-for-blender@2.2.7`, `DISABLE_TELEMETRY=true`, `BLENDER_MCP_SAFE_MODE=1`). It builds, cleans and lightens a scene, authors clips, renders a still and exports GLB. Safe mode blocks direct file reads and writes, subprocesses and network access, and keeps modelling, materials, rendering, saving and import and export: move files with Blender's import and export operators, not Python I/O. A blocked call means change the method, never the setting. Install the add-on once per machine with `uvx mcp-for-blender@2.2.7 install-addon`, and open Blender before the session. The add-on's local socket has no authentication (ADR-0027): close Blender when the session ends.
- **Headless Blender** (`blender -b -P`) stays for batch jobs: many models, a repeated cleanup, a bulk export. It has no safe mode, so it runs only scripts kept in the project's `assets/3d/source/scripts/`. Write the script there first; never run one from `/tmp`, inline or downloaded.

## 3. Optimise

Follow `threejs-asset-pipeline`:

```bash
npx @gltf-transform/cli optimize assets/3d/source/<name>.glb apps/web/public/models/<name>.glb --compress meshopt --texture-compress webp --texture-size 2048
npx @gltf-transform/cli inspect apps/web/public/models/<name>.glb
```

- Budget: under 2 MB per model, textures 2048 px at most, one model per scene.
- Prefer meshopt (decoder bundled with three) over Draco. If Draco or KTX2 is unavoidable, self-host the decoders in `apps/web/public/` and point the loaders at them (`useGLTF` takes the Draco decoder path as its second argument; KTX2 needs a `KTX2Loader` with `setTranscoderPath` and `detectSupport`, attached through its `extendLoader` fourth argument).
- Generate a typed component with `npx gltfjsx apps/web/public/models/<name>.glb --types` into `packages/ui/src/scene/`, next to its scene, then bring it to the repository's rules: kebab-case file, named export, explicit names, no `preload`.
- Shipped locations follow `asset-production` §7. The app builds each URL with `process.env.NEXT_PUBLIC_BASE_PATH` and passes it to the scene.

## 4. Light, water and post

**HDRI.** Light the scene from a Poly Haven HDRI, chosen for the light `DESIGN.md` describes (time of day, colour, direction). Load it with `HDRLoader` (`three/addons`) or drei's `Environment` with `files`, never its `preset`. Assign it as an equirectangular environment: three prefilters it itself, so no `PMREMGenerator` (`threejs-textures`). `scene.environmentIntensity` and `environmentRotation` set strength and direction. 1k lights a scene; 2k only when the HDRI shows as a backdrop or in sharp reflections. Both tiers load the same file. Add a directional light only for a shadow that explains depth.

**Water.** `Water` from `three/addons/objects/Water.js` (MIT), built in `useSceneResource` and mounted with `<primitive object={water} />` (fiber never disposes a primitive: its lifetime is yours): `new Water(geometry, { textureWidth, textureHeight, waterNormals, sunDirection, sunColor, waterColor, distortionScale })`. Load the normal map with `useLoader` and pass it in as an input of the resource.

- The reflection draws the scene a second time into a render target every frame, so its size is the cost knob: 256 on `light`, 512 on `full`, nothing else differs between tiers. One reflective plane per scene, and keep what it reflects light.
- `waterNormals` is a tileable normal map with `RepeatWrapping`, from a source the licence policy allows. `sunDirection` follows the HDRI's sun. `waterColor` and `sunColor` come from tokens at runtime (`shader-craft` §6).
- `uniforms.time.value` accumulates the frame `delta`, written from a module-level function (`shader-craft` §3), so the first frame is the poster's. Flowing water makes the stage `ambient`.
- `Water` has no `dispose` and keeps its target private: the canvas releases the target with its context on unmount. Dispose its geometry and material in the cleanup.

**Bloom and light rays.** Post-processing follows `shader-craft` §5 (packages, `multisampling={0}`, merged passes, bloom settings). In a lit scene, bloom the emissive cores only: `emissiveIntensity` above 1 with `toneMapped: false`, threshold near 1. Bloom is mipmap blur on `full`, none or half resolution on `light`. Light rays are a desktop extra, `full` only: on `light` a model scene already spends its budget on geometry and the reflection pass. When bloom or rays change the first frame between tiers, keep them off the first frame (their intensity starts at 0 and rises with the progress) or capture a `light` poster too (`shader-craft` §7).

## 5. Scanned objects: splats

A real object that must keep its colours and light (a product, a sculpture, a place) is a Gaussian splat, not a mesh and not sampled points (`gpu-particles` §8 sends it here). A splat shows one object, cannot be relit and does not morph. A mesh wins when the object needs relighting, clips or physics.

**Before the first splat.** ADR-0027 names Brush, and neither a pose tool nor a compressor. The first splat of a project writes one ADR (`status: proposed`) that settles both, and stops (ADR-0028); until it is accepted, no splat is produced.

1. **Orbit footage.** Generate one continuous full turn around the still object, at constant height and distance, in plain even light, on a plain ground, with no cut and no text. The model, the keyframes (the same image as start and end closes the turn), the drafts, the review and the budget are those of `cinematic-footage` §2. A splat is only as good as the consistency of the object between views: ask `video_analyze` "Does the object keep the same shape, proportions and details from every side?" and reject a clip where it drifts.
2. **Frames.** Extract evenly spaced frames at the master's resolution, starting near 100 and adjusting to the result. A plain background, transparent frames or a `masks/` folder keep the background out of the splat.

```bash
ffmpeg -i assets/source/<feature>/<slot>/orbit.mp4 -vf "fps=<count>/<seconds>" assets/source/<feature>/<slot>/frames/%04d.png
```

3. **Poses.** Brush trains from COLMAP or Nerfstudio datasets: it reads no video and estimates no camera poses. Estimate them locally with the pose tool the ADR names (COLMAP, BSD-3-Clause, is the usual candidate), then lay the dataset out as Brush expects (`brush --help`).
4. **Train.** Brush (Apache-2.0, local) writes a `.ply`; `--with-viewer` shows it. Train a second, smaller splat for `light` from the same dataset (see `brush --help` for a cap on the number of splats).
5. **Compress.** A training `.ply` is far above the budget: ship `.spz`, or another format Spark reads, within the envelope of `cinematic-footage` §3 (6 MB for `full`, 3 MB for `light`). The route is part of the ADR: Spark's `writeSpz` exports `.spz` from a `PackedSplats` held in memory, through its WASM bridge, and its repository has an `assets:compress` script. Keep the dataset and the `.ply` in `assets/source/<feature>/<slot>/`, never shipped.
6. **Render with Spark** (`@sparkjsdev/spark` 2.x, MIT, ADR-0024; install it when used, pinned in the catalog). In `useSceneResource`, create a `SparkRenderer({ renderer })` added to the scene and a `SplatMesh({ url, onLoad })`, and call `dispose()` on both in the cleanup.
   - Render the child that calls `useFirstFrame` only after `onLoad` has fired: the stage fades the canvas in as soon as it is told, and an empty canvas over the poster fails the motion audit.
   - Training coordinates are y-down: expect to flip the mesh (Spark's examples use `quaternion.set(1, 0, 0, 0)`) and check the first frame against the poster.
   - Move the camera only along the captured orbit, with the scroll mapped to the angle. Past it, splats show holes and floaters.
   - Spark asks for a renderer without MSAA, and `StageCanvas` turns MSAA on at `full`. Measure the frame budget first; if it fails, change `StageCanvas` through `design-system` rather than working around it.
   - Provenance: one entry for the `.spz`, pointing at the orbit creation, the pose tool and the Brush command line.

## 6. Animate with the scroll

The scroll reaches the scene through the page's `{ value }` progress object, with the phases, dead zone and late mounts of `shader-craft` §3. Only what is 3D-specific lives here.

- The scene moves the model, the camera and the material uniforms from the progress; a splat's camera moves along the captured orbit (§5).
- Clips from the model (`useAnimations`) are scrubbed by setting the action time from the progress, not played freely. A clip that plays freely makes the stage `ambient`.
- Durations and easings come from `@repo/ui/motion/tokens`.
- One smoothing layer between the scroll and the model or camera (`scroll-storytelling` §4): under a held `ScrollScene`, the scrub; never a damping or a `quickTo` on top, which leaves the object behind its copy.
- An object that carries the whole page (a product seen in several states, a space crossed from section to section) can be one world: one stage fixed behind normally scrolling copy, each block a pose of the camera or the object (`motion-design` §4).

## 7. Poster, budget and accessibility

- The poster is the scene's first frame, captured with the recipe of `shader-craft` §7 (and its `capture-stage` script), never drawn or rendered elsewhere. For a model scene the first frame means the model at its progress-0 pose, the camera at its start, water at its first `delta`, the environment loaded, no `Math.random()`. Re-capture after any change of model, HDRI, light or camera.
- Cost knobs per tier, on top of `shader-craft` §9 (the pixel ratio comes from the tier):

| Knob                    | `light`                                       | `full`       |
| ----------------------- | --------------------------------------------- | ------------ |
| Water reflection target | 256                                           | 512          |
| Bloom                   | none, or half resolution without mipmap blur  | mipmap blur  |
| Light rays              | none                                          | on           |
| Splat file              | ≤ 3 MB                                        | ≤ 6 MB       |

- No shadows unless they explain depth, and instancing for repeats (`threejs-performance`).
- Compare the `light` and `full` first frames side by side at the poster's size: a different reflection resolution should not be visible.
- Reduced motion and missing WebGL2 show the poster and the content around it. Nothing essential lives only in the canvas: every message is HTML.
- The poster's `alt` says in one sentence what the scene shows. The canvas is `aria-hidden`, which the stage does.
- Bloom and glints on water or splats never flash more than three times in any second (WCAG 2.3.1).
- `pnpm test:e2e` fails a blank canvas, a frozen ambient canvas and shader errors. Measure frame times on a real GPU with the CPU slowed 4× (`shader-craft` §9) and run the Lighthouse budgets (`pnpm --filter @repo/web lighthouse`). Headless browsers may lack WebGL: check the live scene in a real browser at both tiers.

## Avoid

- 3D as decoration: an object turning on a gradient that explains nothing.
- Calling `advance`, reading `clock.elapsedTime` or `performance.now()`, or setting `dpr` or `frameloop`.
- A `Water`, render target, splat mesh or loader created during render, or `useGLTF.preload` at module level.
- drei defaults that reach third-party CDNs (`Environment` `preset`, Draco or KTX2 decoders), and `ScrollControls`.
- A `light` first frame that differs from the poster (bloom, rays, a visibly softer reflection), and a poster rendered in Blender or taken from another state.
- More than one reflective plane, a 4k HDRI nothing shows, a model past 2 MB.
- Splats from a clip whose object drifts, a camera that leaves the captured orbit, an uncompressed `.ply`, `onReady` before `onLoad`.
- Self-hosted Hunyuan weights and Apple SHARP (ADR-0024); Marble or any second paid provider (ADR-0027).
- Removing safe mode or telemetry settings from the Blender MCP, or a `blender -b` script from outside `assets/3d/source/scripts/`.
- A library or tool outside ADR-0024 and ADR-0027 (physics, another splat renderer, a pose tool): that is a technical decision. Write the ADR with `status: proposed` and stop.

## Reference skills

`shader-craft` (stage contract, clock, tiers, resources, post-processing, poster and tests), `cinematic-footage` (orbit footage and its budget), `gpu-particles` (shapes that transform), `asset-production` (quotes, ledger, provenance, locations), `threejs-react-three-fiber`, `threejs-loaders`, `threejs-asset-pipeline`, `threejs-animation`, `threejs-lighting`, `threejs-textures`, `threejs-performance` (their vanilla renderer set-ups give way to `StageCanvas`), then `gsap-scrolltrigger` and `scroll-storytelling` for the choreography, and `motion-review` with the `design-reviewer` agent for judgement.
