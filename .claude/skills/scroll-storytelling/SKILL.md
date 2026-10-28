---
name: scroll-storytelling
description: Turn a page's copy into long, choreographed scroll animations and build them with GSAP through the design system. Use when the user wants scroll animations, a scroll-driven story, pinned sections, a signature animation moment, or "animations like the best landing pages".
---

# Scroll storytelling

Long animations that feel effortless come from a storyboard, not from effects. Each scene tells one beat of the copy; the scroll is the timeline.

## 1. Budget

Per page: two or three scenes, one of them the signature moment. Everything else stays still or uses short CSS transitions. A scene lasts one to three screens of scroll (`length="short" | "medium" | "long"`); longer pins feel like a trap.

## 2. Map beats to scenes

| Beat      | Scene that explains it                                                    |
| --------- | ------------------------------------------------------------------------- |
| Promise   | Headline assembles line by line, then gives way to the product            |
| Mechanism | Pinned stage: the steps of how it works appear in order on one canvas     |
| Proof     | A figure counts up or a before/after wipes across while the claim stays   |
| Contrast  | The old way and the new way share one frame; scroll swaps them            |
| Action    | No scene. Calm, readable, one button                                      |

If a beat has no sequence, cause or continuity to show, it gets no scene.

## 3. Storyboard

Write one block per scene and get the user's approval before coding:

```
Scene: <name> — beat: <promise|mechanism|proof|contrast>
Length: short | medium | long
Final state (what reduced motion shows): <the complete composition>
Choreography:
  0–30%   <element> from <offset> (ease, duration token)
  30–70%  …
  70–100% …
Why: <what the motion explains>
```

## 4. Build

Scenes use `ScrollScene` from `@repo/ui/motion/scroll-scene` inside a client component (`apps/web/src/features/<page>/<name>-scene.tsx`). `MotionProvider` (already in the app providers) runs Lenis smooth scrolling synced to GSAP.

```tsx
"use client";

import { ScrollScene } from "@repo/ui/motion/scroll-scene";
import { duration, ease, stagger } from "@repo/ui/motion/tokens";

function revealSteps(timeline: gsap.core.Timeline): void {
  timeline
    .from("[data-scene-item='title']", { yPercent: 30, opacity: 0, duration: duration.slow, ease: ease.emphasized })
    .from("[data-scene-item='step']", { y: 32, opacity: 0, stagger: stagger.loose }, "<0.3");
}

export function MechanismScene() {
  return (
    <ScrollScene choreography={revealSteps} length="medium">
      {/* compose @repo/ui components; mark targets with data-scene-item */}
    </ScrollScene>
  );
}
```

Rules:

- Write the final state in markup and animate **from** an offset (`timeline.from`). Reduced motion skips the choreography, so the markup must already be the complete page. When the story has stages a final state cannot show, pass them to `ScrollScene still={…}` as still plates.
- Target elements with `data-scene-item` attributes; selectors are scoped to the scene.
- Animate `transform` and `opacity` only. Durations, easings and staggers come from `@repo/ui/motion/tokens`; add a token there rather than a magic number.
- One `ScrollTrigger` per scene (the one `ScrollScene` creates). Nested timelines, not nested triggers.
- A recurring pattern (counter, wipe, split headline) becomes a motion primitive in `packages/ui/src/motion/` with a story and a test, through the `design-system` skill.

## 5. Verify

1. Scroll the page in the browser at 60 fps on a mid-range laptop; no layout shift, no jank (`gsap-performance` skill).
2. Emulate reduced motion: the page reads completely.
3. `review-animations` skill on each scene, then `pnpm test:e2e`.

## Reference skills

`gsap-scrolltrigger`, `gsap-timeline`, `gsap-react`, `gsap-plugins` (SplitText, Flip), `gsap-performance`, `emil-design-eng` (motion craft), and `scene-3d` when a scene needs a 3D model. Known issue: the horizontal-scroll example in `gsap-scrolltrigger` is wrong (`Max.max` typo, pixels passed to `xPercent`); use `x: () => -(track.scrollWidth - window.innerWidth)` with `ease: "none"`.
