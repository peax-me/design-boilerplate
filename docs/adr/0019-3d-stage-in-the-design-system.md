---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0019. 3D stage in the design system with three.js and React Three Fiber

## Context and problem statement

Projects started from this boilerplate need real-time 3D scenes in their pages. Apps never style (ADR-0007), so 3D cannot live in a page. Which runtime renders 3D, where does it live, and how does it stay within the performance and accessibility budgets?

## Decision drivers

- Lighthouse performance ≥ 0.95 on mobile (ADR-0016).
- Reduced motion and missing WebGL still show the complete page (design principle 7).
- Colours follow the design tokens, including runtime presets (ADR-0020).
- One animation clock: GSAP drives scroll, timelines and frames (ADR-0011).

## Considered options

- `three` + `@react-three/fiber` in `@repo/ui`, behind a vector poster
- `three` without a React renderer
- Pre-rendered video or image sequences

## Decision outcome

Chosen option: "`three` + `@react-three/fiber` in `@repo/ui`, behind a vector poster", because React Three Fiber keeps scenes declarative and composable like the rest of the design system, and the poster keeps the first paint and every fallback free of WebGL.

- `BlockStage` (`packages/ui/src/motion/block-stage.tsx`) renders an isometric SVG poster from the same data as the 3D scene. The canvas loads lazily from the `md` breakpoint, after the page is idle, and never under reduced motion.
- Materials read their colours from the design tokens at runtime; textures come from `asset-production` with a provenance record.
- `@react-three/drei` is not added: the scene needs only boxes, lights and an orthographic camera.
- ADR-0018's rule that 3D runtimes are added per project no longer applies to `three` and `@react-three/fiber`.

Plain three.js would mean hand-written scene lifecycle code in every component. Videos cannot follow runtime tokens and weigh more than the scene.

### Consequences

- Good, because the 3D scene and its fallback come from one data set and stay in sync.
- Good, because phones and reduced-motion visitors never download three.js.
- Bad, because three.js adds a large client chunk on tablet and desktop.
- Bad, because headless browsers may lack WebGL; tests cover the poster path and a browser check covers the canvas.

## More information

- React Three Fiber: https://r3f.docs.pmnd.rs
- three.js: https://threejs.org/docs
- Related: ADR-0011 (motion), ADR-0018 (inspiration, assets and 3D), ADR-0020 (token presets).
- Revisit when the scene needs loaders or helpers that `@react-three/drei` provides, or when mobile performance allows WebGL below `md`.
