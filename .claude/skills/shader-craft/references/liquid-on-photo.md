# A liquid flowing on a photographed surface

Water, oil, a glaze, ink or melt running over a still photograph (wood, skin, metal, fabric, a product): the liquid follows the photo's own relief and stays transparent. The recipe is fragments, not a verified module: build it as a scene of `references/effect-skeleton.md`, tests first (§8).

## What reads as liquid, and what does not

- **Reads as liquid**: paths that follow the grooves of the photo, a wet zone wider than the moving film that darkens and saturates the surface, a transparent film that refracts what lies under it, a sheen that moves, small beads that swell and run, glints where a light meets a tilted surface.
- **Reads as plastic or as a graphic**: a procedural line with a glowing head (a "glowing line"), a tinted film with a constant sheen and a strong edge tilt (a tube), a wet zone as narrow as the film (invisible at page scale), any colour the liquid adds rather than takes from the surface.

## 1. Trace the paths from the photo (CPU, once)

Draw the photo to a small canvas (about 256 rows is enough), read its luminance, and walk each path down row by row. At each row the path picks the horizontal step, within a few columns, that minimises a cost: dark grooves and cracks attract it, steps and turns cost.

```ts
/* Weights on a luminance in [0, 1]: a few hundredths each. STEP_COST keeps the path from zigzagging, TURN_COST keeps it smooth,
   WANDER lets each path drift its own way so they do not all fall into the darkest groove. */
const MAX_STEP = 3;

function nextColumn(luminance: Float32Array, width: number, walk: { row: number; column: number; step: number; drift: number }): number {
  let best = { cost: Number.POSITIVE_INFINITY, step: 0 };
  for (let step = -MAX_STEP; step <= MAX_STEP; step += 1) {
    const darkness = luminance[walk.row * width + walk.column + step] ?? 1;
    const cost = darkness + STEP_COST * Math.abs(step) + TURN_COST * Math.abs(step - walk.step) - WANDER * step * walk.drift;
    if (cost < best.cost) {
      best = { cost, step };
    }
  }
  return best.step;
}
```

- Keep each path inside its lane (a band of columns), so paths never merge into one.
- `drift` is a slow noise in [−1, 1] per path and row, seeded by the path's index (deterministic, §3).
- Smooth the columns over a few rows afterwards: a raw walk steps by whole pixels.

## 2. Arrival time per row

Accumulate the time the front needs to reach each row, `length / speed`, with a speed that drops where the path runs sideways and varies a little along it:

```ts
const speed = (BASE + GAIN / (1 + slope * slope)) * (1 - VARIATION + 2 * VARIATION * noise(row));
```

A linear scroll then gives a front with a varying speed: it slows where the path runs sideways, lingers, and hurries down steep grooves, which is what makes it read as poured rather than wiped.

## 3. Pack the paths into a data texture

Per path and row: x, arrival, slope and width, in an RGBA float `DataTexture` (paths × rows, `NearestFilter`). Read it with `texelFetch` and interpolate between rows by hand: linear filtering of float textures is optional on mobile WebGL2 (`OES_texture_float_linear`).

## 4. Shade in one pass

```glsl
float since = uFront - arrival;                                    // time since the front passed this row: wet behind it
float core = 1.0 - smoothstep(0.0, width, abs(uv.x - pathX));
float ragged = fbm(uv * vec2(WIDE, TALL)) * RAGGED;                // stretched across the flow: a wet edge is torn sideways
float wet = smoothstep(0.0, 1.0, core * HALO + SPREAD * sqrt(max(since, 0.0)) - ragged) * step(0.0, since);
vec3 surface = texture(uPhoto, uv).rgb;
vec3 soaked = pow(surface, vec3(WET_GAMMA)) * WET_GAIN;            // wet materials scatter less: darker and richer
vec3 color = mix(surface, soaked, wet);
```

- **Wet zone**: wider than the film and growing with time since the front passed, so the streak stays when the film has moved on. `WET_GAMMA` between 1.5 and 2 and `WET_GAIN` between 0.6 and 0.8 darken without turning black.
- **Normals** from luminance differences of the photo (a bump scale of a few units), so light catches the relief.
- **Film**: transparent. It refracts the surface by its ripple gradient (an offset well under 1 % of the frame) and pulses along the path (a noise of depth minus time), so the flow is visible without any tint.
- **Glints**: a half-vector to a light that moves with the pointer, with two exponents (a broad sheen and a sharp spark), plus the key light. A light far from the view direction never aligns with a flat film (`pow(0.88, 70)` is about 0): tilt the film's normals or place a lamp near the view.
- **Caustics**: low, inside the film only.
- **Beads**: computed on the CPU, each swells for most of its period, then runs a short way down its path with accelerating motion, shrinks and fades. Pass them as `vec4(x, y, radius, run)` uniforms and shade each as a lens: inverted refraction, a dark rim, a highlight.

## 5. Direction and clock

The flow follows the page's travel (`motion-design` §1); gravity is the usual motive. The front's progress is driven like any `uProgress` (§3), linear under the scrub; the pulses, glints and beads advance on `uTime`, which makes the stage `ambient`.

## Check

Crop a settled screenshot at 2× around the paths at two points of the scene, early and late: the wet zone is wider than the film, the film shows the surface through it, and nothing on the path is brighter than the surface's own highlights except the glints.
