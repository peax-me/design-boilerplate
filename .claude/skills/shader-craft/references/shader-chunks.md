# Shader chunks

The one home of the GLSL every scene shares. The first effect of a project that needs any of it creates `packages/ui/src/scene/shader-chunks.ts` from the module below; every later scene imports from it and interpolates the chunks it needs (`${HASH}${GRADIENT_NOISE}${FBM}`, in that order of dependency). A second copy of any of these functions in a scene, a shader module or a reference is a defect: fix it at the source and let every scene inherit the fix.

Checked as written: typecheck, `oxlint --type-aware`, `oxfmt`, and every chunk compiled in WebGL2 inside the effect, particle and footage scenes (Vitest browser mode).

| Chunk                        | Gives                                                  | Needs                       |
| ---------------------------- | ------------------------------------------------------ | --------------------------- |
| `FULL_SCREEN`                | A vertex shader for a 2×2 plane that covers the canvas | nothing                     |
| `HASH`                       | `pcg`, `hash(ivec2)`, `hash(ivec3)`                    | nothing                     |
| `GRADIENT_NOISE`             | `gradientNoise(vec2)`, about −0.7 to 0.7               | `HASH`                      |
| `FBM`                        | `fbm(vec2)`, each octave turned                        | `GRADIENT_NOISE`, `OCTAVES` |
| `CURL_NOISE`                 | `valueNoise(vec3)`, `curlNoise(vec3)`                  | `HASH`                      |
| `COVER_UV`                   | `coverUv(fragCoord, resolution, posterAspect)`         | nothing                     |
| `INTERLEAVED_GRADIENT_NOISE` | `interleavedGradientNoise(vec2 pixel)`, 0 to 1         | nothing                     |

Rules the chunks encode:

- An integer hash, never `fract(sin(…) * 43758.5)`: low-precision `sin` on mobile GPUs turns that hash into stripes.
- Gradient noise peaks near ±0.7, not ±1: remap with `smoothstep` over the range you see, never by assuming [−1, 1].
- `OCTAVES` is a define, identical on every tier: octaves shape the image, so changing them per tier breaks the poster (`SKILL.md` §7).
- `coverUv` is the identity when the canvas and the poster share one aspect, and crops like `object-fit: cover` otherwise.

```ts
/* GLSL shared by every scene of the project, interpolated with ${…} in the order of their needs.
   The algorithms are cited; the code is written for this project. */

/* A plane of size 2 covers the canvas whatever the camera. */
export const FULL_SCREEN = `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* PCG hash (Jarzynski and Olano, "Hash Functions for GPU Rendering", JCGT 2020).
   Integer arithmetic: sin-based hashes break into stripes on low-precision mobile GPUs. */
export const HASH = `
  uint pcg(uint value) {
    uint state = value * 747796405u + 2891336453u;
    uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
  }
  float hash(ivec2 cell) {
    return float(pcg(uint(cell.x) + pcg(uint(cell.y)))) / 4294967295.0;
  }
  float hash(ivec3 cell) {
    return float(pcg(uint(cell.x) + pcg(uint(cell.y) + pcg(uint(cell.z))))) / 4294967295.0;
  }
`;

/* Gradient noise in about -0.7..0.7, smooth to the second derivative (quintic fade). Needs HASH. */
export const GRADIENT_NOISE = `
  vec2 gradientAt(ivec2 cell) {
    float angle = 6.2831853 * hash(cell);
    return vec2(cos(angle), sin(angle));
  }
  float gradientNoise(vec2 p) {
    ivec2 cell = ivec2(floor(p));
    vec2 f = fract(p);
    vec2 fade = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = dot(gradientAt(cell), f);
    float b = dot(gradientAt(cell + ivec2(1, 0)), f - vec2(1.0, 0.0));
    float c = dot(gradientAt(cell + ivec2(0, 1)), f - vec2(0.0, 1.0));
    float d = dot(gradientAt(cell + ivec2(1, 1)), f - vec2(1.0, 1.0));
    return mix(mix(a, b, fade.x), mix(c, d, fade.x), fade.y);
  }
`;

/* Fractal sum of OCTAVES gradient noises (a define), each turned so the lattice never lines up. Needs GRADIENT_NOISE. */
export const FBM = `
  float fbm(vec2 p) {
    const mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
    float sum = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < OCTAVES; octave++) {
      sum += amplitude * gradientNoise(p);
      p = turn * p * 2.03;
      amplitude *= 0.5;
    }
    return sum;
  }
`;

/* Curl of a value-noise potential (Bridson et al., "Curl-Noise for Procedural Fluid Flow", SIGGRAPH 2007):
   a divergence-free flow, so particles swirl without clumping. Needs HASH. */
export const CURL_NOISE = `
  float valueNoise(vec3 p) {
    ivec3 cell = ivec3(floor(p));
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float x00 = mix(hash(cell), hash(cell + ivec3(1, 0, 0)), u.x);
    float x10 = mix(hash(cell + ivec3(0, 1, 0)), hash(cell + ivec3(1, 1, 0)), u.x);
    float x01 = mix(hash(cell + ivec3(0, 0, 1)), hash(cell + ivec3(1, 0, 1)), u.x);
    float x11 = mix(hash(cell + ivec3(0, 1, 1)), hash(cell + ivec3(1, 1, 1)), u.x);
    return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z) * 2.0 - 1.0;
  }
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
`;

/* Maps the canvas the way object-fit: cover maps a poster of that aspect, so one poster matches every box. */
export const COVER_UV = `
  vec2 coverUv(vec2 fragCoord, vec2 resolution, float posterAspect) {
    float canvasAspect = resolution.x / resolution.y;
    vec2 scale = canvasAspect > posterAspect
      ? vec2(1.0, posterAspect / canvasAspect)
      : vec2(canvasAspect / posterAspect, 1.0);
    return (fragCoord / resolution - 0.5) * scale + 0.5;
  }
`;

/* Interleaved gradient noise (Jimenez, "Next Generation Post Processing in Call of Duty: Advanced Warfare", 2014):
   a per-pixel threshold that tiles invisibly, for grain and against banding. */
export const INTERLEAVED_GRADIENT_NOISE = `
  float interleavedGradientNoise(vec2 pixel) {
    return fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
  }
`;
```
