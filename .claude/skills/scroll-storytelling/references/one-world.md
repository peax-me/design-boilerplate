# One world behind the page

The build of the "one world" choreography (`motion-design` §4): one stage mounted once, fixed behind the whole page, and copy blocks ("beats") that scroll in normal flow over it. Each beat names the state of the world it shows; the world holds that state while the beat is read and morphs to the next state between beats. The functions below were checked numerically (holds exact, progress monotone); the markup and the trigger follow this repository's lint (named functions, early returns, `gsap.set` instead of assignment).

## Markup

A `@repo/ui` primitive built through `design-system` (apps never style). It renders:

- **The stage**: `fixed inset-x-0 top-0 -z-10 h-lvh`. Use `lvh`, never `dvh`: on phones the address bar changes `dvh` on every change of scroll direction, and the canvas would resize mid-scroll.
- **The beats**: `pointer-events-none grid min-h-dvh` with vertical padding from the spacing scale, their copy `pointer-events-auto`. Full-width beats would otherwise cover the stage's pause control.
- **Reduced motion**: the stage is `motion-reduce:hidden`, the beats drop `min-h-dvh`, and a still plate per state shows in place of the stage, so the page reads as a sequence of plates and copy.
- **A state for every section**, including reading sections with no shape of their own: a quiet state (the world laid down, dimmed, pushed to an edge) keeps it present without competing with the copy.

Each beat carries `data-world-state="<integer>"`. A beat whose copy names an action also carries `data-world-through="<next integer>"`: it travels through that action while it is read.

## Progress: state indices

The world's progress runs from 0 to N − 1 over N states, and an integer is an exact state. A morph between states k and k + 1 uses the segment-local stagger of `gpu-particles` §4, so every state forms completely at its integer.

## Mapping scroll to the world

One `ScrollTrigger` for the whole page. It measures the beats on refresh, so the copy decides where the world holds, and a change of fonts, breakpoint or copy length never desynchronises them. The module below imports GSAP: the primitive renders the component that calls `driveWorld` lazily, inside `AfterIdle`, so GSAP never loads before the first paint (`packages/ui/AGENTS.md`).

```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ease } from "../motion/tokens.ts";

interface WorldAnchor {
  state: number;
  through: number;
  holdStart: number;
  holdEnd: number;
}

/* A state holds while its beat's centre is within this share of the viewport of the viewport's centre. */
const HOLD_SHARE = 0.15;
/* A beat that names an action travels over a window about twice as long, so the change plays while it is read. */
const ACTION_SHARE = 0.3;

function measureAnchors(beats: HTMLElement[]): WorldAnchor[] {
  const viewport = window.innerHeight;
  return beats.map((beat) => {
    const box = beat.getBoundingClientRect();
    const centred = box.top + window.scrollY + box.height / 2 - viewport / 2;
    const state = Number(beat.dataset.worldState);
    const through = Number(beat.dataset.worldThrough ?? state);
    const share = through === state ? HOLD_SHARE : ACTION_SHARE;
    const reach = share * viewport + Math.max(box.height - viewport, 0) / 2;
    return { state, through, holdStart: centred - reach, holdEnd: centred + reach };
  });
}

function along(scroll: number, from: number, to: number): number {
  return to > from ? Math.min(Math.max((scroll - from) / (to - from), 0), 1) : 1;
}

/* Pure: unit-test it in node. Holds return their state exactly; gaps between beats morph with the eased curve. */
export function worldProgress(scroll: number, anchors: WorldAnchor[], curve: (t: number) => number): number {
  let previous: WorldAnchor | undefined;
  for (const anchor of anchors) {
    if (scroll < anchor.holdStart) {
      if (previous === undefined) {
        return anchor.state;
      }
      const morph = curve(along(scroll, previous.holdEnd, anchor.holdStart));
      return previous.through + (anchor.state - previous.through) * morph;
    }
    if (scroll <= anchor.holdEnd) {
      return anchor.state + (anchor.through - anchor.state) * along(scroll, anchor.holdStart, anchor.holdEnd);
    }
    previous = anchor;
  }
  return previous?.through ?? 0;
}

/* refreshPriority -1: measured after every other trigger, so held scenes above the beats have their final size. */
export function driveWorld(progress: { value: number }, beats: HTMLElement[]): ScrollTrigger {
  const curve = gsap.parseEase(ease.inOut);
  let anchors: WorldAnchor[] = [];
  function follow(self: ScrollTrigger): void {
    gsap.set(progress, { value: worldProgress(self.scroll(), anchors, curve) });
  }
  return ScrollTrigger.create({
    start: 0,
    end: "max",
    refreshPriority: -1,
    onRefresh(self) {
      anchors = measureAnchors(beats);
      follow(self);
    },
    onUpdate: follow,
  });
}
```

- **The morph fills the gap** between two holds: at one screen per beat, about two thirds of a screen of scroll, eased with the move-between-rests token. A hold share between 0.1 and 0.2 of the viewport keeps the state long enough to read without making the morph abrupt.
- **The action window is linear**: the reader's scroll is the action's clock.
- **No scrub, no `quickTo`**: the value is set directly, and the world's own physics (a spring, damping) is the one smoothing layer (`scroll-storytelling` §4, "One smoothing layer"). `gsap.set` also keeps the lint's `no-param-reassign` satisfied, where `progress.value = …` on a prop fails.
- **Bookend**: the closing beat can name the first state again, same place, copy on the same side, so one motion closes the page without a new composition.

## Tests

- `worldProgress`: every hold returns its state exactly at its start, centre and end; an action beat returns `state` at its start and `through` at its end; the value never decreases over a scroll from 0 to the end; before the first beat it returns the first state.
- `measureAnchors`, in the package's browser mode: a beat taller than the viewport holds for its extra height; anchors follow a layout change after `ScrollTrigger.refresh()`.
- The primitive's story: reduced motion shows the plates and every beat's copy, and no canvas.
