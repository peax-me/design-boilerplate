# World states: derived shapes, camera-relative states and riders

Techniques for a particle world that carries a whole page (`SKILL.md` §6, "One world"): more states than sampled shapes, states that fill every screen, points that follow a moving target, and light that stays readable behind copy. Fragments for the velocity and points shaders of `particle-scene.md`; each new state or force gets its failing case in the morph test first (§10).

## States derived in the shader, without a new shape file

A state is a goal position per particle. The velocity pass can compute it from what it already has (the sampled shapes and the texel's index), so a new state costs no download:

- **A scattered cloud** from index hashes. Sum two hashes per axis (a triangular distribution) and centre it, so the cloud has a dense core and soft edges; a uniform spread over the whole view reads as sensor noise and almost vanishes. Light it lower than the shapes (around 80 to 90 %), so it reads as a state between shapes rather than a shape.
- **Bands** from a shape's own coordinates: `band = floor((x + 1) / 2 · BANDS)` splits it into parallel strips. Scale each band down around its own centre to open gaps, and keep the gaps at least 1.5 times the spacing inside a band: narrower, they do not read, and a beat that says the bands join shows nothing.
- **A laid-down state** (a ground, a horizon, a table) by un-tilting, scaling and re-tilting a shape: `rotateX(rotateX(shape, −tilt) · flatten, tiltLow)`. It keeps the world present under reading sections without competing with the copy.
- **A dim state**: the same shape at low light (10 to 20 %), so a change from dim to lit is itself the mechanism a beat names. No DOM counter or map is needed.

## Camera-relative states

A state that must fill the screen on every aspect is placed from the camera, not in world units:

```glsl
float extent = (uCamera.z - depth) * tan(uFov * 0.5);   // half the view's height at that depth ("half" is reserved in GLSL ES 3.00)
vec3 goal = vec3(uCamera.xy + local * vec2(extent * uAspect, extent), depth);
```

- Order a sweep across such a state by height relative to the camera, not by world height: on a tall phone screen every point would otherwise leave at once.
- Check a 390×844 screenshot at every hold: camera-relative states stay in view, and the copy sits under the shape on phones.

## Riders: points that follow a moving target

A spring trails a target moving at speed v by about `v · damping / stiffness`. That lag is wider than a small glyph moving across the screen, so the glyph smears behind its target. Points that ride a target (a marker on a path, a label, a small vehicle) use an exponential follow instead: stable at any frame delta, never overshooting, and lagging a fraction of the spring's distance.

```glsl
vec3 follow = (goal - current) * (1.0 - exp(-uFollow * uDelta)) / max(uDelta, 1e-4);
velocity = mix(sprung, follow, step(0.5, ride));
```

- **Hand-over at holds only**: riding switches on only where both ends of a morph ride (`min(start.ride, end.ride)`), so it never pulls points across the screen mid-morph. When a rider drops, the spring takes over with its last velocity: a small, physical landing.
- **Flags without a texture**: pack draw flags into the velocity's spare `w` (`w = light + 2 · riding`) and decode them in the points shader (`rider = step(1.5, w)`). The compute pass runs before the first draw, so `w` is never read at 0.

## Light behind copy

- **Transit glow at about half the opacity of resting signal lights**: `alpha = mix(BASE, 1.0, max(heat * 0.5, max(signal, rider))) * light`. Tens of thousands of additive points crossing a centred headline during a morph otherwise flare into one bright blob under the copy.
- **One smoothing layer**: in a world driven directly by the scroll, the spring is the settle (`scroll-storytelling` §4). Stiffness and damping then set how far the shape trails the copy: check it on the lag probe of `motion-review` §2.3.
