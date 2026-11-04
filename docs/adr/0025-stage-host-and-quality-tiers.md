---
status: proposed
date: 2026-11-04
decision-makers: [project owner]
---

# 0025. Stage host with quality tiers and live WebGL on phones

## Context and problem statement

ADR-0019 gives `BlockStage`: a poster, a canvas loaded from `md` upward, nothing under reduced motion. Every new effect needs the same guarantees (a still LCP, deferred loading, a complete fallback, one clock, an accessible name), and the signature effect of a page must now run live on phones, which ADR-0019 forbids. Where do the guarantees live, and what loads on a phone?

## Decision drivers

- Lighthouse performance ≥ 0.95 on mobile and desktop; a still poster is the LCP element and the canvas loads after it.
- Reduced motion and missing WebGL2 show the complete page, with no `canvas`.
- One animation clock: GSAP (ADR-0011).
- Phones run the live effect in a lighter tier.
- An effect cannot skip a guarantee.
- The boilerplate contains no effect.

## Considered options

- One generic `Stage` host in `@repo/ui` that every scene plugs into, with `BlockStage` as its first user
- Each scene reimplements the `BlockStage` contract
- Keep ADR-0019: posters only on phones

## Decision outcome

Chosen option: "One generic `Stage` host in `@repo/ui`", because the guarantees are written and tested once, an effect inherits them by construction, and the accessibility and performance rules cannot drift scene by scene. Copying the contract into each scene duplicates it, and posters only on phones drop the signature effect there.

`Stage` holds no effect: each project passes its own scene. Its contract:

- The still poster renders first and is the LCP element.
- The canvas is client-only and loads after idle, when the scene approaches the viewport. A scene outside the viewport loads nothing and computes no frame.
- Under reduced motion or without WebGL2, the poster stays alone, the page is complete and no `canvas` exists. Reduced motion enabled after load, or a lost WebGL context, unmounts the scene and brings the poster back.
- One clock: `frameloop="never"`, advanced by `gsap.ticker`.
- An accessible name.
- A progress channel wired to `ScrollScene`.
- `BlockStage` becomes the first user of `Stage`.

The tier is chosen once at load and passed to the scene:

| Tier    | Device  | Loads                                                          | Pixel density | Particles                 |
| ------- | ------- | -------------------------------------------------------------- | ------------- | ------------------------- |
| `light` | Phones  | After idle, near the viewport, and after the first interaction | `[1, 1.5]`    | 32,768 (256×128 texture)  |
| `full`  | Desktop | After idle, near the viewport                                  | `[1, 2]`      | 131,072 (512×256 texture) |

### Consequences

- Good, because accessibility, fallback and clock are guaranteed in one place.
- Good, because the first paint and every fallback stay free of WebGL, and the LCP is a still image.
- Good, because `BlockStage` stops carrying a contract of its own.
- Bad, because phones now download three.js and run a live scene, with the battery and data cost that implies; the `light` tier and the first-interaction trigger limit it. This reverses the ADR-0019 consequence that phones never download three.js.
- Bad, because Lighthouse neither interacts nor scrolls, so on phones it measures the poster path only; the real-GPU budgets of ADR-0026 cover the live scene. A visitor who never touches the page keeps the poster.

## More information

- React Three Fiber canvas: https://r3f.docs.pmnd.rs/api/canvas
- GSAP ticker: https://gsap.com/docs/v3/GSAP/gsap.ticker/
- Related: ADR-0011 (motion), ADR-0019 (3D stage), ADR-0024 (rendering arsenal), ADR-0026 (verification).
- Amends ADR-0019: WebGL is loaded below `md`, on phones, in the `light` tier.
- Revisit when the trial runs show that the `light` tier misses the frame budget of ADR-0026 on phones, or when a scene needs a third tier.
