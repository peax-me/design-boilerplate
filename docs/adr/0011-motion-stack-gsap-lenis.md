---
status: accepted
date: 2026-10-28
decision-makers: [project owner]
---

# 0011. Motion stack: GSAP, Lenis and CSS

## Context and problem statement

Landing pages built from this boilerplate rely on long, choreographed, scroll-driven storytelling: pinned sections, scrubbed timelines, split-text reveals. Smaller interactions (hover, focus, popover entry) also need motion. Motion must respect user preferences and stay consistent with the design system. Which tools handle which kind of motion?

## Decision drivers

- Pinned, scrubbed, multi-step scroll timelines with precise control.
- Smooth scrolling kept in sync with scroll-triggered animation.
- Micro-interactions without JavaScript.
- One animation engine, one API for agents to learn.
- `prefers-reduced-motion` honoured everywhere.
- Motion tokens shared between CSS and JavaScript.

## Considered options

- GSAP + Lenis + CSS transitions
- Motion (formerly Framer Motion) only
- CSS scroll-driven animations only
- Theatre.js

## Decision outcome

Chosen option: "GSAP + Lenis + CSS transitions".

| Need                           | Tool                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Scroll storytelling, timelines | GSAP 3.15 with ScrollTrigger, SplitText, Flip, … (all plugins free since the Webflow acquisition) |
| React integration              | `@gsap/react` `useGSAP` (scoped selectors, automatic cleanup)                                     |
| Smooth scrolling               | Lenis, driven by GSAP's ticker                                                                    |
| Micro-interactions             | CSS transitions and `@starting-style`                                                             |

Lenis is driven by GSAP's ticker so both share one frame loop:

```ts
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Rules:

- Motion tokens (durations, easings, scene lengths) live in `packages/ui` and are used by both CSS and GSAP.
- Reduced motion is mandatory: under `prefers-reduced-motion: reduce`, Lenis is not started and scenes render their final state (`gsap.matchMedia()`).
- Motion (framer-motion) is not installed, to avoid two competing animation APIs.

Motion alone is weaker for pinned, scrubbed timelines. CSS scroll-driven animations do not have universal browser support yet and are hard to orchestrate across many steps. Theatre.js targets keyframe editing in a studio UI, which we do not need.

### Consequences

- Good, because one engine handles every complex animation, with a mature scroll plugin.
- Good, because micro-interactions ship no JavaScript.
- Good, because reduced-motion users get complete, static content.
- Bad, because GSAP scenes are client components and add JavaScript to the pages that use them.
- Bad, because ScrollTrigger measures layout; content that streams in or resizes later (Cache Components, fonts, images) requires `ScrollTrigger.refresh()`.
- Bad, because CSS easings (`cubic-bezier()`) and GSAP eases use different formats; sharing tokens needs a mapping.
- Bad, because GSAP is free but not open source; its license terms apply to every project.

## More information

- GSAP: https://gsap.com/docs/v3/
- GSAP with React: https://gsap.com/resources/React/
- ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Lenis: https://github.com/darkroomengineering/lenis
- `@starting-style`: https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style
- `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Revisit when CSS scroll-driven animations are supported in all target browsers.
