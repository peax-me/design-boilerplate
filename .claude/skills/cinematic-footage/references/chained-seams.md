# Chained seams and a paced film

How a stage plays chained shots (`SKILL.md` §2) as one film: concatenated, paced by the scroll, its seams blended over a few held frames, keyed by light, with a push through the cut and motion blur from the film's speed. It replaces `place` and `DISSOLVE_FRAGMENT` of `footage-scene.md` when the shots are chained; the frame store, loading and tests of that file stay. `placeFilm` and `pace` were checked numerically (seam windows continuous, pace monotone); the GLSL is fragments to fold into the scene's shader, tests first (`shader-craft` §8).

## 1. One film, no overlap

Concatenate the shots end to end in film time: shot B's first frame follows shot A's last, with no frame played twice and no stretch where both play. `starts[k]` is the index of shot k's first frame in the film; the playhead is `time = progress × (frames − 1)`, with `progress` the paced value of §2.

Drop the first frame of a chained take when the model returned the start keyframe verbatim (`SKILL.md` §2): it duplicates shot A's last frame.

## 2. Pace the film with the scroll

The choreography eases the film through (scroll, film) points with a monotone cubic: flat where copy is read, steep where the camera travels. Give holds a small slope rather than zero, so the camera drifts instead of freezing.

```ts
/* Monotone cubic through (scroll, film) points (PCHIP: Fritsch–Butland tangents): speed changes smoothly through each point
   and the film never runs backwards between points. x strictly increasing from 0 to 1, y non-decreasing from 0 to 1. */
export function pace(points: [number, number][]): (scroll: number) => number {
  const slopes = points.slice(1).map(([x, y], index) => (y - points[index][1]) / (x - points[index][0]));
  const tangents = points.map((_, index) => {
    const before = slopes[index - 1] ?? slopes[0];
    const after = slopes[index] ?? before;
    if (index === 0 || index === points.length - 1) {
      return index === 0 ? after : before;
    }
    if (before * after <= 0) {
      return 0;
    }
    const widthBefore = points[index][0] - points[index - 1][0];
    const widthAfter = points[index + 1][0] - points[index][0];
    return (3 * (widthBefore + widthAfter)) / ((2 * widthAfter + widthBefore) / before + (widthAfter + 2 * widthBefore) / after);
  });
  return (scroll) => {
    const x = Math.min(Math.max(scroll, 0), 1);
    const segment = Math.max(points.findIndex(([end]) => x <= end) - 1, 0);
    const [x0, y0] = points[segment];
    const [x1, y1] = points[segment + 1];
    const width = x1 - x0;
    const t = (x - x0) / width;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * width * tangents[segment] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * width * tangents[segment + 1];
  };
}

/* In the page's choreography: the film follows the scroll through the paced curve. */
timeline.to(progress, { value: 1, ease: pace(FILM_PACE), duration: 1 }, 0);
```

- **Seams in steep parts.** Every seam falls where the camera travels fastest: a seam at rest is seen, one in motion is not (`motion-design` §3).
- **Copy only in flat parts.** Copy enters after a travel ends and is fully out before the next one starts.
- **Why not an equal share per shot.** With the seam where each shot's share ends, chained seams land at the shots' designed rest frames, inside a reading hold: the seam is seen, and copy sits over a changing picture.
- **Check.** For each seam, its film fraction is `starts[k] / (frames − 1)`. Find the scroll fraction where `pace` reaches it (bisection: the curve is monotone) and confirm it lies between two steep points and outside every copy window.

## 3. Blend a few held frames at a seam

Around each seam, a window of a few frames on each side (`CUT_HALF`, 2 to 4): the outgoing shot plays to its last frame then holds it, the incoming shot holds its first frame then plays, and the mix runs from 0 to 1 across the window.

```ts
/* Frames on each side of a seam: the two pictures blended are never more than this far apart in film time. */
const CUT_HALF = 3;

export function placeFilm(time: number, starts: number[]): { frame: number; next: number; mix: number } {
  const shot = starts.findIndex((start, index) => index > 0 && Math.abs(time - (start - 0.5)) < CUT_HALF);
  const start = starts[shot];
  if (shot === -1 || start === undefined) {
    return { frame: Math.round(time), next: Math.round(time), mix: 0 };
  }
  return {
    frame: Math.min(Math.round(time), start - 1),
    next: Math.max(Math.round(time), start),
    mix: (time - (start - 0.5) + CUT_HALF) / (2 * CUT_HALF),
  };
}
```

```glsl
float scaleA = 1.0 + PUSH * uMix;                                    // the held outgoing frame keeps moving forward: 3 to 6 %
vec2 uvA = (uv - uFocus) / scaleA + uFocus;
vec3 outgoing = texture(uShotA, uvA).rgb;
vec3 incoming = texture(uShotB, uv).rgb;
float lumaA = dot(outgoing, vec3(0.2126, 0.7152, 0.0722));
float key = uKey < 0.0 ? 1.0 - lumaA : lumaA;                        // dark first into a dark opening, light first out into brightness
float reveal = smoothstep(0.0, 0.22, key * 0.6 + uMix * 1.4 - 0.7 + fbm(uv * 3.0) * 0.18);
vec3 color = mix(outgoing, incoming, reveal);
```

- **Why so few frames.** The two pictures are never more than a few frames apart, so nothing ghosts, and the push hides the moment the outgoing shot stops. An overlap where both shots play (the last frames of A under the first frames of B) superimposes two camera positions: wherever the parallax is strong, structures double, the unrelated-crossfade look. A stronger push widens the doubling.
- **The key comes from the seam's row** in `### Transitions` (`uKey` per seam): the dark or light area the camera passes through is where the incoming shot shows first. The noise only roughens the edge; alone, it is the generic noise dissolve `motion-design` §3 forbids.
- **The push keeps its direction**: the outgoing frame scales about the heading (`uFocus`, §4), the way the camera was moving.
- **Unchained seams** (shots generated apart, joined as their row says) keep the keyed threshold dissolve of `footage-scene.md` over a stretch in the moving part of the film, never over a hold.
- **Check.** Settled screenshots at three scroll positions inside each seam (before, middle, after), `motion-review` §2.3: a held, settled frame shows the ghosting a moving recording hides.

## 4. Motion blur from the film's speed

Measure how fast the film runs every frame, in footage frames per second, and drive a radial smear toward the shot's heading with it. Tie it to the speed, never to the seam window: a smear tied to the cut shows when a visitor crosses the seam slowly, which reads as a glitch, while a speed-driven smear appears exactly when the camera travels fast, at seams and inside shots, and clears in holds.

```ts
/* Per frame, in the scene's advance(): delta in seconds, filmLength in frames. */
const framesPerSecond = (Math.abs(progress - last.progress) * filmLength) / Math.max(delta, 0.001);
speed += (framesPerSecond - speed) * (1 - Math.exp(-delta / SPEED_SMOOTHING));   // about 0.1 s
uniforms.uSmear.value = Math.min(speed / FULL_SMEAR_SPEED, 1);                     // the speed of the fastest travel
focus.lerp(heading, 1 - Math.exp(-delta / FOCUS_SMOOTHING));                       // about 0.3 s: the heading glides, never jumps
```

```glsl
vec3 smear(sampler2D frame, vec2 uv, vec2 focus, float amount) {
  vec2 toward = (focus - uv) * SMEAR_LENGTH * amount;                // a share of the distance to the heading, 0.1 to 0.2
  float jitter = interleavedGradientNoise(gl_FragCoord.xy);          // jittered taps: a dozen look like many
  vec3 sum = vec3(0.0);
  for (int tap = 0; tap < SMEAR_TAPS; tap++) {
    sum += texture(frame, uv + toward * ((float(tap) + jitter) / float(SMEAR_TAPS))).rgb;
  }
  return sum / float(SMEAR_TAPS);
}
```

The heading of each shot (where the camera travels toward, in frame space) is a per-shot constant read from its frames.

## 5. One grade and one grain

Every stage of the page ends with the same `FILM_GRADE` chunk (`shader-craft` §4): shadow tint, contrast, vignette and grain at one amount. Grain per scene shows side by side.
