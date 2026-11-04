---
name: gpu-particles
description: Build GPU particle systems that assemble, morph from shape to shape on scroll and part under the pointer, inside the design system. Shapes are sampled offline with MeshSurfaceSampler into binary Float32Array files, simulated with GPUComputationRenderer (position and velocity, a spring to the blended shape, curl noise, pointer repulsion, damping), drawn as Points that read the position texture, at 32,768 or 131,072 particles per tier, with a poster captured from the first frame. Use when a page needs particles, a logo or object made of points, a morph between shapes, an assembly or a dispersion, a swarm or point cloud, or a scanned object shown as points or splats.
---

# GPU particles

Particles earn their place when the motion explains a transformation: parts that assemble into a product, one thing that becomes another, a whole that disperses into the units it is made of. Particles with nothing to become are decoration, and the glowing particle sphere is on every template. Every system is written for its project with the recipes below; the boilerplate ships none.

## 1. When

| The motion explains                                  | Particle story                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| A product is assembled from parts                    | A cloud converges into the object, held long enough to read     |
| One thing becomes another (idea to product, A to B)  | Shape A morphs into shape B, then C, one per scroll beat        |
| Something is made of many units (data, people, cells) | The shape disperses into its units and regroups                 |
| A real object must keep its colours                  | Gaussian splats with Spark (§8), not sampled points             |

A starfield or ambient dust behind content is a shader (`shader-craft`), at a fraction of the cost. A real place belongs to `cinematic-footage`, an object to inspect to `scene-3d`.

## 2. Where the code lives

The contract of `shader-craft` §2 applies: an effect component `packages/ui/src/motion/<effect>-stage.tsx` composes `Stage` and frames the poster; the lazy scene lives in `packages/ui/src/scene/<effect>-scene.tsx`, with `<effect>-simulation.ts` and `<effect>-shaders.ts` beside it, because the lint caps a file at 250 lines and 10 imports; apps compose it inside a `ScrollScene` and never style. Start from `references/particle-scene.md`: the three modules, verified against this repo's typecheck, lint and format, and run in a browser (first frame, morph, pointer, release).

| What                         | Where                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| Source models                | `assets/3d/source/<shape>.glb`, with provenance (`asset-production`)                                  |
| Sampling script              | `packages/ui/scripts/sample-shapes.ts`, from `references/sample-shapes.md`                            |
| Sampled shapes               | `apps/web/public/media/<feature>/<shape>-32768.bin` and `<shape>-131072.bin`                         |
| URLs passed to the scene     | Built by the app with `process.env.NEXT_PUBLIC_BASE_PATH`: `shapes={{ light: [...], full: [...] }}`   |

`GPUComputationRenderer`, `MeshSurfaceSampler` and `GLTFLoader` ship with `three` (`three/addons/...`): nothing to install.

## 3. Prepare the shapes

Shapes are sampled offline, never in the browser: sampling 131,072 points blocks the main thread far past the 100 ms long-frame budget, and the browser would download a multi-megabyte model to keep only its surface. The `.bin` file is exactly what the GPU needs.

1. **Get each shape as a GLB**: the client's model, a Magnific model (`models3d_text_generate` or `models3d_generate`, through `scene-3d` and the `asset-production` quote and provenance), or a mark built in Blender (MCP, safe mode): import the SVG logo, extrude it slightly so it has a surface on both sides, export GLB. Keep sources in `assets/3d/source/`.
2. **Run the sampling script** (`references/sample-shapes.md`) on the sources, not on the optimised GLBs:

```bash
pnpm --filter @repo/ui exec node scripts/sample-shapes.ts --out ../../apps/web/public/media/<feature> \
  ../../assets/3d/source/<first-shape>.glb ../../assets/3d/source/<second-shape>.glb
```

What it guarantees, and why:

- **One frame for every shape**: centred, longest half-extent 1. Shapes in different units would jump in size mid-morph.
- **One order for every shape**: points sorted by height, so particle `i` keeps its rank from shape to shape and a morph flows like a transformation instead of swarming across the volume. Sort by another shared key (angle around the axis, distance to the centre) when the story needs another flow.
- **One file per tier count**, each sampled on its own: 32,768 points (384 KiB) and 131,072 points (1.5 MiB), raw little-endian `Float32Array`, `x y z` per point.
- **Textures skipped**: Node has no image decoder, so `GLTFLoader` fails on a textured model without the script's `skip-textures` plugin. Only positions are kept; a shape that must keep its colours is a splat (§8).

Budget: shape data stays inside the scroll-footage envelope, 6 MB on `full` and 3 MB on `light`, so at most three shapes per stage (3 × 1.5 MiB). Record each `.bin` in `assets/provenance.json` against its source model. Re-sampling changes the points: re-capture the poster.

## 4. Simulation

`GPUComputationRenderer` holds two ping-pong textures, one texel per particle: `textureVelocity` and `texturePosition` (256×128 on `light`, 512×256 on `full`). The velocity pass sums the forces, the position pass integrates.

- **Start state**: every particle at rest on the first shape, with a seed in `w` hashed from its index. The first frame is the assembled first shape on every load: it is the poster and the reduced-motion image, never a scattered cloud.
- **Shapes** are one `DataArrayTexture` (a `sampler2DArray`, one layer per shape, `FloatType`), read at the particle's own texel.
- **Float targets** need `EXT_color_buffer_float`; without it, `setDataType(HalfFloatType)` (positions inside the unit frame keep about 0.001 precision). If `init()` returns an error, throw during render: `SceneBoundary` brings the poster back.
- **Never read the textures back** (`readPixels`): it stalls the GPU pipeline every frame.

The forces, in the velocity shader (`texturePosition`, `textureVelocity` and `resolution` are injected by `GPUComputationRenderer`; `SHAPES` and `STAGGER` are defines):

```glsl
float stage = clamp(uMorph * (1.0 + STAGGER) - current.w * STAGGER, 0.0, 1.0) * float(SHAPES - 1);
float layer = min(floor(stage), float(SHAPES - 2));
float blend = smoothstep(0.0, 1.0, stage - layer);              // each particle eases on its own
vec3 goal = mix(texture(uShapes, vec3(uv, layer)).xyz, texture(uShapes, vec3(uv, layer + 1.0)).xyz, blend);
float transit = 1.0 - abs(blend * 2.0 - 1.0);                  // 1 halfway between two shapes

vec3 force = (goal - current.xyz) * uStiffness;                 // spring to the blended shape
force += curlNoise(current.xyz * 1.4 + vec3(0.0, 0.0, uTime * 0.15)) * uCurl * (0.15 + transit);
vec3 ray = normalize(uPointer - uCamera);                       // repel from the pointer's view ray
vec3 fromEye = current.xyz - uCamera;
vec3 away = fromEye - ray * dot(fromEye, ray);
force += normalize(away + vec3(1e-4)) * uPointerStrength * exp(-dot(away, away) * 12.0);
velocity = (velocity + force * uDelta) * exp(-uDamping * uDelta); // frame-rate independent damping
```

- **Stagger** by the seed (`current.w`) for a dissolve, or by `uv.y` (the particle's height rank, since shapes are sorted) for a sweep from bottom to top. A morph where every particle leaves at once reads as a cut.
- **Curl noise** is divergence-free: particles swirl without clumping or thinning. It is quiet at rest (`0.15`, the shape breathes) and strong in transit (the matter visibly travels).
- **Repel from the view ray**, not from a point: a point on the plane `z = 0` sits inside a volume, far from its surface particles, and nothing visible happens. The ray parts the cloud as the viewer sees it.
- **Integration**: `uDelta` is the frame delta (seconds, within ]0, 0.1]). Starting values, checked stable at the 0.1 s cap: stiffness 14, damping 6, curl 1.2, stagger 0.35. Raise stiffness only with damping, keeping damping between 1.5 and 2 times √stiffness: below, the shape wobbles; above, it crawls.

```glsl
// Curl of a noise potential (Bridson et al., "Curl-Noise for Procedural Fluid Flow", SIGGRAPH 2007).
// valueNoise is 3D value noise over the PCG hash of shader-craft §4, hashed per ivec3 cell.
vec3 potential(vec3 p) {
  return vec3(valueNoise(p), valueNoise(p + vec3(31.4, 17.1, 5.9)), valueNoise(p + vec3(-11.3, 43.7, 23.2)));
}
vec3 curlNoise(vec3 p) {
  const float e = 0.05;
  vec3 px = potential(p + vec3(e, 0.0, 0.0)) - potential(p - vec3(e, 0.0, 0.0));
  vec3 py = potential(p + vec3(0.0, e, 0.0)) - potential(p - vec3(0.0, e, 0.0));
  vec3 pz = potential(p + vec3(0.0, 0.0, e)) - potential(p - vec3(0.0, 0.0, e));
  return vec3(py.z - pz.y, pz.x - px.z, px.y - py.x) / (2.0 * e);
}
```

## 5. Rendering

`Points` with one vertex per particle. The vertex shader finds its texel from `gl_VertexID`, so no reference attribute is needed; a `position` attribute of the right length only sets the draw count. `frustumCulled = false`: the real positions live in a texture.

```glsl
uniform sampler2D uPositions;
uniform float uPointSize;                  // CSS pixels × device pixel ratio, at one world unit
void main() {
  ivec2 texel = ivec2(gl_VertexID % WIDTH, gl_VertexID / WIDTH);
  vec4 viewPosition = modelViewMatrix * vec4(texelFetch(uPositions, texel, 0).xyz, 1.0);
  gl_Position = projectionMatrix * viewPosition;
  gl_PointSize = uPointSize / -viewPosition.z;   // perspective: near particles are larger
}
```

- **Sprite**: a soft disc, `smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5))`, `discard` below 0.01 alpha. End with `#include <colorspace_fragment>`.
- **Colour from tokens** (`shader-craft` §6): a calm and a hot token mixed by speed (velocity texture), optionally darkened with depth. Particles in transit glow; settled ones read as matter.
- **Blending follows the scheme**: additive (`depthWrite: false`) on dark grounds, where overlaps build light. On light grounds additive points vanish: use normal blending with an ink token.
- **Size and density**: the `light` tier draws a quarter of the particles at twice the size (√4), so coverage stays the same. Keep points around 1 to 3 CSS pixels on `full`: larger points multiply overdraw.
- **Bloom** only on `full`, on transit glow (`shader-craft` §5).
- **Camera**: perspective, static or moved by the choreography. To match the poster on every aspect ratio, cover like `object-fit: cover`: when the canvas is wider than the poster, narrow the vertical field, `fov = 2 · atan(tan(fov₀ / 2) · posterAspect / aspect)`.

## 6. Scroll and pointer

- **Scroll**: the page owns a stable `{ value }` object (`useState(() => ({ value: 0 }))`) and tweens it in its `ScrollScene` choreography; the scene copies it into `uMorph` every frame (`shader-craft` §3). Several shapes are beats of one pinned `ScrollScene`, with one canvas and one trigger: tween to each shape (`ease.inOut`), then hold for at least a quarter of the beat so the shape can be read, while the copy of that beat crossfades in the same timeline.
- **Pointer, mouse**: a passive `window` `pointermove` listener projects the pointer onto the plane `z = 0` and smooths it with `gsap.quickTo` (`duration.slow`, `ease.standard`); strength eases to 0 when the pointer leaves the canvas.
- **Pointer, touch**: repel only at the contact point, from `pointerdown` until `pointerup` or `pointercancel` (the browser cancels when the gesture becomes a scroll), or not at all. Never react to touch `pointermove` and never call `preventDefault`: on a phone, a finger means scroll.
- **Idle life**: curl at rest keeps the shape breathing; a slow camera drift is enough. An `ambient` stage that freezes fails the motion audit.
- **Reduced motion**: the poster and the `ScrollScene` still plates, one per shape (captured at each hold, §9).

## 7. Tiers

| Per tier                    | `light`                         | `full`                          |
| --------------------------- | ------------------------------- | ------------------------------- |
| Particles, texture          | 32,768, 256×128                 | 131,072, 512×256                |
| Pixel ratio (`StageCanvas`) | `[1, 1.5]`                      | `[1, 2]`                        |
| Point size                  | twice the `full` size           | 1 to 3 CSS pixels               |
| Shape files                 | `<shape>-32768.bin`, 384 KiB    | `<shape>-131072.bin`, 1.5 MiB   |
| Bloom                       | none                            | optional, on transit glow       |
| Float fallback              | `HalfFloatType` if needed       | `HalfFloatType` if needed       |

WebGL2 is the engine. WebGPU and TSL are allowed only past one million particles (ADR-0024): the tiers above never need them.

## 8. Splats with Spark

When a scanned object must keep its real colours and lighting (a product photographed, a place, a sculpture), sampled points lose them: render Gaussian splats with Spark (`@sparkjsdev/spark` 2.x, MIT, approved by ADR-0024, installed when used and pinned in the catalog). Train them locally with Brush (Apache-2.0) from a Magnific orbit video of the object. `scene-3d` owns the capture, training and rendering; splats show one object and do not morph like the pipeline above.

## 9. Poster

Use the canvas-capture recipe of `shader-craft` §7 (the `capture-stage` script). For particles:

- The first frame is the assembled first shape after one 0.1 s step: deterministic, because the seeds come from indices and the shapes from committed files.
- Re-capture after re-sampling, after changing a force or a colour, after changing the camera.
- Capture each shape's hold for the `ScrollScene still` plates.

## 10. Performance

The global budgets apply (`shader-craft` §8; `motion-review` owns the real-GPU capture). For particles:

- **No CPU simulation beyond 5,000 points.** Looping over particles in JavaScript every frame and re-uploading a buffer costs main-thread time that breaks the long-frame budget. Under 5,000 (sparks, a few hundred floating labels), a `Points` or `InstancedMesh` updated from JavaScript is fine.
- Shapes load in the lazy scene (`useLoader(FileLoader, …)` suspends while the stage keeps its poster), after the stage's own trigger, so a phone that never interacts never downloads them.
- GPU memory on `full`: about 2 MiB per shape layer and 8 MiB for the four simulation targets.
- The velocity pass costs 18 noise evaluations per particle; measure on a real GPU before adding octaves or a second noise field.

## 11. Avoid

- The particle sphere, galaxy or vortex that explains nothing.
- Sampling on the main thread, or shipping the source model to the browser to sample it there.
- CPU simulation beyond 5,000 points; reading GPU textures back.
- A scattered cloud as the first frame: the poster and the reduced-motion page would show noise.
- Random pairing between shapes when the morph should read as one thing becoming another.
- Additive white points on a light scheme; points so large that overdraw dominates the frame.
- `Math.random()` anywhere in the scene: the poster would no longer be the first frame.
- More than three shapes per stage: the download outgrows the budget and the story loses its thread.

## Reference skills

`shader-craft` (noise, tokens, post-processing, the poster script), `scene-3d` (models, Blender, splats), `asset-production` (quotes, provenance), `scroll-storytelling` (beats), `threejs-geometry` and `threejs-shaders` for the API (their vanilla set-ups give way to `StageCanvas`, see `AGENTS.md`), `motion-review` and the `design-reviewer` agent for judgement.
