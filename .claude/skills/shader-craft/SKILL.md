---
name: shader-craft
description: Write live GLSL shaders and post-processing looks inside the design system, from noise, FBM, domain warp and SDF raymarching to fire, plasma, heat haze, chromatic dispersion, light rays, grain, ASCII, Bayer dithering and halftone, driven by GSAP uniforms, coloured from theme tokens, budgeted per quality tier, tested first, with a poster captured from the first frame. Use when a page needs a surface, light or matter phenomenon (heat, fire, glass, liquid, energy, aurora, smoke), a stylised render look, a shader behind or around content, or when writing or reviewing any GLSL, ShaderMaterial or post-processing effect.
---

# Shader craft

A live shader earns its place when the page sells something felt rather than inspected: heat, energy, matter, light, precision. It is the page's signature moment (`scroll-storytelling` budget). It runs live on every device that can, and its poster carries the page everywhere else. Each effect is written for its project from the recipes below: the boilerplate ships no effect, and nothing is pasted from a shader gallery.

## 1. When

| The motion explains                                       | Technique                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Matter or energy in a surface: heat, fire, plasma, aurora | Noise fields, domain warp, a token colour ramp                                                    |
| Something seen through a medium: heat haze, water, glass  | Refraction of a texture by a noise gradient                                                       |
| A liquid flowing on a photographed surface                | Paths traced from the photo, a transparent film over a wet zone (`references/liquid-on-photo.md`) |
| An object made of light or glass: orb, lens, crystal      | SDF raymarching, refraction, dispersion                                                           |
| A light source, a reveal                                  | Light rays (radial blur), restrained bloom                                                        |
| A data or AI atmosphere, an editorial or print look       | ASCII, Bayer dither, halftone, grain                                                              |

Shapes that transform belong to `gpu-particles`, real places to `cinematic-footage`, objects to inspect to `scene-3d`. If a still or a short loop tells the same story, use it.

An orb, a lens or a crystal earns its row when it explains something, such as a lens that focuses the product or a crystal that splits its light. A decorative glowing orb in the hero is the cliché that `motion-review` §3 scores 1.

## 2. Where the code lives

| File                                            | Holds                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `packages/ui/src/motion/<effect>-stage.tsx`     | The effect component: composes `Stage`, sizes and frames the poster, layers copy over a veil |
| `packages/ui/src/scene/<effect>-scene.tsx`      | The lazy scene: `StageCanvas`, the mesh, the GLSL as template strings, `useFirstFrame`       |
| `packages/ui/src/scene/shader-chunks.ts`        | The GLSL every scene shares: hash, noise, FBM, curl, `coverUv`, the full-screen vertex       |
| `packages/ui/src/scene/use-scene-resource.ts`   | Creates a scene's resources in the effect that disposes them (§3), shared by every scene     |
| `packages/ui/src/scene/use-smoothed-pointer.ts` | The mouse over the canvas, smoothed on the GSAP ticker, shared by every scene                |
| `packages/ui/tests/<effect>-*.test.tsx`         | The shader, StrictMode and layering tests, written first (§8)                                |
| `apps/web/src/features/<feature>/…`             | Composition only: `ScrollScene`, the poster import, the copy, the choreography               |

Rules, each for a reason:

- Apps never touch a canvas, a class or a style: the effect is a `@repo/ui` component with a story, a `data-slot`, a row in `packages/ui/AGENTS.md` (no Code Connect template: a canvas host has no Figma component, `packages/ui/AGENTS.md`), built through `design-system` with its tests first.
- The GLSL lives in the scene file, next to the uniforms it reads: one file to read when the look changes, and the shader ships in the lazy chunk, never in the page bundle. When the file nears the 250-line lint limit, its strings move to `<effect>-shaders.ts` beside it.
- **Plan the split from the start** for any scene with CPU-side motion: the lint caps a file at 250 lines and 10 imports and a function at 3 parameters. `<effect>-shaders.ts` (GLSL and material), `<effect>.ts` (a non-React factory, `advance`, disposal), `<effect>-motion.ts` (per-frame CPU motion: paths, beads, a follow), `<effect>-scene.tsx` (hooks and JSX only). Factories take `(input, input, look)`, with every tunable in one look object.
- Shared GLSL lives once, in `shader-chunks.ts`, created by the first effect of a project that needs it from `references/shader-chunks.md`; every scene interpolates from it (`${HASH}${GRADIENT_NOISE}${FBM}`). A second copy is a defect.
- Effect components and scene primitives are covered by ADR-0024: no project ADR. A library is installed only when used, pinned in the catalog: add the version under `catalog:` in `pnpm-workspace.yaml`, then `pnpm add --filter @repo/ui <package>@catalog:`. Allowed majors: `@react-three/postprocessing` 3 with `postprocessing` 6, `@react-three/drei` 10 (helpers imported one by one).
- Copy over an effect is passed as `children`: the effect component owns the layering (stage, ground bands, veil, copy), so contrast is designed once, not per page. Section seams are those ground bands in the markup, driven by the page's choreography, never drawn by the shader (`scroll-storytelling` §4): the next stage may still show its poster when it arrives. Keep the pause control above every overlay with an on-scale `z-*`, or a band dims it. `Stage` and its scene layer are positioned, so the veil and the copy must be positioned too (`relative`) or the canvas paints over them; the veil ignores the pointer and the copy box hugs its content, so the stage's pause control in the bottom-end corner stays reachable. Keep the copy out of that corner.
- Start from `references/effect-skeleton.md`: the stage component, the scene, the shader test and the page wiring, verified against this repo's typecheck, lint and format and run in a browser.

`Stage` already loads the scene after idle near the viewport (`full`) or after the first interaction (`light`), probes WebGL2 just before mount, and falls back to the poster under reduced motion, without WebGL2, on a lost context or a failing scene.

**Framing.** The poster and the canvas must crop alike, or the crossfade jumps. Two modes, both in the skeleton's `fit` variant:

- `cover`: a full-bleed stage sized by its class (`h-svh`, like the `ScrollScene` stage that holds it; never `dvh`, which a phone toolbar changes mid-scroll and which would resize the canvas). `Stage` sizes its poster layer with it, the poster image covers it (`object-fit: cover`), and the shader maps the canvas with `coverUv` and the poster's aspect, so both crop the same way on every screen.
- `poster`: an unsized stage takes its poster's height; canvas and poster share one box and aspect, and `coverUv` is the identity.

The app passes `posterAspect` from the poster's static import (`poster.width / poster.height`).

**Known pitfall: AVIF sizes under Turbopack.** `next dev` with Turbopack has reported a static AVIF import as 100×100, which turns `posterAspect` into 1 and crops the canvas unlike the poster. Check `poster.width` once in the dev server and in the build you ship; while it is wrong, export the aspect of the capture as a named constant beside the poster (the capture viewport's width over its height, §7 step 4) and pass that.

**Measuring.** `StageCanvas` measures its size only, never its position (`resize={{ scroll: false }}`). React Three Fiber's default re-measures on every scroll event behind a 50 ms debounce: during a continuous scroll the debounce never settles, a stage that mounts mid-scroll never gets a size, and it stays on its poster. Never pass a `resize` option back to a stage canvas.

**Ambient.** A stage is `ambient` when it moves without input: idle drift, breathing, a loop. Once live, `Stage` gives an ambient stage its own pause and play control (WCAG 2.2.2), named by `pauseLabel` and `playLabel` (English by default: pass the page language's words). Pausing stops the canvas advancing: `uTime` stops, the frame holds, and a resize redraws it. A stage that moves only while the visitor scrolls or points is not ambient. Set `ambient` honestly: the motion audit also fails an ambient stage whose frames do not change.

## 3. Uniforms and the clock

- **`uTime`** accumulates the frame `delta`, which `StageCanvas` hands out in seconds, within [0, 0.1]: 0 when a paused stage redraws its frame after a resize, so a shader that divides by it keeps a `max(uDelta, 1e-4)` guard. Never `state.clock.elapsedTime` or `performance.now()`: the accumulator pauses offscreen and while paused without jumping on return, and since the first delta is always 0.1, the first frame draws at `uTime = 0.1` on every load, the frame the poster shows.
- **`uProgress`** is the one name for scroll progress in every scene. It is copied every frame from a stable `{ value }` object that the page creates (`useState(() => ({ value: 0 }))`) and its `ScrollScene` choreography tweens (`timeline.to(progress, { value: 1, ease: "none" }, 0)`). The material does not exist when the timeline is built and the scene may never load, so the timeline never targets a uniform. `ScrollScene` already scrubs (`scrub` token); in the shader, stage phases with overlapping `smoothstep(a, b, uProgress)` windows rather than one linear ramp: overlaps read as one gesture.
- **Late mounts.** A scene can mount mid-scroll (a phone loads it after the first interaction, which is often a scroll). It then crossfades from the poster to the current progress: that is by design, and the scrubbed timeline brings it in smoothly. Start every phase after a dead zone (`smoothstep(0.1, …)`), so the first tenth of the scroll still draws the poster's frame.
- **`uPointer`** is a `Vector2` in canvas space (−1 to 1), smoothed by `gsap.quickTo` (same ticker, `duration.slow`, `ease.standard`) from a passive `window` `pointermove` listener (`use-smoothed-pointer.ts`): copy laid over the canvas would swallow canvas events. A finger means scroll, so only `"mouse"` pointers steer. Kill the tweens on unmount.
- **Resources live in the effect that disposes them**: `useSceneResource(create, dispose, ...inputs)` returns `null` until the effect has created the resource, then the scene renders a child that draws with it and calls `useFirstFrame`. In development, StrictMode mounts, cleans up and mounts again, inside the canvas too: a material, loader, video or simulation made during render and disposed in a cleanup would stay disposed while in use (an aborted loader never loads, a disposed simulation restarts from the origin, a closed video stays black).
- **Build the `ShaderMaterial` imperatively** with its uniforms object and pass it as `material`: React Three Fiber copies a `uniforms` prop into new objects, so later writes to yours would never reach the GPU. **Write from a module-level function** (`advance(uniforms, frame)`): the React Compiler lint rejects writing to hook values inside `useFrame`. GLSL strings are plain template literals: a `/* glsl */` tag trips `no-inline-comments`.
- **Idle life**: with no pointer, the scene still breathes (slow drift in `uTime`, a lazy virtual pointer orbit). Idle life makes the stage ambient (§2).
- **Loop bounds** (`MAX_STEPS`, sample counts) are `defines`, never uniforms: loops need constant bounds on mobile compilers, and the driver unrolls them. Only the cost knobs of §9 change per tier.
- **Determinism**: no `Math.random()` anywhere in a scene. Seeds come from coordinates or indices, so the first frame is identical on every load, and the poster stays true.

## 4. Recipes

Write GLSL ES 3.00 (three compiles `ShaderMaterial` as `#version 300 es` and maps `gl_FragColor`). End every fragment shader with `#include <colorspace_fragment>`, so token colours match the page. Avoid built-in names (`step`, `distance`, `length`) and the words GLSL ES 3.00 reserves (`half`, `input`, `output`, `filter`, `sample`, `common`) as variable names: the compile fails.

**Direction.** A shader's motion (a light's path, a flow, a drift) follows the travel of `## Motion language` (`motion-design` §1). Flipping it must leave the first frame unchanged; re-check the poster when it does not.

**Foundations** come from `shader-chunks.ts` (`references/shader-chunks.md`): the PCG integer hash (a `sin`-based hash breaks into stripes on low-precision mobile GPUs), gradient noise (peaks near ±0.7: remap with `smoothstep`, never assume ±1), FBM with each octave turned so the lattice never lines up, curl noise, `coverUv` and interleaved gradient noise. The recipes below call them.

**Precision.** WebGL2 guarantees `highp` floats in fragment shaders: noise inputs stay exact to 0.001 up to about 10,000. Keep coordinates and time-driven offsets under that: at the haze's 0.6 units per second it is more than four hours of ambient time. A scene meant to run for days wraps its phase with a period the noise repeats on.

**Domain warp**: feed the field its own output. Colour by the warp vectors as well as the final value: that is where the silk and smoke come from. `WARP_LEVELS` is part of the look, the same on every tier.

```glsl
float warped(vec2 p, float time, out vec2 flow) {
  flow = vec2(fbm(p + vec2(0.0, time * 0.05)), fbm(p + vec2(4.1, -2.7) - time * 0.04));
#if WARP_LEVELS > 1
  flow = vec2(fbm(p + 3.2 * flow + vec2(-1.9, 6.3)), fbm(p + 3.2 * flow + vec2(7.4, 1.2)));
#endif
  return fbm(p + 3.2 * flow);
}
```

**SDF raymarching** with a step budget per tier (48 `light`, 96 `full`) and a relative epsilon, so far surfaces stop early at pixel precision.

```glsl
float sceneDistance(vec3 p);               // spheres, boxes, smooth unions, noise displacement
float march(vec3 origin, vec3 direction) {
  float travelled = 0.0;
  for (int iteration = 0; iteration < MAX_STEPS; iteration++) {
    float gap = sceneDistance(origin + direction * travelled);
    if (gap < 0.0008 * travelled) return travelled;
    travelled += gap * 0.9;                // under-step: displaced SDFs are not exact
    if (travelled > MAX_DISTANCE) break;
  }
  return -1.0;
}
vec3 normalAt(vec3 p) {                    // tetrahedral differences: four samples, not six
  const vec2 k = vec2(1.0, -1.0);
  const float h = 0.0005;
  return normalize(k.xyy * sceneDistance(p + k.xyy * h) + k.yyx * sceneDistance(p + k.yyx * h)
                 + k.yxy * sceneDistance(p + k.yxy * h) + k.xxx * sceneDistance(p + k.xxx * h));
}
float smoothUnion(float a, float b, float k) {  // polynomial smooth minimum
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
```

Light it like a product shot: one key light, a rim from `pow(1.0 - max(dot(normal, -direction), 0.0), 4.0)` (Fresnel), a wrap term `max(dot(normal, light) * 0.5 + 0.5, 0.0)` for soft shadows, and a glow from the closest `gap` along misses. A miss returns the background, never black.

**Fire**: noise advected along the flow, curled by one warp step, cut by a falloff, coloured through a ramp. A burning rim: `flow = normalize(p)`, `fromSource = length(p) - radius`. A flame: `flow = vec2(0.0, 1.0)`, `fromSource = p.y * 0.45 + p.x * p.x * 2.5`.

```glsl
float flame(vec2 p, vec2 flow, float fromSource, float time) {
  vec2 q = p * 2.5 - flow * time * 0.9;
  float licks = fbm(q + 0.8 * vec2(fbm(q * 0.7 + time * 0.1), fbm(q * 0.7 - time * 0.1 + 5.2)));
  licks += 0.5 * fbm(p * 6.0 - flow * time * 2.0);                 // fast fine tongues
  return smoothstep(0.0, 0.8, licks * 1.2 + 0.45 - fromSource * 1.3);
}
// colour = ramp(pow(heat, 1.4)) * heat; only the core exceeds 1, so bloom touches the core alone
```

**Plasma**: four sine fields, a look of its own: smooth interfering bands, chosen for the design, never as a cheaper FBM on the light tier.

```glsl
float plasma(vec2 p, float time) {
  float field = sin(p.x * 3.0 + time) + sin(p.y * 2.3 - time * 0.7)
              + sin((p.x + p.y) * 2.1 + time * 0.5) + sin(length(p) * 4.0 - time * 1.3);
  return field * 0.125 + 0.5;
}
```

**Refraction and heat haze**: offset the lookup of a texture (a product screenshot from `asset-production`, the scene rendered to a target) by the gradient of a noise field. The texture arrives as a URL prop from the app (static import `.src`).

```glsl
float shimmer(vec2 p) {                     // two octaves: full FBM tears edges instead of bending them
  return gradientNoise(p) + 0.5 * gradientNoise(p * 2.1 + 3.7);
}
vec2 haze(vec2 p, float time) {
  p = p * vec2(1.0, 0.45) - vec2(0.0, time * 0.6);              // stretched columns, rising
  const float e = 0.02;
  float centre = shimmer(p);
  return vec2(shimmer(p + vec2(e, 0.0)) - centre, shimmer(p + vec2(0.0, e)) - centre) / e;
}
// colour = texture(uBackdrop, uv + haze(p * 3.0, uTime) * 0.006 * mask).rgb; mask fades the haze out
```

**Chromatic dispersion**: refract each wavelength a little more than the last. Six samples look like glass; three look like a cheap RGB split.

```glsl
vec3 disperse(sampler2D source, vec2 uv, vec2 offset) {
  vec3 sum = vec3(0.0);
  vec3 weights = vec3(0.0);
  for (int i = 0; i < DISPERSION_SAMPLES; i++) {
    float t = float(i) / float(DISPERSION_SAMPLES - 1);           // red end to blue end
    vec3 weight = vec3(1.0 - t, 1.0 - abs(t * 2.0 - 1.0), t);
    sum += texture(source, uv - offset * (0.9 + 0.2 * t)).rgb * weight;
    weights += weight;
  }
  return sum / weights;
}
```

**Light rays**: a radial blur toward the light, on bright pixels only, jittered per pixel so 24 samples look like 100. As a post effect it is a convolution (§5). Pick the sample count once, for both tiers: fewer samples change the grain of the rays, and so the image.

```glsl
vec3 rays(sampler2D source, vec2 uv, vec2 light, float decay) {
  vec2 stride = (light - uv) / float(RAY_SAMPLES) * 0.9;
  vec2 cursor = uv + stride * interleavedGradientNoise(gl_FragCoord.xy);
  vec3 sum = vec3(0.0);
  float weight = 1.0;
  for (int i = 0; i < RAY_SAMPLES; i++) {
    sum += max(texture(source, cursor).rgb - 0.8, 0.0) * weight;  // threshold: only the source streaks
    weight *= decay;
    cursor += stride;
  }
  return sum / float(RAY_SAMPLES);
}
```

**Grain and dither**: grain is what makes a gradient look shot rather than rendered, and it kills banding. Both use `interleavedGradientNoise` from the chunks.

```glsl
vec3 grain(vec3 color, vec2 pixel, float frame, float amount) {
  float noise = interleavedGradientNoise(pixel + 5.588238 * mod(frame, 64.0)) - 0.5;
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return color + noise * amount * (1.0 - 0.6 * luma);   // film grain lives in shadows and mids
}
// After #include <colorspace_fragment>: gl_FragColor.rgb += (interleavedGradientNoise(gl_FragCoord.xy) - 0.5) / 255.0;
```

Grain amount 0.03 to 0.06, a new pattern every frame (`frame` counted in the scene, never derived from `uTime`, whose fractions repeat).

**One grade, applied last by every scene.** When a page has several stages, one `FILM_GRADE` chunk in `shader-chunks.ts` holds the shadow tint, the contrast curve, the vignette and the grain, and every scene calls it last, before the colour-space include. Separate amounts per scene show side by side, a finer grain or a lifted black next to a deeper one (`motion-design` §6).

```glsl
vec3 filmGrade(vec3 color, vec2 uv, vec2 pixel, float frame) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color *= mix(uShadowTint, vec3(1.0), luma);                      // tint the shadows only, from a token
  color = mix(color, color * color * (3.0 - 2.0 * color), uContrast); // a smoothstep S-curve, 0.1 to 0.2
  color *= 1.0 - uVignette * dot(uv - 0.5, uv - 0.5) * 2.0;        // 0.3 to 0.4 at the corners
  return grain(color, pixel, frame, uGrain);
}
```

**Quiet zone**: calm the field behind the copy. The mask lives in canvas space (`gl_FragCoord`), because the copy moves with the canvas box, while the matter lives in poster space (`coverUv`).

```glsl
float quiet(vec2 fragCoord) {               // 1 behind the copy column, 0 elsewhere; the copy sits on the left here
  float x = fragCoord.x / uResolution.x;
  return uQuiet * (1.0 - smoothstep(uQuietEdge - 0.12, uQuietEdge, x));
}
// intensity *= 1.0 - 0.8 * quiet(gl_FragCoord.xy);
```

## 5. Post-processing

Install `@react-three/postprocessing` and `postprocessing` (catalog, §2) only for a look that needs the rendered image: bloom, ASCII, dither, halftone, rays, aberration. A look that a single shader can produce stays in that shader: one pass is cheaper than two.

- `<EffectComposer multisampling={0}>` around the effects: full-screen shaders have no geometry edges, and MSAA on the composer buffers costs memory for nothing. Use 4 only when real geometry edges show.
- Consecutive effects merge into one pass. A pass holds at most one convolution effect (one that samples other pixels: ASCII, halftone, rays, blur), and UV-transforming effects (`mainUv`) cannot share a pass with one.
- Bloom: `luminanceThreshold` near 1 so only HDR cores (values above 1, `toneMapped: false`) glow, `intensity` under 1. `full`: `mipmapBlur`. `light`: no mipmap bloom, `mipmapBlur={false}` at `resolutionScale={0.5}`, or no bloom.
- `light`: expensive passes (raymarching, rays) render into a `WebGLRenderTarget` at half the drawing-buffer size and are drawn back with linear filtering.

Custom looks are `Effect` subclasses (postprocessing 6 signature: `void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)`; `inputBuffer`, `resolution`, `texelSize` and `time` are provided). Create the instance once (`useState(() => new AsciiEffect(…))`), render it with `<primitive object={effect} />` inside the composer, write its uniforms from `useFrame` through a module-level function (§3), dispose it on unmount. Effect shaders take the shared chunks too (§4).

```ts
export class AsciiEffect extends Effect {
  constructor(glyphs: Texture, glyphCount: number) {
    super("AsciiEffect", asciiShader, {
      /* It samples the cell centre, not its own pixel. */
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([["uGlyphs", new Uniform(glyphs)], ["uGlyphCount", new Uniform(glyphCount)],
        ["uCellSize", new Uniform(12)], ["uInk", new Uniform(new Color())], ["uPaper", new Uniform(new Color())]]),
    });
  }
}
```

**ASCII.** The glyph atlas is drawn at runtime in the page's own font, so the look follows the brand and a token swap:

1. Read the family from the host (`getComputedStyle(host).getPropertyValue("--font-mono")`, or `--font-display` for a display look) and await `document.fonts.load` for that family at the drawing size: drawing before the font loads bakes the fallback font into the texture.
2. Draw 10 to 16 candidate glyphs white on transparent, one cell each, in a single-row canvas.
3. Measure each glyph's ink (sum of alpha via `getImageData`) and sort the row from least to most ink: any font gives a correct ramp, no hand-typed ramp string.
4. `CanvasTexture`, `generateMipmaps = false`, `minFilter = LinearFilter`.

```glsl
uniform sampler2D uGlyphs;
uniform float uGlyphCount;
uniform float uCellSize;                    // device pixels per character
uniform vec3 uInk;
uniform vec3 uPaper;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 cells = resolution / uCellSize;
  vec2 cell = floor(uv * cells);
  float luma = pow(dot(texture(inputBuffer, (cell + 0.5) / cells).rgb, vec3(0.2126, 0.7152, 0.0722)), 1.0 / 2.2);
  float glyph = min(floor(luma * uGlyphCount), uGlyphCount - 1.0);
  vec2 inCell = fract(uv * cells);
  float ink = texture(uGlyphs, vec2((glyph + inCell.x) / uGlyphCount, inCell.y)).a;
  outputColor = vec4(mix(uPaper, uInk, ink), inputColor.a);
}
```

**Bayer dither**, mergeable (it reads only its own pixel). Quantise in display space: linear luminance dithers into crushed shadows.

```glsl
const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
uniform float uDotSize;                     // device pixels per dither dot: 1 to 3
uniform float uLevels;                      // 2 for one-bit, 4 for a retro ramp
uniform vec3 uShadow;
uniform vec3 uLight;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  ivec2 cell = ivec2(mod(floor(gl_FragCoord.xy / uDotSize), 4.0));
  float threshold = (BAYER[cell.y * 4 + cell.x] + 0.5) / 16.0;
  float luma = pow(dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722)), 1.0 / 2.2);
  float level = floor(luma * (uLevels - 1.0) + threshold) / (uLevels - 1.0);
  outputColor = vec4(mix(uShadow, uLight, level), inputColor.a);
}
```

**Halftone**, a convolution: rotate the grid, sample the cell centre, grow the dot with darkness, antialias with `fwidth`.

```glsl
uniform float uCellSize;
uniform float uAngle;                        // 0.26 rad (15°) avoids a mechanical grid
uniform vec3 uInk;
uniform vec3 uPaper;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  mat2 turn = mat2(cos(uAngle), sin(uAngle), -sin(uAngle), cos(uAngle));
  vec2 grid = turn * (uv * resolution) / uCellSize;
  vec2 centre = floor(grid) + 0.5;
  vec2 centreUv = transpose(turn) * (centre * uCellSize) / resolution;
  float luma = pow(dot(texture(inputBuffer, centreUv).rgb, vec3(0.2126, 0.7152, 0.0722)), 1.0 / 2.2);
  float radius = sqrt(1.0 - luma) * 0.7071;  // touches the corners at black
  float offset = length(grid - centre);
  float edge = fwidth(offset);
  outputColor = vec4(mix(uPaper, uInk, 1.0 - smoothstep(radius - edge, radius + edge, offset)), inputColor.a);
}
```


## 6. Colour and contrast

- **Colours come from theme tokens, resolved at runtime on the stage host**, never hex literals in GLSL: resolve each CSS custom property on an element inside the stage, so scheme islands (`Section scheme="dark"`) and preset swaps apply, and read them again when the tokens change (preset swap, scheme change). `lib/css-color.ts` and `scene/scene-tokens.ts` already resolve and refresh a fixed set of colours; when a scene needs a kind of colour they do not read, extend the token reader through `design-system` (token names in, `Color`s out, same refresh), tests first. Write the new values into the colour uniforms through a module-level function, tweened with a token duration rather than cut.
- **Ramps** go from three to five tokens, dark to hot. When two stops differ in hue, build a small ramp texture on the CPU from `color-mix(in oklab, var(--a) p%, var(--b))` resolved through the same probe: the browser mixes perceptually, while a linear-RGB `mix` in the shader goes grey between hues.
- **Exposure**: token colours must render as the token. Flat looks use `<StageCanvas flat>` (no tone mapping). HDR looks (bloom, fire cores) keep tone mapping and are judged against the poster.
- **Contrast is guaranteed by construction, on both sides.** Copy on the effect sits on the effect component's veil, a gradient of the background token, opaque enough that the text passes WCAG (4.5:1, 3:1 for large text) against the worst pixel the effect can draw under it: the brightest pixel for light text (dark scheme), the darkest for dark text (light scheme and `scheme-light` islands). Composite luminance is `alpha · veil + (1 − alpha) · pixel` in linear light; solve for `alpha`. The `uQuiet` mask (§4) lowers the extremes under the copy and so the veil it needs.
- **Check it on the real frames.** Axe cannot read text over a canvas. `pnpm test:e2e` attaches one screenshot per scroll step and viewport to the motion audit (`frame-<progress>` in the Playwright report): find the brightest and the darkest frame under the copy box, in both schemes, and measure the ratio there.
- **Content never lives only in the canvas.** The poster carries the accessible name; every message is HTML.

## 7. Poster: capture the first frame

The poster is the LCP image and the whole page under reduced motion or without WebGL2. It must be the scene's first frame, or the crossfade pops. This is the one canvas-capture recipe: `gpu-particles` and `scene-3d` use it, `cinematic-footage` takes the poster of a frame sequence from its first frame, and `asset-production` §7 gives every video poster its location.

1. Make the scene deterministic (§3): first frame at `uTime = 0.1`, pointer at rest, progress at its start, no `Math.random()`.
2. **One poster for both tiers.** Tier knobs change only cost: pixel ratio, raymarch steps, half-resolution passes, a particle count drawn from the same sampled set. Never image-shaping parameters (octaves, warp levels, dispersion and ray samples, palette, point layout): those would make the `light` first frame differ from a poster captured at `full`. If a difference is unavoidable (half-resolution bloom on `light` is the usual one), compare the two first frames side by side; if they differ visibly, capture a `light` poster too and serve it from the effect component by the same media conditions as the tier (narrow viewport or coarse pointer).
3. Install the capture script once per project from `references/capture-stage.md` (`apps/web/scripts/capture-stage.ts`, a package script so knip counts it, `scripts` in the `tsconfig` include). It fakes the page clock and steps one frame at a time until the stage turns live, so the canvas holds exactly its first frame, then screenshots the canvas alone. Run it against the local production server, never an external URL.
4. Capture at twice the CSS pixels (the script's `deviceScaleFactor: 2`). In `cover` mode the viewport is the poster: its aspect is the `posterAspect` every other screen is cropped from, so pick the composition's reference (for example 1440×900) and keep the subject inside the area every target aspect keeps. In `poster` mode, capture at the stage's largest rendered width. Keep the PNG master in `assets/source/<feature>/<slot>/poster.png`.
5. Encode: `avifenc --speed 4 --qcolor 60 --yuv 420 assets/source/<feature>/<slot>/poster.png apps/web/src/features/<feature>/images/<slot>-poster.avif` (`--yuv 444` for flat graphic looks, where 4:2:0 smears colour edges; a transparent canvas keeps its alpha). The static export serves images unoptimised, so the file itself must be AVIF.
6. Import it statically and pass `<Image src={poster} alt="…" sizes="…" loading="eager" fetchPriority="high" />` (`fill` in `cover` mode) as `poster`, and `posterAspect={poster.width / poster.height}`.
7. Still plates for `ScrollScene still` come from the same script at each beat's scroll position (`--scroll <px> --advance 1000` lets the scrub settle in fake time, still deterministic). A `ScrollScene` holds its stage from its top for `sceneLength[length]` window heights (`short` 1, `medium` 2, `long` 3), so the timeline position `t` (0 to 1) sits at `--scroll` = the scene's top offset + `t × sceneLength × viewport height`.
8. Re-capture after every change to the look: a stale poster is a visible pop on every load.

## 8. Tests first

The shader gets its test before its code (`references/effect-skeleton.md`, `tests/<effect>-scene.test.tsx`), in the package's Vitest browser mode:

- Build the material with the scene's exported factory (`createEffect`), set `renderer.debug.onShaderError` to throw, render one frame per tier: a compile or link error fails the test instead of a silent blank canvas (three only logs it otherwise).
- Read the pixels back and assert the luminance spread is above 2, the motion audit's blank threshold (ADR-0026): a shader that compiles but draws one flat colour fails too.
- Mount the scene inside `<StrictMode>` and assert that a uniform written after the double mount still changes the pixels: it catches a resource disposed by the first cleanup.
- Mount the effect component live and assert, with `document.elementFromPoint`, that the copy and the veil paint above the canvas and that the pause control is still the element under its own centre.
- Logic outside GLSL (placement, token mapping, loaders) gets plain unit tests. The story renders the effect component for the design review; the e2e motion audit covers the live page.

## 9. Performance

Budgets are global: Lighthouse ≥ 0.95 on mobile and desktop for every route, and on a real GPU with the CPU slowed 4×, a 95th-percentile frame ≤ 20 ms, no long animation frame over 300 ms until the first window's stages are live (the first stage mount right after page load included) and none over 100 ms after, every stage load during scroll included (ADR-0026). The `motion-review` skill owns the capture procedure. `pnpm test:e2e` fails on a blank canvas, a frozen ambient canvas, and any `THREE.WebGLProgram` or shader error in the console. A shader that fails to compile does not throw in the page: three logs the error and draws nothing, which is why the test of §8 throws instead.

| Cost knob, per tier                                       | `light`                                      | `full`          |
| --------------------------------------------------------- | -------------------------------------------- | --------------- |
| Pixel ratio (`StageCanvas`)                               | `[1, 1.5]`                                   | `[1, 2]`        |
| Raymarch steps (`MAX_STEPS`)                              | 48                                           | 96              |
| Bloom                                                     | none, or no mipmap blur at half resolution   | mipmap blur     |
| Expensive passes                                          | half-resolution target                       | full resolution |
| Full-screen shaders per viewport                          | one                                          | one             |
| Octaves, warp levels, dispersion and ray samples, palette | the same on both tiers: they shape the image | the same        |

Cost scales with pixels × work per pixel: at `full`, a 1440×900 stage is 5.2 million pixels per pass. When `light` is too slow, lower the cost knobs, then simplify the look for both tiers; never fork the look per tier. `StageCanvas` compiles the scene's programs with `gl.compileAsync(scene, camera)` before its first frame, and `Stage` loads three.js, the React renderer and the scene module (`prepareScene`) before it mounts the scene: effect authors call neither. When the trace still shows a long first frame, look at what the scene builds on mount (geometry, textures, token reads) and cut loop sizes.

## 10. Licences

Write recipes from first principles, as above, or port from permissive sources with an attribution comment at the top of the shader: source URL at a commit, licence, copyright, and what you changed (Apache-2.0 requires the change note).

- Allowed: three.js examples (MIT: `examples/jsm/shaders`, `GPUComputationRenderer`, the post-processing examples), `paper-design/shaders` (Apache-2.0: dithering, halftone, god rays, grain gradient, fluted glass, liquid metal, warp, water), postprocessing (Zlib), papers and talks (cite them, write the code yourself).
- Never: LYGIA (Prosperity licence, non-commercial); Shadertoy code unless the shader's header carries an explicit MIT, Apache-2.0, BSD, Zlib or CC0 licence (the site default, CC BY-NC-SA, forbids commercial use); snippets without a licence.

## 11. Avoid

- The generic gradient blob or glowing hero orb: it says nothing about the product and every template has one. Tie the phenomenon to the message.
- More than one full-screen shader per viewport: two fight for attention and double the cost.
- Text on an effect without a contrast veil, a veil checked on one scheme only, or copy inside the canvas.
- Tier knobs that change the image (octaves, warp levels, palette): the `light` first frame stops matching the poster.
- A second copy of a shared GLSL function: it drifts from the first.
- A resource created during render and disposed in an effect cleanup: StrictMode leaves it disposed in development.
- Copy or a veil left unpositioned after the stage: the canvas paints over them.
- Banding in dark gradients: dither the output (§4) and keep composer buffers in half float.
- Precision loss: `sin`-based hashes, noise inputs past 10,000.
- Overdraw: stacked transparent full-screen planes, a post pass per effect instead of merged effects.
- Over-bright bloom: a low threshold turns the whole frame to haze. Bloom the core, not the scene.
- Texture memory: atlases and backdrops at most twice the rendered width, no mipmaps on full-screen textures.
- First-frame pop: a poster that is not the first frame, `Math.random()` seeds, a scene that starts mid-animation, a poster cropped differently from the canvas.
- Hard cuts in uniforms: every uniform change goes through the scrub, `quickTo` or a token easing, and only one of them (`scroll-storytelling` §4, "One smoothing layer").
- A section seam drawn in the shader: it is missing while the stage shows its poster.
- A liquid drawn as a glowing line or a tinted tube: trace it from the photo and keep it transparent (`references/liquid-on-photo.md`).

## Reference skills

`threejs-shaders` and `threejs-postprocessing` for the API (their vanilla renderers, `EffectComposer` set-ups and WebGPU sections give way to `StageCanvas`, `@react-three/postprocessing` and WebGL2, see `AGENTS.md`), `scroll-storytelling` for the choreography, `design-system` for the component, `asset-production` for textures, `motion-review` and the `design-reviewer` agent for judgement.
