---
name: signature-experience
description: Take a one-line brief or a client brief all the way to a verified premium animated landing page, autonomously. The run covers product context, direction, at least three signature concepts with the clichés eliminated, the technique family chosen by what the motion explains, the storyboard, the visual plan priced under the 30,000-credit page cap, and the code through the technique skills. It then runs motion-review, the design-reviewer agent, pnpm check, pnpm test:e2e and Lighthouse on mobile and desktop. Every decision is logged in DESIGN.md, and the run stops only at the two hard stops of ADR-0028. Use when the user hands over a brief and asks for a premium animated page, a signature experience or moment, "a site like the best studio templates", or a page built from brief to finish without check-ins.
---

# Signature experience

This skill takes a brief to a verified page with no one in the loop, at the level of a hand-made studio site or above. It owns the order of the steps, the autonomy rules and the deliverables. The method of each step lives in the skill it names and is not repeated here. Starting this skill from a brief is what makes a run autonomous (ADR-0028). Any other session keeps every human gate.

## Autonomy rules

- **Gates become self-checks.** Every approval, pick or interview in a skill this run calls becomes a self-check: decide, test the decision against that skill's own criteria, log it, go on. Answer interviews (`product-marketing`, `impeccable`) from the brief, `PRODUCT.md` and `.agents/product-marketing.md`, and log each assumption. Never ask and never wait: a pipeline that waits for a human has failed its purpose.
- **Two hard stops, and nothing else** (ADR-0028):
  1. **Spend.** A Magnific call that would take the page above 30,000 credits. The ledger in `assets/provenance.json` and the stop's message follow `asset-production` §3: stop before the call, and list the options priced, the cheaper one first.
  2. **Technology.** A technical decision outside the accepted ADRs: a library, tool, service, pattern or configuration that neither ADR-0024 to ADR-0027 nor an earlier accepted ADR covers. Look first for a route inside the arsenal that tells the same beat, and log the comparison. If none exists, write the ADR with `status: proposed` (`adr` skill), then stop and report what waits on it.

  Nothing else stops a run: an ambiguous brief, a claim without proof (rewritten as `landing-page` §4 says), an optional source that is unavailable, a failed review round, a red check that a fix can turn green. Each one is decided, logged, and the run goes on.
- **Arsenal ADRs not yet accepted.** If ADR-0024 to ADR-0028 are still `proposed` when the run starts, proceed: they define the arsenal this skill is built on and only wait for the user's acceptance. `pnpm check` then stays red on `adr:check` alone. It is the last step of the chain, so everything before it has passed. Say so in the final report. Never change an ADR's status. This is not hard stop 2, which concerns an ADR the run writes itself.
- **The journal.** Log each decision as one entry under `## Decisions` in `DESIGN.md`: the step, what was chosen, over which alternatives, and the test the others failed. Plans go under `## Page: <name>` in `### Storyboard` and `### Assets`, as their skills say. `DESIGN.md` holds choices and plans, never token values (`theme.css` holds them). The user must be able to audit the whole run from that file alone.
- **Resume.** After an interruption or a context reset, read `## Decisions`, the page section and the page's ledger entry, recompute `spent` from the entries (`asset-production` §3), and continue at the first step that has no record.

## Before step 1

- Read `AGENTS.md` (golden rules, known conflicts) and `docs/design/principles.md`. Work on a branch, never on `main`.
- Choose the route: the one the brief names, otherwise the home page `/`. The starter landing in `apps/web/src/features/home` pitches the boilerplate, not the client. Log the choice. Below, `<page>` is the route's feature name.
- Evidence that is not versioned goes in `.context/` (gitignored): `motion-review` writes to `.context/motion-review/<page>/`, and this skill to `.context/signature-experience/<page>/`.

## 1. Context

Run `project-kickoff` phase 1: `product-marketing` writes `.agents/product-marketing.md`, and `impeccable` `init` writes `PRODUCT.md`. In a workspace fresh from the boilerplate, both files describe the boilerplate itself, so rewrite them for the brief's product. Then `landing-page` §1 and §2: the four context lines (visitor, problem, outcome, primary action) and the message hierarchy, under `## Page: <name>`. The message comes first because the signature must carry one of its beats.

## 2. Direction

Run `design-inspiration` in its autonomous mode (§5): the board in `DESIGN.md` with its captures in `.context/`, two or three directions built with `impeccable` `shape`, the choice made by its four tests and logged. Then `design-system` "Retheme for a new project" turns the chosen direction into tokens and fonts (`project-kickoff` phase 3), and the Storybook review becomes a self-check. The direction's motion personality is the input of step 3.

## 3. Signature concepts

Write at least three concepts before choosing: the first idea is usually the category's default. For each one, a few lines:

- the beat it carries, and what the motion explains, in one sentence;
- the moment a visitor would retell, in one sentence;
- its technique family (§4);
- its first frame, which becomes the poster and the reduced-motion page, and its `light` version on a phone;
- the assets it needs, priced with `simulate_cost` (free) when it needs generation.

Eliminate the clichés first: the generic gradient blob, the generic particle sphere, the glowing hero orb and the bento grid (`motion-review` §3). Each one says nothing about a product, which is why every template has one. A new colour or name does not rescue them. Then test each survivor with four questions:

1. **Explains.** Without the motion, would the page lose information: a cause, a sequence, a transformation, a place?
2. **Specific.** Could no other brand in the category ship it unchanged?
3. **Holds when still and small.** Is the first frame a complete poster, and does the `light` tier keep the idea on a phone?
4. **Fits the bounds.** Does it stay inside the accepted arsenal, the motion budget of `scroll-storytelling` §1, and the page cap with room for retries?

Take the concept that passes all four. On a tie, take the one whose retold sentence names the product most directly. If none passes, rewrite the weakest once to fix its failed test, test again, and take the best score. Log every concept, the cliché or test that eliminated it, and the choice.

## 4. Technique family

Choose by what the motion explains, never by the most impressive technique:

| What the motion explains                  | Technique                                                |
| ----------------------------------------- | -------------------------------------------------------- |
| Matter, energy                            | `shader-craft`                                           |
| Transformation, assembly                  | `gpu-particles`                                          |
| A real place, a product in its world      | `cinematic-footage`                                      |
| An object or a space to inspect           | `scene-3d`                                               |
| A stylised data or AI atmosphere          | `shader-craft` looks (ASCII, dither, halftone, §5)       |
| A story carried by the text               | kinetic type of `scroll-storytelling` §5                 |

- A page has one signature and two or three scenes in all (`scroll-storytelling` §1). Never give two moments of the page the signature's family: a repeated technique reads as a template and doubles the cost. The other scenes use kinetic type, plain GSAP choreography or a different family.
- If a still or a short loop tells the same story, use it (`shader-craft` §1).
- The engine is WebGL2, and WebGPU is only for scenes past a million particles (ADR-0024; known conflicts in `AGENTS.md`).
- Log the family and the row of the table that justifies it.

## 5. Storyboard

Write the section plan of `landing-page` §3, then the storyboard of `scroll-storytelling` §3 in its autonomous mode: two or three scenes including the signature, recorded under `### Storyboard`, each with a complete final state. Run the self-check of `landing-page` §4 before any code.

## 6. Visual plan and quote

Run `asset-production` gates 1 and 2 in autonomous mode: the asset list under `### Assets`, the sourcing order, every paid call priced with `simulate_cost`, and the page's ledger opened with `cap: 30000` before the first paid call. The technique skills add their own rules: shots and drafts in `cinematic-footage` §2, models in `scene-3d` §2, shapes in `gpu-particles` §3. Plan the cheap route before quoting (`asset-production` §2), because the quote gate never re-plans. Hard stop 1 applies here and before every later paid call, retries included.

## 7. Code

- Tests come first (`tdd`).
- The signature's technique skill builds its effect component and lazy scene in `@repo/ui`, on the `Stage` contract (`shader-craft` §2). `scroll-storytelling` §4 and §5 build the scenes, `landing-page` §5 the sections, and `design-system` anything missing.
- Add the route to `apps/web/e2e/support/routes.ts` and to both Lighthouse configurations (`apps/web/AGENTS.md`).
- Capture the poster from the first frame (`shader-craft` §7).
- A library enters through the pnpm catalog under an accepted ADR (`shader-craft` §2). Anything else is hard stop 2.

## 8. Quality loop

In this order, each step starting once the one before passes:

1. `motion-review` on the signature scenes: the grid, five rounds at most.
2. The `design-reviewer` agent on the route, at its viewports and in both schemes. Fix every high and medium finding, and log the low ones you leave.
3. `pnpm check`.
4. `pnpm test:e2e`, which runs the design audit and the motion audit.
5. Lighthouse on mobile and desktop: `pnpm --filter @repo/web lighthouse`.

Rules:

- A fix that changes what moves or how it looks (a lighter scene for Lighthouse, a new poster, a re-timed scene) sends the loop back to step 1 for that scene. The five `motion-review` rounds count across the whole loop.
- Never skip, disable or loosen a test, a check or a threshold to pass: fix the cause.
- If the same failure survives three fixes, go back to the plan (concept, technique, asset weight) instead of patching again, and log why.
- If `motion-review` runs out of rounds without a pass, finish steps 2 to 5 and list the criteria still under 4 in the final report. This is not a stop.
- The loop is done when steps 2 to 5 pass in one sweep after the last change, and `motion-review` has passed or used its five rounds.

## 9. Deliverables

| Deliverable           | Where                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| The page              | The route in `apps/web`, exported as a static site as `AGENTS.md` "Deploy" describes (`apps/web/out/`)                      |
| Recordings            | `scroll-desktop.webm`, `scroll-phone.webm` and `pointer-desktop.webm` from the last round in `.context/motion-review/<page>/` |
| Contact sheets        | The sheets and strips of the same round, with `report.md`                                                                   |
| Lighthouse reports    | `apps/web/.lighthouseci/mobile/` and `desktop/`, copied to `.context/signature-experience/<page>/lighthouse/` after the last run, since the next run overwrites them |
| Decision journal      | `## Decisions` and `## Page: <name>` in `DESIGN.md`                                                                         |
| Spend                 | The page's `spent` against its `cap` in `assets/provenance.json`                                                            |

End with a short report to the user:

- the route, the chosen concept in one sentence and its family;
- the `motion-review` verdict and scores, and the frame times per tier;
- the Lighthouse scores on mobile and desktop, and the state of `pnpm check` and `pnpm test:e2e`, noting when `adr:check` alone is red because ADR-0024 to ADR-0028 await acceptance;
- the credits spent out of 30,000, and the paths above;
- every criterion under 4 or finding left open, with the reason.

## Plan only

When asked for the plan without producing anything, walk the same steps in the same order and write what each would decide and produce. Price the paid calls with `simulate_cost` (free) but make none, and write no code. Name the deliverables the run would hand over.

## Avoid

- Choosing the technique before the concept, or the concept before the message.
- A single concept, or a cliché kept because it was recoloured.
- The signature's family used twice on a page, or more than three scenes.
- Asking the user anything, or stopping for anything other than the two hard stops.
- Writing anything but `proposed` in an ADR, or a library without an accepted ADR.
- A paid call without its ledger entry.
- Calling the run done with a red check other than `adr:check` on the arsenal ADRs.
- Versioning recordings, sheets, traces or reference captures.
