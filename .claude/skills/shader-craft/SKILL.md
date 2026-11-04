---
name: shader-craft
description: Write live GLSL shaders and post-processing looks inside the design system, from noise, FBM, domain warp and SDF raymarching to fire, plasma, heat haze, chromatic dispersion, light rays, grain, ASCII, Bayer dithering and halftone, driven by GSAP uniforms, coloured from theme tokens, budgeted per quality tier, with a poster captured from the first frame. Use when a page needs a surface, light or matter phenomenon (heat, fire, glass, liquid, energy, aurora, smoke), a stylised render look, a shader behind or around content, or when writing or reviewing any GLSL, ShaderMaterial or post-processing effect.
---

# Shader craft

A live shader earns its place when the page sells something felt rather than inspected: heat, energy, matter, light, precision. It is the page's signature moment (`scroll-storytelling` budget). It runs live on every device that can, and its poster carries the page everywhere else. Each effect is written for its project from the recipes below: the boilerplate ships no effect, and nothing is pasted from a shader gallery.

## 1. When

| The motion explains                                            | Technique                                        |
| -------------------------------------------------------------- | ------------------------------------------------ |
| Matter or energy in a surface: heat, fire, plasma, aurora      | Noise fields, domain warp, a token colour ramp   |
| Something seen through a medium: heat haze, water, glass       | Refraction of a texture by a noise gradient      |
| An object made of light or glass: orb, lens, crystal           | SDF raymarching, refraction, dispersion          |
| A light source, a reveal                                       | Light rays (radial blur), restrained bloom       |
| A data or AI atmosphere, an editorial or print look            | ASCII, Bayer dither, halftone, grain             |

Shapes that transform belong to `gpu-particles`, real places to `cinematic-footage`, objects to inspect to `scene-3d`. If a still or a short loop tells the same story, use it.

## 2. Where the code lives

| File                                         | Holds                                                                                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `packages/ui/src/motion/<effect>-stage.tsx`  | The effect component: composes `Stage`, frames the poster, layers copy over a contrast veil    |
| `packages/ui/src/scene/<effect>-scene.tsx`   | The lazy scene: `StageCanvas`, the mesh, the GLSL as template strings, `useFirstFrame`         |
| `apps/web/src/features/<feature>/…`          | Composition only: `ScrollScene`, the poster import, the copy, the choreography                 |

Rules, each for a reason:

- Apps never touch a canvas, a class or a style: the effect is a `@repo/ui` component with a story, a `data-slot`, a row in `packages/ui/AGENTS.md`, built through `design-system` with its tests first.
- The GLSL lives in the scene file, next to the uniforms it reads: one file to read when the look changes, and the shader ships in the lazy chunk, never in the page bundle. When the file nears the 250-line lint limit, its strings move to `<effect>-shaders.ts` beside it; a GLSL function two scenes need lives in one shared module, never copied.
- Effect components and scene primitives are covered by ADR-0024: no project ADR. A library is installed only when used, pinned in the catalog: add the version under `catalog:` in `pnpm-workspace.yaml`, then `pnpm add --filter @repo/ui <package>@catalog:`. Allowed majors: `@react-three/postprocessing` 3 with `postprocessing` 6, `@react-three/drei` 10 (helpers imported one by one).
- Copy over an effect is passed as `children`: the effect component owns the layering (stage, veil, copy), so contrast is designed once, not per page.
- Start from `references/effect-skeleton.md`: the stage component, the scene and the page wiring, verified against this repo's typecheck, lint and format.

`Stage` already loads the scene after idle near the viewport (`full`) or after the first interaction (`light`), probes WebGL2 just before mount, and falls back to the poster under reduced motion, without WebGL2, on a lost context or a failing scene. Set `ambient` when the scene moves on its own: the motion audit then fails it if it freezes.

## 3. Uniforms and the clock

- **`uTime`** accumulates the frame `delta`, which `StageCanvas` hands out in seconds, within ]0, 0.1]. Never `state.clock.elapsedTime` or `performance.now()`: the accumulator pauses offscreen without jumping on return, and since the first delta is always 0.1, the first frame draws at `uTime = 0.1` on every load, the frame the poster shows.
- **`uProgress`** is copied every frame from a stable `{ value }` object that the page creates (`useState(() => ({ value: 0 }))`) and its `ScrollScene` choreography tweens (`timeline.to(progress, { value: 1, ease: "none" }, 0)`). The material does not exist when the timeline is built and the scene may never load, so the timeline never targets a uniform. `ScrollScene` already scrubs (`scrub` token); in the shader, stage phases with overlapping `smoothstep(a, b, uProgress)` windows rather than one linear ramp: overlaps read as one gesture.
- **`uPointer`** is a `Vector2` in canvas space (−1 to 1), smoothed by `gsap.quickTo` (same ticker, `duration.slow`, `ease.standard`) from a passive `window` `pointermove` listener: copy laid over the canvas would swallow canvas events. A finger means scroll, so only `"mouse"` pointers steer. Kill the tweens on unmount.
- **Build the `ShaderMaterial` imperatively** with its uniforms object and pass it as `material`: React Three Fiber copies a `uniforms` prop into new objects, so later writes to yours would never reach the GPU. **Write from a module-level function** (`advance(uniforms, frame)`): the React Compiler lint rejects writing to hook values inside `useFrame`. GLSL strings are plain template literals: a `/* glsl */` tag trips `no-inline-comments`.
- **Idle life**: with no pointer, the scene still breathes (slow drift in `uTime`, a lazy virtual pointer orbit). A frozen ambient stage fails the motion audit and reads as broken.
- **Tier constants** (`MAX_STEPS`, `OCTAVES`, sample counts) are `defines`, never uniforms: loops need constant bounds on mobile compilers, and the driver unrolls them.
- **Determinism**: no `Math.random()` anywhere in a scene. Seeds come from coordinates or indices, so the first frame is identical on every load, and the poster stays true.

## 4. Recipes

Write GLSL ES 3.00 (three compiles `ShaderMaterial` as `#version 300 es` and maps `gl_FragColor`). End every fragment shader with `#include <colorspace_fragment>`, so token colours match the page. Avoid built-in names (`step`, `distance`, `length`) as variable names.

**Hash, gradient noise, FBM.** An integer hash, because the classic `fract(sin(…) * 43758.5)` breaks on mobile GPUs with low-precision `sin` and turns into visible stripes.

```glsl
// PCG hash (Jarzynski and Olano, "Hash Functions for GPU Rendering", JCGT 2020).
uint pcg(uint value) {
  uint state = value * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}
float hash(ivec2 cell) {
  return float(pcg(uint(cell.x) + pcg(uint(cell.y)))) / 4294967295.0;
}
vec2 gradientAt(ivec2 cell) {
  float angle = 6.2831853 * hash(cell);
  return vec2(cos(angle), sin(angle));
}
float gradientNoise(vec2 p) {            // about -0.7..0.7, smooth to the second derivative
  ivec2 cell = ivec2(floor(p));
  vec2 f = fract(p);
  vec2 fade = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(gradientAt(cell), f);
  float b = dot(gradientAt(cell + ivec2(1, 0)), f - vec2(1.0, 0.0));
  float c = dot(gradientAt(cell + ivec2(0, 1)), f - vec2(0.0, 1.0));
  float d = dot(gradientAt(cell + ivec2(1, 1)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, fade.x), mix(c, d, fade.x), fade.y);
}
float fbm(vec2 p) {
  const mat2 turn = mat2(0.8, 0.6, -0.6, 0.8); // rotating each octave hides the lattice
  float sum = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < OCTAVES; octave++) {
    sum += amplitude * gradientNoise(p);
    p = turn * p * 2.03;
    amplitude *= 0.5;
  }
  return sum;
}
```

**Domain warp**: feed the field its own output. Colour by the warp vectors as well as the final value: that is where the silk and smoke come from.

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

**Plasma**: four sine fields, a light-tier stand-in for FBM.

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

**Light rays**: a radial blur toward the light, on bright pixels only, jittered per pixel so 24 samples look like 100. As a post effect it is a convolution (§5).

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

**Grain and dither**: grain is what makes a gradient look shot rather than rendered, and it kills banding.

```glsl
// Interleaved gradient noise (Jimenez, "Next Generation Post Processing in Call of Duty: AW", 2014).
float interleavedGradientNoise(vec2 pixel) {
  return fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
}
vec3 grain(vec3 color, vec2 pixel, float frame, float amount) {
  float noise = interleavedGradientNoise(pixel + 5.588238 * mod(frame, 64.0)) - 0.5;
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return color + noise * amount * (1.0 - 0.6 * luma);   // film grain lives in shadows and mids
}
// After #include <colorspace_fragment>: gl_FragColor.rgb += (interleavedGradientNoise(gl_FragCoord.xy) - 0.5) / 255.0;
```

Grain amount 0.03 to 0.06, a new pattern every frame (`frame` counted in the scene, never derived from `uTime`, whose fractions repeat).

**Poster-true framing.** Compute coordinates the way `object-fit: cover` maps the poster, so one poster matches the first frame on every aspect ratio:

```glsl
vec2 coverUv(vec2 fragCoord, vec2 resolution, float posterAspect) {
  float canvasAspect = resolution.x / resolution.y;
  vec2 scale = canvasAspect > posterAspect
    ? vec2(1.0, posterAspect / canvasAspect)
    : vec2(canvasAspect / posterAspect, 1.0);
  return (fragCoord / resolution - 0.5) * scale + 0.5;   // then p = (uv - 0.5) * vec2(posterAspect, 1.0)
}
```

## 5. Post-processing

Install `@react-three/postprocessing` and `postprocessing` (catalog, §2) only for a look that needs the rendered image: bloom, ASCII, dither, halftone, rays, aberration. A look that a single shader can produce stays in that shader: one pass is cheaper than two.

- `<EffectComposer multisampling={0}>` around the effects: full-screen shaders have no geometry edges, and MSAA on the composer buffers costs memory for nothing. Use 4 only when real geometry edges show.
- Consecutive effects merge into one pass. A pass holds at most one convolution effect (one that samples other pixels: ASCII, halftone, rays, blur), and UV-transforming effects (`mainUv`) cannot share a pass with one.
- Bloom: `luminanceThreshold` near 1 so only HDR cores (values above 1, `toneMapped: false`) glow, `intensity` under 1. `full`: `mipmapBlur`. `light`: no mipmap bloom, `mipmapBlur={false}` at `resolutionScale={0.5}`, or no bloom.
- `light`: expensive passes (raymarching, rays) render into a `WebGLRenderTarget` at half the drawing-buffer size and are drawn back with linear filtering.

Custom looks are `Effect` subclasses (postprocessing 6 signature: `void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)`; `inputBuffer`, `resolution`, `texelSize` and `time` are provided). Create the instance once (`useState(() => new AsciiEffect(…))`), render it with `<primitive object={effect} />` inside the composer, write its uniforms from `useFrame` through a module-level function (§3), dispose it on unmount.

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

- **Colours come from theme tokens, resolved at runtime on the stage host**, never hex literals in GLSL. `lib/css-color.ts` (`resolveMaterial`) and `scene/scene-tokens.ts` (`useTokens`) resolve CSS custom properties on an element inside the stage, so scheme islands (`Section scheme="dark"`) and preset swaps (`TokenTray`) apply, and they re-read on token change. They read the block materials today; when a scene needs other tokens, generalise them through `design-system` (a list of token names in, `Color`s out, same refresh), tests first. Copy new values into the uniforms when the hook returns them.
- **Ramps** go from three to five tokens, dark to hot. When two stops differ in hue, build a small ramp texture on the CPU from `color-mix(in oklab, var(--a) p%, var(--b))` resolved through the same probe: the browser mixes perceptually, while a linear-RGB `mix` in the shader goes grey between hues.
- **Exposure**: token colours must render as the token. Flat looks use `<StageCanvas flat>` (no tone mapping). HDR looks (bloom, fire cores) keep tone mapping and are judged against the poster.
- **Contrast is guaranteed by construction.** Copy on the effect sits on a veil from the effect component: a gradient of the background token, opaque enough that the text passes WCAG (4.5:1, 3:1 for large text) against the brightest pixel the effect ever draws under it. Keep hot spots out of the copy column (a `uQuiet` mask that calms the field where the text sits). Axe cannot measure text over a canvas, so check the brightest frame of the motion-audit contact sheet yourself.
- **Content never lives only in the canvas.** The poster carries the accessible name; every message is HTML.
- **Ambient motion that runs longer than five seconds beside content needs a pause control** (WCAG 2.2.2, level A; neither axe nor Lighthouse checks it). `Stage` has none yet: the first ambient effect of a project adds one to `Stage` through `design-system`, for every stage at once, rather than one per effect. Scroll-driven motion stops when the visitor stops, so it needs none.

## 7. Poster: capture the first frame

The poster is the LCP image and the whole page under reduced motion or without WebGL2. It must be the scene's first frame, or the crossfade pops. This is the one canvas-capture recipe: `gpu-particles` and `scene-3d` use it, `cinematic-footage` owns video posters.

1. Make the scene deterministic (§3): first frame at `uTime = 0.1`, pointer at rest, progress at its start, no `Math.random()`.
2. Install the capture script once per project from `references/capture-stage.md` (`apps/web/scripts/capture-stage.ts`, a package script so knip counts it, `scripts` in the `tsconfig` include). It fakes the page clock and steps one frame at a time until the stage turns live, so the canvas holds exactly its first frame, then screenshots the canvas alone. Run it against the local production server, never an external URL.
3. Capture at the stage's largest rendered size, at twice its CSS pixels (the script's `deviceScaleFactor: 2`), with the viewport of the composition the poster must match. Keep the PNG master in `assets/source/<feature>/<slot>/poster.png`.
4. Encode: `avifenc --speed 4 --qcolor 60 --yuv 420 assets/source/<feature>/<slot>/poster.png apps/web/src/features/<feature>/images/<slot>-poster.avif` (`--yuv 444` for flat graphic looks, where 4:2:0 smears colour edges; a transparent canvas keeps its alpha). The static export serves images unoptimised, so the file itself must be AVIF.
5. Import it statically in the feature and pass `<Image src={poster} alt="…" sizes="…" loading="eager" fetchPriority="high" />` as `poster`. The effect component frames it exactly like the canvas: same box, `object-fit: cover`, and `coverUv` (§4) in the shader so every aspect ratio matches.
6. Still plates for `ScrollScene still` come from the same script at each beat's scroll position (`--scroll <px> --advance 1000` lets the scrub settle in fake time, still deterministic).
7. Re-capture after every change to the look: a stale poster is a visible pop on every load.

## 8. Performance

Budgets are global: Lighthouse ≥ 0.95 on mobile and desktop for every route, and on a real GPU with the CPU slowed 4×, a 95th-percentile frame ≤ 20 ms and no long animation frame over 100 ms during scroll. The `motion-review` skill owns the capture procedure; run it after each look change. `pnpm test:e2e` fails on a blank canvas, a frozen ambient canvas, and any `THREE.WebGLProgram` or shader error in the console. A shader that fails to compile does not throw: three logs the error and draws nothing, so read the console after every edit.

| Per tier                         | `light`                                   | `full`                       |
| -------------------------------- | ----------------------------------------- | ---------------------------- |
| Pixel ratio (`StageCanvas`)      | `[1, 1.5]`                                | `[1, 2]`                     |
| Raymarch steps (`MAX_STEPS`)     | 48                                        | 96                           |
| FBM octaves, warp levels (start) | 4, one level                              | 6, two levels                |
| Dispersion, ray samples (start)  | 3, 16                                     | 6, 32                        |
| Bloom                            | none, or no mipmap blur at half resolution | mipmap blur                  |
| Expensive passes                 | half-resolution target                    | full resolution              |
| Full-screen shaders per viewport | one                                       | one                          |

Cost scales with pixels × work per pixel: at `full`, a 1440×900 stage is 5.2 million pixels per pass. When the trace shows a long first frame, the culprit is usually shader compilation: precompile with `gl.compileAsync(scene, camera)` before the first render and cut loop sizes.

## 9. Licences

Write recipes from first principles, as above, or port from permissive sources with an attribution comment at the top of the shader: source URL at a commit, licence, copyright, and what you changed (Apache-2.0 requires the change note).

- Allowed: three.js examples (MIT: `examples/jsm/shaders`, `GPUComputationRenderer`, the post-processing examples), `paper-design/shaders` (Apache-2.0: dithering, halftone, god rays, grain gradient, fluted glass, liquid metal, warp, water), postprocessing (Zlib), papers and talks (cite them, write the code yourself).
- Never: LYGIA (Prosperity licence, non-commercial); Shadertoy code unless the shader's header carries an explicit MIT, Apache-2.0, BSD, Zlib or CC0 licence (the site default, CC BY-NC-SA, forbids commercial use); snippets without a licence.

## 10. Avoid

- The generic gradient blob or glowing hero orb: it says nothing about the product and every template has one. Tie the phenomenon to the message.
- More than one full-screen shader per viewport: two fight for attention and double the cost.
- Text on an effect without a contrast veil, or copy inside the canvas.
- Banding in dark gradients: dither the output (§4) and keep composer buffers in half float.
- Precision loss on mobile: `sin`-based hashes, huge noise coordinates (keep `p` in −100..100, scale time down before adding it), `mediump` sampling of large textures.
- Overdraw: stacked transparent full-screen planes, a post pass per effect instead of merged effects.
- Over-bright bloom: a low threshold turns the whole frame to haze. Bloom the core, not the scene.
- Texture memory: atlases and backdrops at most twice the rendered width, no mipmaps on full-screen textures.
- First-frame pop: a poster that is not the first frame, `Math.random()` seeds, a scene that starts mid-animation.
- Hard cuts in uniforms: every uniform change goes through the scrub, `quickTo` or a token easing.

## Reference skills

`threejs-shaders` and `threejs-postprocessing` for the API (their vanilla renderers, `EffectComposer` set-ups and WebGPU sections give way to `StageCanvas`, `@react-three/postprocessing` and WebGL2, see `AGENTS.md`), `scroll-storytelling` for the choreography, `design-system` for the component, `asset-production` for textures, `motion-review` and the `design-reviewer` agent for judgement.
