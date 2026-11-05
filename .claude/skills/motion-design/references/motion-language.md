# Motion language tables

Starting values for the `## Motion language` block (`motion-design` §1). They are heuristics, not measurements: tune them against the recording and log the change.

## Archetypes

Adapted from the four personality archetypes of the LottieFiles motion-design skill (MIT, © 2025 LottieFiles), rewritten for scroll scenes and this project's tokens. Choose by the direction's words, then adjust.

| Archetype    | Direction words that select it           | Signature ease                                 | Overshoot                          | Block arrival              | Stagger         | Transitions it favours                                                | Camera                                     |
| ------------ | ---------------------------------------- | ---------------------------------------------- | ---------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------- | ------------------------------------------ |
| Premium      | calm, precise, quiet, crafted, editorial | `ease.emphasized` arrivals, `ease.inOut` moves | none                               | `duration.slow`            | `stagger.loose` | long overlaps, masks along the travel, match cuts, luminance reveals  | slow dolly, normal to long lens, few moves |
| Professional | clear, reliable, efficient, technical    | `ease.standard`                                | none                               | `duration.base`            | `stagger.base`  | shared axis, wipes along the travel, plain cuts between flat sections | static, or slow reframes                   |
| Energetic    | bold, fast, loud, kinetic                | `ease.emphasized`, exits on an ease-in token   | small, on played moves only        | `duration.base` or shorter | `stagger.tight` | match on action, smear, short overlaps                                | wide lens, fast dolly, whips               |
| Playful      | warm, friendly, curious, light           | an overshoot settle token (to add)             | small to medium, played moves only | `duration.base`            | `stagger.base`  | shared element, morph, round-edged masks                              | arcs, a settle on arrival                  |

- When the direction is ambiguous, take premium for a signature page and professional for a product or documentation page.
- The `scrub` token suits premium and professional. An energetic page may need a shorter smoothing and a premium one a longer smoothing: add the token through `design-system`.

## Material

What the page moves like sets its weight.

| Material              | How it moves                                         | Weight | Overshoot | Devices it suggests                                   |
| --------------------- | ---------------------------------------------------- | ------ | --------- | ----------------------------------------------------- |
| Liquid                | Starts slowly, keeps flowing, settles without bounce | heavy  | none      | seep along gravity, depth or luminance reveal, morph  |
| Light                 | Instant onset, soft falloff, no mass                 | light  | none      | light leak, luminance-keyed reveal, wipe along a beam |
| Glass, metal          | Rigid and exact; highlights travel across surfaces   | medium | none      | match cut, hard-edged wipe, refraction smear          |
| Paper, fabric         | Slides and folds; edges lag                          | light  | small     | mask along a fold, shared element                     |
| Stone, earth          | Slow, massive, inevitable                            | heavy  | none      | depth-keyed reveal, camera move through a cut         |
| Air, smoke, particles | Drifts, disperses and gathers                        | light  | none      | morph, overlap of ranges                              |

Heavy materials take the longer step of each duration and the gentler ease; light ones take the shorter step.

## Durations by kind of move

| Kind of move                                            | Played                                | Scrubbed: share of its scene's track                                     | Token                                                             |
| ------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Element arrival (a label, an icon, a line of support)   | 0.2 to 0.45 s                         | 5 to 10 %                                                                | `duration.fast`, `duration.base`                                  |
| Block or headline arrival                               | 0.45 to 0.8 s                         | 10 to 20 %                                                               | `duration.base`, `duration.slow`                                  |
| Scene arrival (a stage's first state, a section as one) | 0.8 s and more                        | 15 to 25 %                                                               | `duration.slow`                                                   |
| Signature move (a morph, a camera travel)               | not played                            | 40 to 60 % of a `medium` or `long` track                                 | `sceneLength`                                                     |
| Transition across a boundary                            | 0.6 to 1.2 s on a played route change | 15 to 30 % of the outgoing track, overlapping the incoming by 10 to 20 % | none                                                              |
| Reading hold                                            | not played                            | at least 25 % of each beat                                               | none                                                              |
| Rest after a peak                                       | not played                            | at least half a screen                                                   | none                                                              |
| Exit                                                    | 60 to 70 % of its entry               | the same ratio                                                           | one step below the entry                                          |
| Pointer answer                                          | the lag of `gsap.quickTo`             | not scrubbed                                                             | `duration.slow` for a heavy page, `duration.base` for a light one |

In a scrubbed timeline a duration token sets proportions: a `duration.slow` tween next to a `duration.base` one lasts 0.8 / 0.45 as long. The scene's `length` sets the absolute pace.

A scrubbed span is easier to reason about in window heights than in timeline units: a span token (stagger, entry, exit, seam) of a fraction of a window, converted to the scene's timeline by its length (`scroll-storytelling` §4). Distances are tokens too: a short settle for copy, a longer gather or split for the medium.

## Eases by role

| Role                      | Token                        | Use                                                                                                                                                                                  |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Arrival into rest         | `ease.emphasized` (expo.out) | Most arrivals: far in the first frames, a long settle. The arrival strip shows the spacing shrink                                                                                    |
| Settle, support, reaction | `ease.standard` (power2.out) | A softer settle for what follows the lead                                                                                                                                            |
| Move between two rests    | `ease.inOut` (power3.inOut)  | Camera moves, morphs, a stage's `{ value }` progress between holds                                                                                                                   |
| Exit off screen           | none yet                     | Add an ease-in token through `design-system` once the page has exits; power2.in is a starting point                                                                                  |
| Overshoot settle          | none yet                     | Add it only when the personality allows overshoot, and use it on played moves                                                                                                        |
| Direct drive              | `"none"`                     | A value the scroll drives at a constant rate: a horizontal track, a wipe front, a shader's progress, a frame index whose footage already carries the camera's ease. Never an arrival |

## Adding a token

1. The language names a role the tokens lack.
2. Add it to `packages/ui/src/motion/tokens.ts` through `design-system`, and say why in the commit: a token is a design decision.
3. A custom curve is a `CustomEase` (a GSAP plugin, ADR-0011), registered once in the motion module; the token is its name. Check its shape in the GSAP Ease Visualizer.
4. `DESIGN.md` names the token, never its value.
