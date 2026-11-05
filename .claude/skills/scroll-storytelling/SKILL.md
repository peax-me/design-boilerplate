---
name: scroll-storytelling
description: Turn a page's copy into long, choreographed scroll animations and build them with GSAP through the design system. Use when the user wants scroll animations, a scroll-driven story, held (pinned) sections, a signature animation moment, kinetic typography (split headlines, word cycles with blur, scrambled text, mask reveals), or "animations like the best landing pages".
---

# Scroll storytelling

Long animations that feel effortless come from a storyboard, not from effects. Each scene tells one beat of the copy; the scroll is the timeline. How the page moves as one piece (its motion language, the transitions between sections and shots, the pacing and the camera) is decided first with `motion-design`; this skill builds it with GSAP.

## 1. Budget

Per page: two or three scenes, one of them the signature moment. When only one beat of the copy has a sequence, a cause or a continuity to show (§2), the page has that one scene, the signature, rather than a thin second one. Everything else stays still or uses short CSS transitions. A scene lasts one to three screens of scroll (`length="short" | "medium" | "long"`); longer holds feel like a trap. A page built as one world (`motion-design` §4, build in §4 below) counts as one scene, however many sections it spans, because nothing is held: the copy scrolls normally over it.

## 2. Map beats to scenes

| Beat      | Scene that explains it                                                    |
| --------- | ------------------------------------------------------------------------- |
| Promise   | The painted headline gives way to the product as the scroll starts        |
| Mechanism | Held stage: the steps of how it works appear in order on one canvas       |
| Proof     | A figure counts up or a before/after wipes across while the claim stays   |
| Contrast  | The old way and the new way share one frame; scroll swaps them            |
| Action    | No scene. Calm, readable, one button                                      |

If a beat has no sequence, cause or continuity to show, it gets no scene.

**The first window is already painted.** GSAP loads once the page is idle, after the visitor has seen the page (ADR-0011), so nothing in the first window ever assembles from a hidden state: hiding it to play an entrance would replay what was already read. A scene that can sit in the first window starts from its painted composition and moves it on as the scroll starts; entrances belong to content below it, played as it enters the window.

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
Lead: <the one element that carries each phase>
Intensity: <1 to 5>
Pointer: <what it does> | none, because <reason>
Ambient (a scene with a WebGL stage): yes | no
```

Eases, durations, staggers and directions come from `## Motion language`, and each scene's first and last phases carry its rows of `### Transitions` (`motion-design` §1, §3); `Lead` and `Intensity` follow `motion-design` §4. Every scene fills `Pointer`, kinetic type and other stage-less scenes included: a signature with no pointer channel says so here, and `motion-review` scores its pointer criterion against it.

**Interactive:** get the user's approval before coding.

**Autonomous** (a run started by the `signature-experience` skill from a brief, ADR-0028): do not wait. Record the blocks under `### Storyboard` in the page's `## Page: <name>` section of `DESIGN.md`, check them yourself, and code. The check: the page keeps the budget of §1 and has one signature moment; each scene shows a sequence, a cause or a continuity (§2); each lasts one to three screens; the final state is a complete composition; durations, easings and staggers are the tokens `## Motion language` names; every boundary of the scene has its row in `### Transitions`, carried by its first or last phase; the `Why` names what the motion explains. Fix what fails, note the fix in the block, and go on.

## 4. Build

Scenes use `ScrollScene` from `@repo/ui/motion/scroll-scene` inside a client component (`apps/web/src/features/<page>/<name>-scene.tsx`). `MotionProvider` (already in the app providers) runs Lenis smooth scrolling synced to GSAP. Both load GSAP once the page is idle, so the first paint never waits for it: the choreography only drives the `timeline` it receives, and its module imports nothing from `gsap` (the `gsap.core.Timeline` type is global).

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
- **A scene that can sit in the first window** is the exception: the visitor has read its markup before the timeline exists, and a `timeline.from` would snap it to its hidden state at idle. Its progress 0 is the painted composition, and its choreography moves content on from there (`timeline.to`): out, aside, into the next beat (§2, "The first window is already painted").
- Target elements with `data-scene-item` attributes; selectors are scoped to the scene.
- Animate `transform` and `opacity` only; the one exception is the short-text blur of §5. Durations, easings and staggers come from `@repo/ui/motion/tokens`; add a token there rather than a magic number.
- **Durations in a scrubbed timeline are shares of the scene**, not seconds: a `duration.slow` tween in a `medium` scene spans 0.8 of its timeline, and letters crawl over more than a screen. Write scrubbed spans in window heights (a scroll span token, `motion-design` §1) and convert them, `inScene(span, length) = span / sceneLength[length]`. A primitive that runs in both played and scrubbed timelines (a letter reveal, a counter) takes its timing as an argument.
- One `ScrollTrigger` per role: the scene's hold (the one `ScrollScene` creates), and at most one entry scrub on the same stage (`references/section-handoffs.md`). Nested timelines, not nested triggers.
- `ScrollScene` holds its stage with CSS (`sticky` in a track one window taller per screen of `length`, measured in `svh`, which a phone toolbar collapsing mid-scroll does not change) and scrubs the track, so a scene shifts no layout and the scrub stays in step with the hold. Never add `pin` to a trigger: a pin switches the element to `position: fixed` and inserts a spacer, which field CLS counts as layout shift even when nothing visibly jumps.
- A scene that hosts a WebGL stage tweens the page's `{ value }` progress object and never the stage's internals (`shader-craft` §3).
- A transition across a boundary is built inside the outgoing scene's track, while its stage is still held: its last phases resolve the stage toward the next section's surface, carry an element into it, or wipe the next surface over it, so the frame that the sticky track releases already matches what follows (`motion-design` §3, "Stage to flat"). An element shared across the boundary travels in the timeline of the scene that spans it, or moves between two layouts with Flip (`gsap-plugins`).
- A recurring pattern (counter, wipe, split headline) becomes a motion primitive in `packages/ui/src/motion/` with a story and a test, through the `design-system` skill. Apps cannot import `@gsap/react`, so kinetic type a page needs is such a primitive too. Its GSAP code sits in a module of its own, rendered lazily inside `AfterIdle` (`packages/ui/AGENTS.md`).
- A page never imports `gsap` or a plugin: `apps/web` does not depend on it, and adding it would put GSAP back before the first paint (about 50 KB gzipped) and cost Lighthouse mobile its LCP margin. The choreography only calls methods of the `timeline` it receives.
- A choreography that writes the page's progress object uses `timeline.set(progress, { value }, position)` or a tween, never `progress.value = …`: the lint's `no-param-reassign` rejects writes to a prop.

### One smoothing layer

`motion-design` §2 sets the rule: between the scroll position and a world value, exactly one smoothing layer, or none. Smooth scrolling (Lenis, run by `MotionProvider`) moves the copy and the world together, so it opens no gap between them; every layer after it does. Lags add up: a scrub, a `quickTo` and a spring stacked behind Lenis left a world a large part of a screen behind its copy at a normal scroll speed, so the copy arrived over a state that had not formed yet.

| Setup                                               | The one layer                    | Never add                                                       |
| --------------------------------------------------- | -------------------------------- | --------------------------------------------------------------- |
| A held `ScrollScene` driving DOM or shader uniforms | the `scrub` token                | `quickTo`, damping or a spring on the progress or a uniform     |
| A stage whose matter settles by itself (a spring)   | the world's own spring           | a scrub: drive the value directly (`ScrollScene scrub="direct"`, or `gsap.set`) |
| One world behind normally scrolling copy            | the world's own physics, or none | `scrub`, `quickTo`                                              |

`ScrollScene scrub="direct"` makes its timeline follow the scroll position exactly; the default, `"smoothed"`, catches up over the `scrub` token. Check the lag on a real wheel scroll with the probe of `motion-review` §2.3.

### One world

When the story is one continuous subject (`motion-design` §4), mount its stage once, fixed behind the page, and let the copy scroll in normal flow over it. Each copy block names the state it shows (`data-world-state`); one trigger for the whole page measures the blocks and maps the scroll to the world with a pure function, holding each state while its block is read and morphing between blocks. A block whose copy names an action travels through it while it is read. Markup, mapping, tests and the reduced-motion plates: `references/one-world.md`.

### Section handoffs

- **Ground bands, not shader seams.** Each full-bleed stage carries bands of its section's ground at its top and bottom edges, in the DOM, shown and hidden by the scene's choreography. A seam drawn in the shader is missing whenever the next stage still shows its poster as it scrolls in.
- **A scheme change** (dark to light) is a sweep inside the outgoing scene's hold that leaves the whole frame on the next ground, never a static gradient band between two sections.
- **Calm sections** compose with one scrubbed timeline as they enter, and a held scene may compose while it rises with one entry scrub.
- **An element carried across** copies its original's profile and never crosses copy.

Recipes, parameters and the reasons behind them: `references/section-handoffs.md`.

## 5. Kinetic type

Moving type belongs to the choreography of a budgeted scene (§1), never to an extra scene, and only to a headline or a short statement that carries the beat: not to body copy. The final text is in the markup, read by everything. Under reduced motion SplitText never touches the text and the page already shows it, and the text is never hidden in CSS until JavaScript runs. Text in the first window is never split to play an intro: it was read before GSAP loaded (§2).

**Where it lives.** A page cannot import `gsap` (§4), so kinetic type is a motion primitive of `packages/ui`, built through `design-system` the first time a page needs it, in two modules:

- the component of the first load renders the final text with its `data-slot`, imports nothing from GSAP, and renders the motion module lazily inside `AfterIdle`;
- the motion module imports `gsap` and `SplitText` (`gsap-plugins`; it comes with the `gsap` package and is registered there), runs under `gsap.matchMedia` for `no-preference`, and plays its reveal through `enterUnseen`, which leaves text already in view as painted and plays the reveal as unseen text enters the window.

A reveal scrubbed by a scene's timeline needs that timeline in the motion module: `ScrollScene` hands none to its children yet, so add that channel through `design-system`, tests first, when the first scene needs it.

**Split with SplitText:**

- Create it inside the motion module's `useGSAP` and `gsap.matchMedia`, so the selector is scoped to the primitive and the split reverts on cleanup: `SplitText.create(target, { type, autoSplit: true, aria: "auto", onSplit })`.
- Split only what moves: `"lines"` for a line reveal, `"words"` for a word reveal, `"chars"` only on a short word.
- `autoSplit: true` splits again when the fonts load and when the width changes, so line breaks stay right: never split from `document.fonts.ready` by hand. A re-split destroys the pieces, so build the tween in `onSplit`, add it to its timeline (the reveal's, or the scene's) at a fixed position and return it: SplitText kills the old tween and carries the progress over to the new one.
- `aria: "auto"`, passed explicitly, puts an `aria-label` with the text on the split element and hides the pieces from assistive technology. Use it on headings, where the label is announced, and on short statements; a paragraph does not announce one.

```tsx
// packages/ui/src/motion/line-reveal-motion.tsx: rendered lazily inside AfterIdle by the LineReveal primitive
"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import type { RefObject } from "react";

import { enterUnseen } from "./enter-unseen.ts";
import { duration, ease, stagger } from "./tokens.ts";

gsap.registerPlugin(useGSAP, SplitText);

export function LineRevealMotion({ scope }: { scope: RefObject<HTMLElement | null> }): null {
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () =>
        enterUnseen(scope.current, () => {
          const reveal = gsap.timeline();
          SplitText.create("[data-line-reveal]", {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            aria: "auto",
            onSplit(split) {
              const lines = gsap.from(split.lines, { yPercent: 110, duration: duration.slow, ease: ease.emphasized, stagger: stagger.base });
              reveal.add(lines, 0);
              return lines;
            },
          });
          return reveal;
        }),
      );
    },
    { scope },
  );
  return null;
}
```

**Mask reveal.** `mask: "lines"` (or `"words"`) wraps each unit in a clipping box and the unit slides in from below it: a transform, no opacity needed. Check that descenders and accents are not clipped, and give the box room through the design system rather than by hand in the app.

**Word cycle with blur.** One short word or phrase swaps through alternatives as the scroll advances: the old word blurs and fades out while the next blurs in. Blur is the one property beyond transform and opacity this skill allows, because it makes the swap read as one object changing focus, and it costs repaints. Keep it to the few words in motion at a moment and a small radius: never on a paragraph, a line of body copy or a split into many characters. Stack the alternatives in one grid cell so the widest sets the width and nothing reflows. A screen reader reads the full sentence once: the cycled words are `aria-hidden` and the heading carries the final sentence. A cycle driven by the scroll stops when the visitor stops; one that runs on a timer for more than five seconds needs a pause control (WCAG 2.2.2).

**ScrambleText** (`ScrambleTextPlugin`) for short technical text: a label, a figure, a status, a code-like line. `gsap.from(element, { scrambleText: { text: "", chars: "…", speed } })` scrambles in and ends on the text already in the markup. Mid-scramble text is unreadable and its width jitters, so keep it off headlines and sentences, scramble an `aria-hidden` copy stacked over the real text so the box never changes size, and let assistive technology read the real text once.

A treatment that needs layout to hold its box (the stacked cell of a word cycle, the twin of a scramble, the room of a mask) is a `@repo/ui` primitive with a story and a test (§4, `design-system`); the app composes it.

## 6. Verify

1. Scroll the page in the browser at 60 fps on a mid-range laptop; no layout shift, no jank (`gsap-performance` skill).
2. Emulate reduced motion: the page reads completely, kinetic type included, with its final text.
3. Every boundary on its strips (`motion-review` §2.3): no straight edge between grounds, no world lagging its copy, no action played between two blocks of copy.
4. Resize a split headline across a breakpoint and reload with a slow font: the lines stay right and the animation keeps its progress.
5. `review-animations` skill on each scene, then `pnpm test:e2e`.

## Reference skills

`motion-design` (motion language, transitions, pacing, camera), `gsap-scrolltrigger`, `gsap-timeline`, `gsap-react`, `gsap-plugins` (SplitText, ScrambleText, Flip), `gsap-performance`, `emil-design-eng` (motion craft), then the technique skills when a scene is a stage: `shader-craft` (surfaces, light, post-processing), `gpu-particles`, `cinematic-footage` (AI footage, scroll-driven sequences) and `scene-3d` (models, water, splats). Known issue: the horizontal-scroll example in `gsap-scrolltrigger` is wrong (`Max.max` typo, pixels passed to `xPercent`); use `x: () => -(track.scrollWidth - window.innerWidth)` with `ease: "none"`.
