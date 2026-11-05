---
name: gpu-particles
description: Build GPU particle systems that hold a readable shape, morph from shape to shape on scroll and part under the pointer, inside the design system. Shapes are sampled offline with MeshSurfaceSampler into binary Float32Array files, simulated with GPUComputationRenderer (position and velocity, a spring to the shape blended by scroll progress, curl noise, pointer repulsion, damping), drawn as Points that read the position texture, at 32,768 or 131,072 particles per tier from one sample order, tested first, with a poster captured from the first frame. Use when a page needs particles, a logo or object made of points, a morph between shapes, an assembly or a dispersion, a swarm or point cloud, or a scanned object shown as points or splats.
---

# GPU particles

Particles earn their place when the motion explains a transformation: parts that become a product, one thing that becomes another, a whole that disperses into the units it is made of. Particles with nothing to become are decoration, and the glowing particle sphere is on every template. Every system is written for its project with the method below; the boilerplate ships none.

## Workflow

1. Storyboard the beats with `scroll-storytelling`: one shape per beat, the first one readable on its own (§1).
2. Get and clean the shape models, then sample them together (§3).
3. Write the morph test and the shader test first (§10).
4. Build the scene from `references/particle-scene.md` and the effect component from `shader-craft` (§2, §4, §5).
5. Choreograph progress with holds, wire the pointer, decide `ambient` (§6).
6. Capture the poster and one still plate per shape (§9).
7. Measure on a real GPU at both tiers, then run `pnpm test:e2e` (§11).

## 1. When

| The motion explains                                   | Particle story                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A product is assembled from parts                     | The first shape is the exploded view (parts in place, readable); scroll gathers them into the product |
| One thing becomes another (idea to product, A to B)   | Shape A morphs into shape B, then C, one per scroll beat, each held long enough to read           |
| Something is made of many units (data, people, cells) | The shape disperses into a grid or field of its units, then regroups                              |
| A real object must keep its colours                   | Gaussian splats with Spark (§8), not sampled points                                               |

Every story starts on a readable shape: the first frame is the poster and the reduced-motion page, so it is never a scattered cloud. An "assembly" is told from an exploded view or a loose arrangement of the parts, not from noise.

A starfield or ambient dust behind content is a shader (`shader-craft`), at a fraction of the cost. A real place belongs to `cinematic-footage`, an object to inspect to `scene-3d`.

## 2. Where the code lives

The contract of `shader-craft` §2 applies: an effect component `packages/ui/src/motion/<effect>-stage.tsx` composes `Stage` (framing, veil, copy as children), the lazy scene lives in `packages/ui/src/scene/`, apps compose it inside a `ScrollScene` and never style.

| What                       | Where                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Source models              | `assets/3d/source/<shape>.glb`, with provenance (`asset-production`)                                         |
| Sampling script            | `packages/ui/scripts/sample-shapes.ts`, from `references/sample-shapes.md`                                   |
| Sampled shapes             | `apps/web/public/media/<feature>/<shape>-131072.bin` and `<shape>-32768.bin` (its first 32,768 points)       |
| Scene modules              | `<effect>-shaders.ts`, `<effect>-simulation.ts`, `<effect>-pointer.ts`, `<effect>-scene.tsx` in `packages/ui/src/scene/` |
| Shared GLSL                | `packages/ui/src/scene/shader-chunks.ts` (hash and curl noise come from there, `shader-craft` §2)            |
| Tests                      | `packages/ui/tests/<effect>-morph.test.tsx`, written first (§10)                                             |
| URLs passed to the scene   | Built by the app with `process.env.NEXT_PUBLIC_BASE_PATH`: `shapes={{ light: [...], full: [...] }}`          |

Start from `references/particle-scene.md`: the four modules and the morph test, verified against this repo's typecheck, lint and format and run in a browser. The scene is split in four because the lint caps a file at 250 lines and 10 imports, and a function at 60 lines. `GPUComputationRenderer`, `MeshSurfaceSampler` and `GLTFLoader` ship with `three` (`three/addons/...`): nothing to install. The layers, the simulation and the points are made in the effect that disposes them (`useSceneResource`, `shader-craft` §3): created during render, StrictMode's first cleanup would dispose the simulation in development and the particles would restart from the origin.

## 3. Prepare the shapes

Shapes are sampled offline, never in the browser: sampling 131,072 points blocks the main thread far past the long-frame budgets (`motion-review` §2.2), and the browser would download a multi-megabyte model to keep only its surface. The `.bin` file is exactly what the GPU needs.

**Get each shape as a GLB**, in this order:

1. **The client's own material.** A logo or wordmark always comes from the client (`asset-production`: logos are never generated); record it in `assets/provenance.json` as a client file, with its owner and the licence note.
2. **A 2D mark to a mesh** (logo, icon, wordmark): Blender through its MCP (safe mode, ADR-0027): import the SVG, extrude it by about 2 to 5 % of its width so particles land on both faces and the edges, apply the modifiers, export GLB. For batches, the same steps as a versioned script, `blender -b -P assets/3d/source/scripts/<name>.py`. three's `SVGLoader` needs a DOM: it runs in a browser page, never in the Node script.
3. **A Magnific model** (`models3d_text_generate` or `models3d_generate`) through `scene-3d` and the `asset-production` quote and provenance, or a licensed model.

**Choose shapes that morph well**:

- Similar spread: shapes that fill comparable volumes in the shared frame morph as a transformation; a dense ball into a thin line reads as a collapse. If the story needs such a change, give it its own beat and a longer hold.
- Readable at 32,768 points: thin features (a cable, a serif, a finger) need area or `--weight`, or they vanish on phones. Preview the `light` file before committing.
- A silhouette that reads head-on: the camera sees the shape from one side; a shape that only makes sense in profile needs its own camera move.

**Clean the surfaces** before sampling: the sampler spreads points over every triangle, including interior faces, hidden backs and a model's ground slab. Delete what the viewer cannot see in Blender, and keep each shape facing the camera the same way (a logo faces +z, an upright object stands on +y), so morphs do not spin.

**Run the sampling script** (`references/sample-shapes.md`) on the sources of one stage together:

```bash
mkdir -p apps/web/public/media/<feature>
pnpm --filter @repo/ui exec node scripts/sample-shapes.ts --out ../../apps/web/public/media/<feature> \
  --sort height --weight <mesh>=0.2 \
  ../../assets/3d/source/<first-shape>.glb ../../assets/3d/source/<second-shape>.glb ../../assets/3d/source/<third-shape>.glb
```

What it guarantees, and why:

- **One frame for every shape**: centred, longest half-extent 1. Shapes in different units would jump in size mid-morph.
- **One order for every shape**: points sorted by the same key, so particle `i` keeps its rank from shape to shape and a morph flows like a transformation instead of swarming across the volume. `--sort height` by default; `--sort radius` as soon as one shape is flat along the vertical axis (a floor, a logo lying down), where heights tie; `--sort angle` for rings and wheels.
- **Area weighting you control**: the sampler gives each triangle points in proportion to its area, so a floor slab or a backdrop takes most of them. `--weight <mesh>=<factor>` scales a mesh's share (measured: a machine on a large slab went from 4.9 % to 32.7 % of the points with the slab at 0.1).
- **One sample set for both tiers**: 131,072 points stored so that any power-of-two prefix is an even sample of the shape. The `light` file holds the first 32,768 points of the `full` file: the `light` tier draws a subset of the same set, never a different one.
- **Raw little-endian `Float32Array`**, `x y z` per point: 1.5 MiB at 131,072 points, 384 KiB at 32,768.
- **Textures skipped**: Node has no image decoder, so `GLTFLoader` fails on a textured model without the script's `skip-textures` plugin. Only positions are kept; a shape that must keep its colours is a splat (§8).

Budget: shape data stays inside the scroll-footage envelope, 6 MB on `full` and 3 MB on `light`, so at most three shapes per stage (3 × 1.5 MiB). Record each `.bin` in `assets/provenance.json` as derived from its source model (source file, script command). Sampling is random: re-sampling changes the points, so re-capture the poster after it.

## 4. Simulation

`GPUComputationRenderer` holds two ping-pong textures, one texel per particle: `textureVelocity` and `texturePosition` (256×128 on `light`, 512×256 on `full`). The velocity pass sums the forces, the position pass integrates.

- **Start state**: every particle at rest on the first shape, with a seed in `w` hashed from its index. The first frame is the first shape, assembled, on every load.
- **Shapes** are one `DataArrayTexture` (a `sampler2DArray`, one layer per shape, `FloatType`), read at the particle's own texel.
- **Float targets** need `EXT_color_buffer_float`; without it, `setDataType(HalfFloatType)` (positions inside the unit frame keep about 0.001 precision). If `init()` returns an error, throw it from the effect that creates the simulation (`useSceneResource`): it still reaches `SilentBoundary`, which brings the poster back.
- **Never read the textures back** in the page (`readPixels`): it stalls the GPU pipeline every frame. Tests may.

**The morph goal** (`MORPH_GOAL` in the shaders module):

- It reads the page's progress as `uProgress`, the same name as in every scene; the scene copies the page's `{ value }` object into it every frame.
- Between two shapes, each particle leaves on its own, delayed by its seed (`STAGGER`), and the delay is local to that segment.
- So at progress `k / (SHAPES − 1)` (0, 0.5 and 1 for three shapes) every particle sits exactly on shape `k`, and every shape can be held and read.
- A stagger spread over the whole progress range never lets a middle shape form: with three shapes and a stagger of 0.35, particles miss the middle shape by up to 0.4 units at 0.5. The test of §10 holds the rule.
- Particles leave in seed order for a dissolve. Define `SWEEP` for a sweep: `morphGoal` then orders them by their height on the target shape, read from the target layer, and they leave from the bottom up. A morph where every particle leaves at once reads as a cut.

**The forces**, summed in the velocity pass:

| Force       | Uniform                          | Role                                                                                       | Start value |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------------------ | ----------- |
| Spring      | `uStiffness`                     | Pulls each particle to its goal on the blended shape                                       | 14          |
| Curl noise  | `uCurl`                          | Divergence-free swirl (no clumping, no thinning); 0.15 of it at rest, all of it in transit | 1.2         |
| Pointer     | `uPointerStrength`, `uPointer`, `uCamera` | Pushes particles away from the ray between the camera and the pointer             | 30          |
| Damping     | `uDamping`                       | `velocity *= exp(−uDamping · uDelta)`: the same decay at any frame rate                    | 6           |

- **Repel from the view ray**, not from a point: a point on the plane `z = 0` sits inside a volume, far from its surface particles, and nothing visible happens. The ray parts the cloud as the viewer sees it.
- **Integration**: `uDelta` is the frame delta (seconds, within [0, 0.1]: 0 when a paused stage redraws its frame after a resize), so keep the `max(uDelta, 1e-4)` guards wherever it divides. The start values are checked stable at the 0.1 s cap.
- **Tuning**: raise stiffness only with damping, keeping damping between 1.5 and 2 times √stiffness. Below, the shape wobbles; above, it crawls.
- **Cost**: the velocity pass costs 18 noise evaluations per particle; measure on a real GPU before adding octaves or a second field.

## 5. Rendering

`Points` with one vertex per particle. The vertex shader finds its texel from `gl_VertexID` and reads its position with `texelFetch`, so no reference attribute is needed; a `position` attribute of the right length only sets the draw count. `frustumCulled = false`: the real positions live in a texture. The material is built imperatively (`shader-craft` §3).

- **Sprite**: a soft disc, `discard` below 0.01 alpha, `#include <colorspace_fragment>` last.
- **Colour from tokens** (`shader-craft` §6): a calm and a hot token mixed by speed (read the velocity texture in the vertex shader), optionally darkened with depth. Particles in transit glow; settled ones read as matter.
- **Blending follows the scheme**: additive (`depthWrite: false`) on dark grounds, where overlaps build light. On light grounds additive points vanish: use normal blending with an ink token.
- **Size**: CSS pixels × device pixel ratio at one world unit, divided by depth, so near particles are larger.
- **Density**: the `light` tier draws a quarter of the particles at twice the size (√4), so coverage stays the same.
- **Overdraw**: keep points around 1 to 3 CSS pixels on `full`; larger points multiply the fill cost of every overlap.
- **Bloom** only on `full`, on transit glow (`shader-craft` §5), and only if the side-by-side of §9 still holds.

**The look that makes points read as matter**, all decided in the points shaders from tokens and seeds:

- **Depth**: fade colour toward the background token with view depth (`smoothstep(near, far, -viewPosition.z)`), so the far side of a volume recedes instead of piling up into a flat blob.
- **Speed**: mix the calm and hot tokens by speed, and grow travelling points slightly (up to 1.4 times): matter in transit is visible, matter at rest is quiet.
- **Sparkle**: a small subset (about 1 in 64, chosen by seed) drawn a little brighter and larger gives the eye anchors; more than that becomes noise.
- **Copy and particles**: keep the shape out of the copy column (camera offset or the stage's grid), and when copy must overlap, the veil and contrast rule of `shader-craft` §6 apply, checked on both schemes. Behind copy, transit glow stays at about half the opacity of resting signal lights: a dense additive morph crossing a headline flares into a blob (`references/world-states.md`).

**Camera across unlike shapes.** One frame does not mean one silhouette: a wide floor and a tall arm both have a half-extent of 1, but fill the screen differently. Either frame the camera for the widest shape and accept the margins, or move it per beat in the same choreography (a `{ value }` object the scene copies, like progress); the simulation copies the camera position into `uCamera` every frame, so the pointer ray follows. To match the poster on every aspect ratio, cover like `object-fit: cover`: when the canvas is wider than the poster, narrow the vertical field, `fov = 2 · atan(tan(fov₀ / 2) · posterAspect / aspect)`.

## 6. Scroll and pointer

- **Scroll**: the page owns a stable `{ value }` object and tweens it in its `ScrollScene` choreography; the scene copies it into `uProgress` every frame.
- **Beats**: several shapes are beats of one held `ScrollScene`, with one canvas and one trigger.
- **Holds**: tween to each shape's exact progress (`k / (SHAPES − 1)`, `ease.inOut`), then hold there for at least a quarter of the beat so the shape can be read, while the copy of that beat crossfades in the same timeline. A hold is a tween to the value already reached:

```ts
/* Three shapes: hold, morph, hold, morph, hold. Durations are timeline units; the scrub spreads them over the hold. */
function morphThroughShapes(
  timeline: gsap.core.Timeline,
  progress: { value: number },
): void {
  timeline
    .to(progress, { value: 0, duration: 1 })
    .to(progress, { value: 0.5, duration: 1, ease: ease.inOut })
    .to(progress, { value: 0.5, duration: 1 })
    .to(progress, { value: 1, duration: 1, ease: ease.inOut })
    .to(progress, { value: 1, duration: 1 });
}
```

- **One world** when the particles are the page's subject (`motion-design` §4): one stage fixed behind the page, every section a state of the particles, copy scrolling over it (`scroll-storytelling` §4). Every handoff is then a morph of the same points. Separate held sections with their own canvases cannot hand points to each other, so each boundary between them becomes a cut; keep them for subjects that really differ, share shape files between their stages, and keep one signature stage per page (`scroll-storytelling` budget).
- **More states than shapes.** Clouds, bands, a laid-down state and dim states derive in the velocity shader from the sampled shapes and the texel index, with no new file; states that must fill the screen are placed from the camera; points that ride a moving target use an exact follow, not the spring: `references/world-states.md`.
- **One smoothing layer.** The spring already settles the particles. Drive its progress directly from the scroll: give the scene's `ScrollScene` `scrub="direct"` (its default smooths over the `scrub` token) and put no `quickTo` on top (`scroll-storytelling` §4): stacked, they leave the shape behind its copy.
- **Pointer, mouse**: a passive `window` `pointermove` listener projects the pointer onto the plane `z = 0` and smooths it with `gsap.quickTo` (`duration.slow`, `ease.standard`). The force eases to 0 when the pointer leaves the canvas, leaves the document (`pointerleave` on the root element) or the window loses focus (`blur`): none of these sends a `pointermove`.
- **Pointer, touch**: repel only at the contact point, from `pointerdown` until `pointerup` or `pointercancel` (the browser cancels when the gesture becomes a scroll), or not at all. Never react to touch `pointermove` and never call `preventDefault`: on a phone, a finger means scroll.
- **Ambient**: a particle stage whose shape breathes at rest moves without input, so it is `ambient` (`shader-craft` §2): `Stage` gives it its pause control once live, and pausing freezes the simulation with the canvas. A stage that moves only with scroll or pointer is not ambient.
- **Breathing the audit can see**: the motion audit fails an ambient canvas whose mean luminance changes by less than 0.5 between two captures 500 ms apart (on a 32×32 grid). A 1-pixel shimmer can fall under it: if `pnpm test:e2e` reports the stage frozen, raise the curl at rest or add a slow camera drift, rather than dropping `ambient`.
- **Late mounts**: a phone loads the scene after its first interaction, often a scroll, so the scene may start mid-morph. It crossfades from the poster to the current state by design; the spring brings the particles to their goal within a second. The first hold (progress 0 for the first quarter of the beat) keeps the common case, a scene mounted near the top, on the poster's frame.
- **Reduced motion**: the poster and the `ScrollScene` still plates, one per shape, captured at each hold (§9).

## 7. Tiers

| Per tier                    | `light`                                         | `full`                              |
| --------------------------- | ----------------------------------------------- | ----------------------------------- |
| Particles, texture          | 32,768, 256×128                                 | 131,072, 512×256                    |
| Points drawn                | the first 32,768 of the `full` sample order     | all 131,072                         |
| Pixel ratio (`StageCanvas`) | `[1, 1.5]`                                      | `[1, 2]`                            |
| Point size                  | twice the `full` size                           | 1 to 3 CSS pixels                   |
| Shape files                 | `<shape>-32768.bin`, 384 KiB                    | `<shape>-131072.bin`, 1.5 MiB       |
| Forces, stagger, colours    | the same as `full`                              | the same                            |
| Bloom                       | none                                            | optional, on transit glow           |
| Float fallback              | `HalfFloatType` if needed                       | `HalfFloatType` if needed           |

WebGL2 is the engine. WebGPU and TSL are allowed only past one million particles (ADR-0024): the tiers above never need them.

## 8. Splats with Spark

When a scanned object must keep its real colours and lighting (a product photographed, a place, a sculpture), sampled points lose them: render Gaussian splats with Spark (`@sparkjsdev/spark` 2.x, MIT, approved by ADR-0024, installed when used and pinned in the catalog). Train them locally with Brush (Apache-2.0) from a Magnific orbit video of the object. `scene-3d` owns the capture, training and rendering; splats show one object and do not morph like the pipeline above.

## 9. Poster and accessibility

Use the canvas-capture recipe of `shader-craft` §7 (the `capture-stage` script). For particles:

- The first frame is the first shape after one 0.1 s step: deterministic, because the seeds come from indices and the shapes from committed files.
- **Both tiers draw the same shape**: the `light` tier draws a subset of the same points at twice the size, with the same forces and colours, so its first frame matches the `full` poster in shape, framing and tone. Compare them side by side at the poster's size; capture a `light` poster too only if they visibly differ (bloom on `full` is the usual cause: keep it off the first frame or drop it).
- Re-capture after re-sampling, after changing a force, a colour or the camera.
- Capture each shape's hold for the `ScrollScene still` plates, at the scroll offsets given in `shader-craft` §7.
- The poster's `alt` says what the first shape shows, in one sentence; each still plate's `alt` names its shape. The canvas is `aria-hidden` (the stage does it).
- The copy states what the morph shows: a visitor who never sees the canvas loses no message.
- Sparkle and transit glow never strobe: no more than three flashes in any second (WCAG 2.3.1), so sparkle brightness is fixed per particle, not flickered in time.

## 10. Tests first

Write `tests/<effect>-morph.test.tsx` (in `references/particle-scene.md`) before the shaders, in the package's Vitest browser mode:

- **The morph holds every shape**: render `MORPH_GOAL` for every particle into a float target at progress `k / (SHAPES − 1)`, with seeds spanning 0 to 1, for both stagger orders, and assert the farthest particle is within 1e-6 of shape `k` (float rounding; measured 0).
- **The simulation settles**: run `step` with the curl off at a hold position for a few hundred frames and assert every particle ends within 0.001 of the shape.
- **The scene survives StrictMode**: mounted inside `<StrictMode>`, its first frame draws the first shape (pixels lit), not a dot at the origin.
- **The pointer parts the cloud**: a mouse over the centre lowers the lit pixels there, and they come back once it leaves.
- Every new force, stagger key or shape count gets its failing case first. The shader compile and blank-frame checks of `shader-craft` §8 apply to the points material too.
- The effect component's story renders one variant per hold (progress fixed at 0, 0.5, 1): the design review sees every shape, and a bad sample (a slab that swallows the points, a hollow side) shows before the page exists.

## 11. Performance

The global budgets apply (`shader-craft` §9; `motion-review` owns the real-GPU capture). For particles:

- **No CPU simulation beyond 5,000 points.** Looping over particles in JavaScript every frame and re-uploading a buffer costs main-thread time that breaks the long-frame budget. Under 5,000 (sparks, a few hundred floating labels), a `Points` or `InstancedMesh` updated from JavaScript is fine.
- Shapes load in the lazy scene (`useLoader(FileLoader, …)` suspends while the stage keeps its poster), after the stage's own trigger, so a phone that never interacts never downloads them.
- GPU memory on `full`: about 2 MiB per shape layer and 8 MiB for the four simulation targets.
- Download per stage: three shapes weigh 1.1 MiB on `light` and 4.5 MiB on `full`, fetched after the stage's trigger; the scene starts once all have arrived. Share a shape file between stages rather than sampling it twice.
- A paused ambient stage costs nothing: the canvas stops advancing, so no simulation pass runs.
- Measure on both tiers with the CPU slowed 4×: the `light` tier runs on phones, where fill rate, not particle count, is usually the limit; shrink points before cutting particles.

## 12. When it looks wrong

| Symptom                                       | Usual cause                                                  | Fix                                                                |
| --------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| The middle shape never forms                  | Stagger spread over the whole progress                       | Segment-local `MORPH_GOAL`; the morph test of §10                  |
| The morph swarms across the volume            | Shapes sampled with different sort keys, or ties             | One `--sort` for the stage; `radius` when a shape is flat          |
| One part of the shape is a faint haze         | A large mesh takes the points by area                        | `--weight` that mesh down; delete hidden faces                     |
| The shape looks hollow or one-sided           | Points on interior faces, or a flat mark not extruded        | Clean the model; extrude 2D marks before sampling                  |
| The swarm explodes on a slow frame            | Stiffness too high for its damping at the 0.1 s cap          | Damping between 1.5 and 2 × √stiffness                             |
| The pointer does nothing on a volume          | Repelling from a point on `z = 0`, or a stale camera         | View-ray repulsion; camera copied every frame                      |
| Points shimmer or snap on some phones         | Half-float targets far from the unit frame                   | Keep shapes in the shared unit frame                               |
| Black canvas, error in the console            | Float extension missing or `init()` failed                   | Check the fallback; the error must throw so the poster stays       |
| The phone frame differs from the poster       | `Math.random()`, bloom, or a `light` sample from another set | Index seeds; `light` = prefix of `full`; compare side by side (§9) |
| The motion audit says frozen                  | Breathing too faint                                          | More curl at rest, or a slow camera drift                          |
| The shape forms after its copy has arrived    | Smoothing stacked: a scrub or `quickTo` on top of the spring | Drive progress directly; the spring is the one settle              |
| A small glyph smears behind its moving target | The spring trails a moving goal                              | Exact exponential follow for riders (`references/world-states.md`) |
| A state leaves the screen on phones           | Placed in world units                                        | Place it from the camera; sweep by height relative to it           |
| Points vanish on a light scheme               | Additive blending on a light ground                          | Normal blending with an ink token on light grounds                 |
| A phone shows only the poster                 | The `light` tier waits for a first interaction               | By design: the poster is a complete page                           |
| A dot at the origin, only in `pnpm dev`       | The simulation made during render, disposed by StrictMode    | `useSceneResource`; the StrictMode test of §10                     |

## 13. Avoid

- The particle sphere, galaxy or vortex that explains nothing.
- Sampling on the main thread, or shipping the source model to the browser to sample it there.
- CPU simulation beyond 5,000 points; reading GPU textures back in the page.
- A scattered cloud as the first frame: the poster and the reduced-motion page would show noise.
- A stagger spread over the whole progress: middle shapes never form.
- Random pairing between shapes when the morph should read as one thing becoming another; a height sort on flat shapes.
- A ground slab or backdrop left at full weight: it takes the points the story needs.
- A `light` sample that is not a subset of the `full` one: the phone sees another shape than the poster.
- Additive white points on a light scheme; points so large that overdraw dominates the frame.
- `Math.random()` anywhere in the scene: the poster would no longer be the first frame.
- More than three shapes per stage: the download outgrows the budget and the story loses its thread.
- A generated logo: the client supplies it.

## Reference skills

`shader-craft` (stage contract, framing, shared chunks, tokens, post-processing, the poster script, shader tests), `scene-3d` (models, Blender, splats), `asset-production` (quotes, provenance, client files), `scroll-storytelling` (beats), `threejs-geometry` and `threejs-shaders` for the API (their vanilla set-ups give way to `StageCanvas`, see `AGENTS.md`), `motion-review` and the `design-reviewer` agent for judgement.
