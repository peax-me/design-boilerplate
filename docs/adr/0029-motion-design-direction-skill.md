---
status: accepted
date: 2026-11-05
decision-makers: [project owner]
---

# 0029. Motion design direction skill

## Context and problem statement

Three demo landing pages built autonomously with the arsenal's technique skills (shaders, GPU particles, scroll-driven AI footage, GSAP choreography) passed technically, yet their animations and transitions lacked coherence and polish. Each scene had its own ease and light. Stages slid off as rectangles over flat sections, and shot seams were left to a generic dissolve. The skills teach how to build an effect, and the `motion-review` grid had no criterion for what happens between scenes. What tells an agent how a page moves as one piece, and how is that checked?

## Decision drivers

- One motion language per project, written down and checkable on a recording.
- Every boundary between sections and between shots designed before the storyboard, never left to a default.
- No duplication of the technique skills, `scroll-storytelling`, `emil-design-eng` or `motion-review`.
- Scroll-driven scenes, footage seams and section handoffs, which no published motion skill covers.
- Sources with clear licences; ideas paraphrased, nothing copied.

## Considered options

- A project skill, `motion-design`, written in the repository, with a transitions criterion added to the `motion-review` grid
- Vendor the LottieFiles motion-design skill (MIT)
- Install a cinematic scroll skill such as `mustbesimo/cinematic-scroll-skill` (MIT)
- Extend `scroll-storytelling` with direction and transitions

## Decision outcome

Chosen option: "A project skill, `motion-design`, written in the repository", because no candidate covers scroll scenes, footage seams and section handoffs. The LottieFiles skill targets interface micro-interactions and contradicts the project's scrubbed timelines (it forbids linear motion and caps stagger totals at UI scale). The cinematic scroll skill overlaps `signature-experience` and `scroll-storytelling` and ignores the project's stack. Growing `scroll-storytelling` would mix direction with GSAP mechanics in one skill.

The skill writes `## Motion language` in `DESIGN.md` (an archetype, one easing family on the tokens of `packages/ui/src/motion/tokens.ts`, durations, travel, entries, exits, stagger, light and grade) and a `### Transitions` table per page. It also sets pacing, camera language and coherence across techniques, and gives a polish checklist. `signature-experience` gains a motion direction step before the storyboard. Storyboard blocks gain `Lead` and `Intensity` lines. `motion-review` gains boundary strips, a hard-cut list and an eleventh criterion, "Transitions and pacing", with the same 1 to 5 scale and the same pass rule. `cinematic-footage` requires chained shots for match cuts, and its noise dissolve is keyed to the light, the depth, the medium or the travel.

The four personality archetypes and the four-act structure are adapted from the LottieFiles skill (MIT, credited in the skill). The stage-to-flat seam patterns come from Codrops demos (MIT) as ideas only, with no code ported.

### Consequences

- Good, because every page gets one written motion language and a designed transition at each boundary, both checked frame by frame.
- Good, because the grid now fails an undesigned boundary, which the earlier ten criteria let pass.
- Good, because the existing skills keep their scope and only point to the new one.
- Bad, because a run writes two more blocks before the storyboard, and a review round scores one more criterion.
- Bad, because the durations, shares, parallax ratios and the eye-trace threshold are starting values, not measurements, and the hard-cut threshold rests on three recordings only.
- Bad, because adding a criterion changes the grid that `design-reviewer` and earlier reports used, so scores from before this ADR are not comparable.

## More information

- Skill: `.claude/skills/motion-design/SKILL.md` and its `references/`.
- LottieFiles motion-design skill: https://github.com/LottieFiles/motion-design-skill
- Codrops SeamTransitions: https://github.com/codrops/SeamTransitions
- Cinematic scroll skill: https://github.com/mustbesimo/cinematic-scroll-skill
- Related: ADR-0011 (GSAP and its plugins, CustomEase included), ADR-0024 (rendering arsenal), ADR-0026 (motion verification), ADR-0028 (autonomous mode).
- Revisit after the next autonomous runs, to tune the starting values, or if motion-review rounds show criterion 11 failing on boundaries the checklist does not describe.
