---
name: scene-3d
description: Add 3D to a page — generate or source a model, optimise it, and drive it with GSAP scroll scenes through React Three Fiber without hurting performance or accessibility. Use when the user wants a 3D model, a 3D hero, an object that turns or assembles on scroll, a WebGL scene, or "complex 3D animation".
---

# 3D scene

3D earns its place when it explains something a flat image cannot: an object to inspect, a mechanism that assembles, a space to move through. It counts as the page's signature moment in the motion budget (`scroll-storytelling`). If a still image or a video loop tells the same story, use that instead.

## 1. Start from the stage that ships

`three` and `@react-three/fiber` live in `@repo/ui` (ADR-0019). `BlockStage` (`packages/ui/src/motion/block-stage.tsx`) is the reference: a vector poster drawn from the same data (`IsoBlocks`), the canvas loaded lazily from `md` once the page is idle, nothing under reduced motion, an orthographic camera matched to the poster, colours, corners and spacing read from the token presets. A new kind of scene (a model instead of blocks) becomes another motion primitive next to it (`design-system` skill), with the same contract: apps pass data and a choreography, never a canvas. Add `@react-three/drei` only with an ADR, when a scene needs its loaders or helpers.

## 2. Get the model

In this order: an existing model the client owns → a licensed model → generation with the Magnific MCP.

- Magnific: `models3d_text_generate` (text to 3D) or `models3d_generate` (image to 3D), then `models3d_remesh`, `models3d_retexture`, `models3d_rig`, `models3d_animate` as needed. Output is GLB.
- Quote and get approval through `asset-production` (gate 2) before any paid call. Download the GLB immediately: result URLs expire.
- Keep sources out of the app: `assets/3d/source/<name>.glb`, with provenance recorded as the `asset-production` skill describes.
- Blender MCP (cleanup, authored clips) is optional and per machine: it runs arbitrary Python, so install it at user scope with telemetry off.

## 3. Optimise

Follow `threejs-asset-pipeline`:

```bash
npx @gltf-transform/cli optimize assets/3d/source/<name>.glb apps/web/public/models/<name>.glb --compress meshopt --texture-compress webp --texture-size 2048
npx @gltf-transform/cli inspect apps/web/public/models/<name>.glb
```

- Budget: under 2 MB per model, textures 2048 px at most, one model per scene.
- Prefer meshopt (decoder bundled with three) over Draco. If Draco or KTX2 is unavoidable, self-host the decoders in `apps/web/public/` and point the loaders at them: drei loads them from CDNs by default.
- Generate typed components with `npx gltfjsx apps/web/public/models/<name>.glb --types` into the feature folder.

## 4. Animate with the scroll

One clock for everything: GSAP drives Lenis, ScrollTrigger and the renderer.

- `<Canvas frameloop="never">` and advance R3F from `gsap.ticker` (`advance(time * 1000)`), so scroll, timelines and frames stay in sync.
- Animate the model through refs inside a `ScrollScene` choreography (rotation, position, camera, material uniforms). Use document scroll with Lenis; never drei `ScrollControls`.
- Clips from the model (`useAnimations`) are scrubbed by setting the action time from the timeline, not by playing them freely.
- Durations and easings come from `@repo/ui/motion/tokens`.

## 5. Performance and accessibility

- A poster image (AVIF/WebP, same framing as the first frame) is the LCP element; the canvas loads after it, client-only (`next/dynamic` with `ssr: false`) and only when the stage nears the viewport.
- `dpr={[1, 2]}`, no shadows unless they explain depth, instancing for repeats (`threejs-performance`).
- Reduced motion and missing WebGL show the poster and the content around it; nothing essential lives only in the canvas.
- The canvas has an accessible name (`aria-label`) describing what it shows.
- Lighthouse budgets still apply (`pnpm --filter @repo/web lighthouse`). Headless browsers may lack WebGL, so e2e tests cover the poster path; check the live scene in a real browser.

## Reference skills

`threejs-react-three-fiber`, `threejs-loaders`, `threejs-asset-pipeline`, `threejs-animation`, `threejs-performance`, then `gsap-scrolltrigger` and `scroll-storytelling` for the choreography.
