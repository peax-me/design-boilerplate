---
status: accepted
date: 2026-11-04
decision-makers: [project owner]
---

# 0025. Stage host with quality tiers and live WebGL on touch devices

## Context and problem statement

ADR-0019 gives `BlockStage`: a poster, a canvas loaded from `md` upward, nothing under reduced motion. Every new effect needs the same guarantees (a still LCP, deferred loading, a complete fallback, one clock, an accessible name), and the signature effect of a page must now run live on phones, which ADR-0019 forbids. Where do the guarantees live, and what loads on a phone?

## Decision drivers

- Lighthouse performance ≥ 0.95 on mobile and desktop; a still poster is the LCP element and the canvas loads after it.
- Reduced motion and missing WebGL2 show the complete page, with no `canvas`.
- One animation clock: GSAP (ADR-0011).
- Colours follow the design tokens, including runtime presets (ADR-0020).
- Phones and other touch devices run the live effect in a lighter tier.
- An effect cannot skip a guarantee.
- The boilerplate contains no effect.

## Considered options

- One generic `Stage` host in `@repo/ui` that every scene plugs into, with `BlockStage` as its first user
- Each scene reimplements the `BlockStage` contract
- Keep ADR-0019: posters only on phones

## Decision outcome

Chosen option: "One generic `Stage` host in `@repo/ui`", because the guarantees are written and tested once, an effect inherits them by construction, and the accessibility and performance rules cannot drift scene by scene. Copying the contract into each scene duplicates it, and posters only on phones drop the signature effect there.

This ADR supersedes ADR-0019 entirely. Its decisions that still hold are restated here:

- `three` and `@react-three/fiber` live in `@repo/ui` and are dependencies of the boilerplate. Apps never style (ADR-0007), so 3D stays out of pages.
- The fallback is a poster, drawn from the same data as the scene or captured from the scene's first frame.
- Materials read their colours from the design tokens at runtime; textures come from `asset-production` with a provenance record.

`Stage` holds no effect: each project passes its own scene. Its contract:

- The still poster renders first and is the LCP element. A stage sized by its class sizes the poster layer, so a poster can cover a full-bleed stage.
- The canvas is client-only and loads after idle, when the scene approaches the viewport. A scene outside the viewport mounts nothing and computes no frame.
- Mounting a scene stays within the long-frame budgets of ADR-0026: a stage that loads during scroll stalls no frame past 100 ms, and the first stage mount right after page load, on either tier, stays within 300 ms. Mandated by the project owner, 2026-11-05. Once the scene may load (after idle; on `light`, after the first interaction too), three.js, the React renderer and the scene module (`prepareScene`, the lazy scene's own `import()`) load and evaluate, each in a task of its own; the scene mounts only once they have. `StageCanvas` compiles the scene's programs with `gl.compileAsync(scene, camera)` (`KHR_parallel_shader_compile`) before its first frame, and the poster stays until that frame is drawn.
- Under reduced motion or without WebGL2, the poster stays alone, the page is complete and no `canvas` exists. Reduced motion enabled after load, or a lost WebGL context, unmounts the scene and brings the poster back.
- One clock: `frameloop="never"`, advanced by `gsap.ticker`.
- An accessible name.
- A scene that moves on its own (`ambient`) gets, once live, a control that pauses and plays it (WCAG 2.2.2): a paused canvas draws no new frame.
- A progress channel wired to `ScrollScene`, which holds its stage with CSS `sticky` in a track and scrubs the track, never a ScrollTrigger pin: a pin switches the stage to `position: fixed` and inserts a spacer, which field CLS counts as layout shift.
- `BlockStage` becomes the first user of `Stage`.

The tier is chosen once at load and passed to the scene: `light` if the viewport is narrower than 48rem (the `md` breakpoint) or the primary pointer is coarse (`(pointer: coarse)`), otherwise `full`. There is no CPU-core criterion: CI runners report 4 cores and recent phones 8, so it separates nothing. Touch tablets get `light`; wide screens with a fine pointer get `full`.

| Tier    | Chosen when                                       | Loads                                                          | Pixel density | Particles                 |
| ------- | ------------------------------------------------- | -------------------------------------------------------------- | ------------- | ------------------------- |
| `light` | Viewport under 48rem, or a coarse primary pointer | After idle, near the viewport, and after the first interaction | `[1, 1.5]`    | 32,768 (256×128 texture)  |
| `full`  | Otherwise                                         | After idle, near the viewport                                  | `[1, 2]`      | 131,072 (512×256 texture) |

### Consequences

- Good, because accessibility, fallback and clock are guaranteed in one place.
- Good, because the first paint and every fallback stay free of WebGL, and the LCP is a still image.
- Good, because `BlockStage` stops carrying a contract of its own.
- Bad, because phones and other touch devices now download three.js and run a live scene, with the battery and data cost that implies; the `light` tier and the first-interaction trigger limit it. This reverses the ADR-0019 consequence that phones never download three.js.
- Bad, because Lighthouse neither interacts nor scrolls, so on light-tier devices it measures the poster path only; the real-GPU budgets of ADR-0026 cover the live scene. A visitor who never touches the page keeps the poster.
- Bad, because on `full` a page with a stage downloads three.js and its scene modules at idle, even when no stage ever nears the viewport: that is what lets a scene mount mid-scroll without a long frame.
- Bad, because on desktop the `full` scene loads after idle once it nears the viewport, so it can run during the Lighthouse audit. If the desktop budget fails, the escape route is to make `full` wait for a first interaction too.

## More information

- React Three Fiber canvas: https://r3f.docs.pmnd.rs/api/canvas
- GSAP ticker: https://gsap.com/docs/v3/GSAP/gsap.ticker/
- `(pointer: coarse)`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer
- Related: ADR-0007 (locked theme), ADR-0011 (motion), ADR-0020 (token presets), ADR-0024 (rendering arsenal), ADR-0026 (verification).
- Supersedes ADR-0019. WebGL now loads below `md`, on phones and other touch devices, in the `light` tier.
- Revisit when the trial runs show that the `light` tier misses the frame budget of ADR-0026 on phones, or when a scene needs a third tier.
