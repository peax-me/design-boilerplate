# Section handoffs

Builds for the boundaries `motion-design` §3 designs: ground bands at a stage's edges, a sweep that changes the scheme, calm sections that compose without a hold, an entry scrub on a held scene, and an element carried into the next section. Each is markup a `@repo/ui` primitive owns (apps never style) plus a few tweens in the page's choreography.

## Ground bands at a stage's edges

**Rule.** Every full-bleed stage carries two bands of its section's ground, at its top and bottom edges, in the DOM. They are hidden by default; the scene's choreography shows the entry band while the stage rises and fades it out early in the track, and fades the exit band in late in the track. Two stages then meet through the ground, and a stage meets a flat section on the same ground, with no straight edge.

**Why in the DOM, never in the shader.** A seam drawn by the shader exists only once the canvas is live. The next stage is often still on its poster when it scrolls in, so its edge arrives as a straight line. A band in the markup covers the poster and the canvas alike, and removes the seam uniforms from every scene. Reduced motion skips the choreography, so the bands stay hidden and the posters and still plates read plainly.

```tsx
/* Inside the effect component, above the stage layer, below the copy and the pause control. */
<div data-ground-band="enter" aria-hidden className="pointer-events-none invisible absolute inset-x-0 top-0 h-2/5 bg-linear-to-b from-background via-background/70 to-transparent" />
<div data-ground-band="exit" aria-hidden className="pointer-events-none invisible absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-background via-background/70 to-transparent" />
```

```ts
/* span: the band's share of the scene's timeline (a scroll span token converted with inScene, scroll-storytelling §4). Linear: the scroll is its clock. */
function playGroundBands(timeline: gsap.core.Timeline, span: number): void {
  const end = timeline.duration();
  timeline
    .fromTo("[data-ground-band='enter']", { autoAlpha: 1, scaleY: 1 }, { autoAlpha: 0, scaleY: 0.5, transformOrigin: "top", ease: "none", duration: span }, 0)
    .fromTo("[data-ground-band='exit']", { autoAlpha: 0, scaleY: 0.5 }, { autoAlpha: 1, scaleY: 1, transformOrigin: "bottom", ease: "none", duration: span }, end - span);
}
```

- **Depth**: a third to half of the stage's height, enough to swallow the canvas edge at every aspect without dimming the subject.
- **Opt-in per look**: a look whose matter runs to the stage's edge (a fill that covers the frame, a light that falls to its floor, a horizon line) needs the band; a drawing that sits inside the frame only loses detail near the edge.
- **The pause control stays above the bands** (an on-scale `z-*`), or the band dims it and covers its hit area.
- **A flat section of another scheme between two stages** has no stage to drive its bands: give it static bands of the neighbours' ground inside its own padding (a child with the neighbours' scheme, so the ground token resolves to their value).

## A sweep that changes the scheme

**Rule** (`motion-design` §3, "Scheme changes"): the change happens inside a held, full-viewport stage, in the last phase of the outgoing scene, and leaves the whole frame on the next section's ground.

```tsx
/* Last child of the held stage, which clips it (overflow-clip). Three times the stage, so the front can cross it on any aspect. */
<div data-scene-item="sweep" aria-hidden className="pointer-events-none absolute -inset-full bg-linear-45 from-transparent from-47% via-<leading-edge-token> via-50% to-<next-ground-token> to-51% motion-reduce:hidden" />
```

```ts
timeline.fromTo(
  "[data-scene-item='sweep']",
  { xPercent: 18, yPercent: -18 },
  { xPercent: -18, yPercent: 18, ease: "none", duration: span },
  timeline.duration() - span,
);
```

- **Transform only**, no `clip-path`: a translated gradient costs a composite, not a repaint.
- **Travel**: on a box three times the stage, a sixth of the box (about 17 %) on each axis puts a 45° front exactly on the stage's corner at any aspect. Translate a little more, 17 to 20 %, so the soft edge starts and ends off-frame; more than that spends scroll off-frame and makes the visible crossing shorter. Orient the angle and the translation along the language's travel.
- **Front width**: the colour stops set it. Keep the ramp into the leading edge to a few percent of the box and the step onto the next ground sharper, so the front reads as an edge, not a fog.
- **Linear under the scrub**: the scroll is the front's clock. An in-out ease compresses the crossing into the curve's steep middle, and a full-screen front then crosses in a few dozen pixels of scroll, a flash.
- **The leading edge** takes the medium's colour token (a light, a liquid's tint), so it reads as the medium arriving rather than a gradient.
- **Reduced motion** hides the sweep: the static page never shows it.

## Calm sections compose without a hold

A section with no stage still composes as it enters: one scrubbed timeline from `top bottom` to the section's top a third of the way up the window, ending with `timeline.set({}, {}, 1)` so the last real tween does not stretch to the end of the range. The composition completes by the time the copy is readable, then holds still. Reuse the page's signature move at a lower intensity (a gather, a sweep, a resolve) rather than inventing a new one: an echo makes the signature the page's theme.

## An entry scrub on a held scene

A held scene otherwise scrolls in showing a screen of its "from" states. A second scrubbed timeline on the same stage, from `top bottom` to `top top`, composes it while it rises. One per scene at most: with the hold, that makes one trigger per role.

## An element carried into the next section

- The receiving section clips on the x axis only (`overflow-x-clip`), so the carried element can reach up past its top into the section above.
- Its draw starts when the section enters, from that section's own timeline, so it never shows early.
- Rebuilt in another technique (a DOM line continuing a shader's light, a DOM shape continuing a rendered form), it copies the original's profile measured on a frame: angle, core, soft core, halo, falloff, colour token, each layer with its own width, opacity and blur.
- It never crosses copy: it lands at a corner of the text block, or behind an opaque target with nothing above it, and on narrow screens, where stacked copy sits in its path, it keeps only its landing light.
