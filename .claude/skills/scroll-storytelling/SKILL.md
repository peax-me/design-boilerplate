---
name: scroll-storytelling
description: Turn a page's copy into long, choreographed scroll animations and build them with GSAP through the design system. Use when the user wants scroll animations, a scroll-driven story, pinned sections, a signature animation moment, kinetic typography (split headlines, word cycles with blur, scrambled text, mask reveals), or "animations like the best landing pages".
---

# Scroll storytelling

Long animations that feel effortless come from a storyboard, not from effects. Each scene tells one beat of the copy; the scroll is the timeline.

## 1. Budget

Per page: two or three scenes, one of them the signature moment. When only one beat of the copy has a sequence, a cause or a continuity to show (§2), the page has that one scene, the signature, rather than a thin second one. Everything else stays still or uses short CSS transitions. A scene lasts one to three screens of scroll (`length="short" | "medium" | "long"`); longer pins feel like a trap.

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

Write one block per scene:

```
Scene: <name> — beat: <promise|mechanism|proof|contrast>
Length: short | medium | long
Final state (what reduced motion shows): <the complete composition>
Choreography:
  0–30%   <element> from <offset> (ease, duration token)
  30–70%  …
  70–100% …
Why: <what the motion explains>
Stage (a scene with a WebGL stage): ambient | not ambient; pointer: <what it does> | none, because <reason>
```

**Interactive:** get the user's approval before coding.

**Autonomous** (a run started by the `signature-experience` skill from a brief, ADR-0028): do not wait. Record the blocks under `### Storyboard` in the page's `## Page: <name>` section of `DESIGN.md`, check them yourself, and code. The check: the page keeps the budget of §1 and has one signature moment; each scene shows a sequence, a cause or a continuity (§2); each lasts one to three screens; the final state is a complete composition; durations, easings and staggers are tokens; the `Why` names what the motion explains. Fix what fails, note the fix in the block, and go on.

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
- Animate `transform` and `opacity` only; the one exception is the short-text blur of §5. Durations, easings and staggers come from `@repo/ui/motion/tokens`; add a token there rather than a magic number.
- One `ScrollTrigger` per scene (the one `ScrollScene` creates). Nested timelines, not nested triggers.
- A scene that hosts a WebGL stage tweens the page's `{ value }` progress object and never the stage's internals (`shader-craft` §3).
- A recurring pattern (counter, wipe, split headline) becomes a motion primitive in `packages/ui/src/motion/` with a story and a test, through the `design-system` skill.

## 5. Kinetic type

Moving type belongs to the choreography of a budgeted scene (§1), never to an extra scene, and only to a headline or a short statement that carries the beat: not to body copy. The final text is in the markup, read by everything. Under reduced motion `ScrollScene` skips the choreography, so SplitText never touches the text and the page already shows it; keep that true outside a scene too (an intro on load runs inside `gsap.matchMedia` for `no-preference`), and never hide the text in CSS until JavaScript runs.

**Split with SplitText** (`gsap-plugins`; it comes with the `gsap` package, registered in the module that uses it):

- Create it inside the choreography, so the scene's `gsap.matchMedia` scopes the selector to the scene and reverts the split on cleanup: `SplitText.create(target, { type, autoSplit: true, aria: "auto", onSplit })`.
- Split only what moves: `"lines"` for a line reveal, `"words"` for a word reveal, `"chars"` only on a short word.
- `autoSplit: true` splits again when the fonts load and when the width changes, so line breaks stay right: never split from `document.fonts.ready` by hand. A re-split destroys the pieces, so build the tween in `onSplit`, add it to the scene timeline at a fixed position and return it: SplitText kills the old tween and carries the progress over to the new one.
- `aria: "auto"`, passed explicitly, puts an `aria-label` with the text on the split element and hides the pieces from assistive technology. Use it on headings, where the label is announced, and on short statements; a paragraph does not announce one.

```tsx
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

function revealHeadline(timeline: gsap.core.Timeline): void {
  SplitText.create("[data-scene-item='headline']", {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    aria: "auto",
    onSplit(split) {
      const lines = gsap.from(split.lines, { yPercent: 110, duration: duration.slow, ease: ease.emphasized, stagger: stagger.base });
      timeline.add(lines, 0);
      return lines;
    },
  });
}
```

**Mask reveal.** `mask: "lines"` (or `"words"`) wraps each unit in a clipping box and the unit slides in from below it: a transform, no opacity needed. Check that descenders and accents are not clipped, and give the box room through the design system rather than by hand in the app.

**Word cycle with blur.** One short word or phrase swaps through alternatives as the scroll advances: the old word blurs and fades out while the next blurs in. Blur is the one property beyond transform and opacity this skill allows, because it makes the swap read as one object changing focus, and it costs repaints. Keep it to the few words in motion at a moment and a small radius: never on a paragraph, a line of body copy or a split into many characters. Stack the alternatives in one grid cell so the widest sets the width and nothing reflows. A screen reader reads the full sentence once: the cycled words are `aria-hidden` and the heading carries the final sentence. A cycle driven by the scroll stops when the visitor stops; one that runs on a timer for more than five seconds needs a pause control (WCAG 2.2.2).

**ScrambleText** (`ScrambleTextPlugin`) for short technical text: a label, a figure, a status, a code-like line. `gsap.from(element, { scrambleText: { text: "", chars: "…", speed } })` scrambles in and ends on the text already in the markup. Mid-scramble text is unreadable and its width jitters, so keep it off headlines and sentences, scramble an `aria-hidden` copy stacked over the real text so the box never changes size, and let assistive technology read the real text once.

A treatment that needs layout to hold its box (the stacked cell of a word cycle, the twin of a scramble, the room of a mask) is a `@repo/ui` primitive with a story and a test (§4, `design-system`); the app composes it.

## 6. Verify

1. Scroll the page in the browser at 60 fps on a mid-range laptop; no layout shift, no jank (`gsap-performance` skill).
2. Emulate reduced motion: the page reads completely, kinetic type included, with its final text.
3. Resize a split headline across a breakpoint and reload with a slow font: the lines stay right and the animation keeps its progress.
4. `review-animations` skill on each scene, then `pnpm test:e2e`.

## Reference skills

`gsap-scrolltrigger`, `gsap-timeline`, `gsap-react`, `gsap-plugins` (SplitText, ScrambleText, Flip), `gsap-performance`, `emil-design-eng` (motion craft), then the technique skills when a scene is a stage: `shader-craft` (surfaces, light, post-processing), `gpu-particles`, `cinematic-footage` (AI footage, scroll-driven sequences) and `scene-3d` (models, water, splats). Known issue: the horizontal-scroll example in `gsap-scrolltrigger` is wrong (`Max.max` typo, pixels passed to `xPercent`); use `x: () => -(track.scrollWidth - window.innerWidth)` with `ease: "none"`.
