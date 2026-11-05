---
name: motion-design
description: Direct how a page moves as one piece, before its storyboard. Write the motion language in DESIGN.md (an archetype, one easing family on the motion tokens, durations per kind of move, the direction of travel, entries, exits and stagger), design every boundary between sections and between shots in a `### Transitions` table (match cut, match on action, camera move through a cut, shared element, mask along the travel, luminance or depth reveal, smear, light leak, morph, overlapping ranges), choose one world behind normally scrolling copy or held scenes, pace the page in four acts with one lead per moment and rests between peaks, keep one smoothing layer between scroll and world, set the camera language for 3D and footage, hold shaders, particles, footage and DOM to one light, grade and personality, and hand `motion-review` a polish checklist verified frame by frame. Use before storyboarding scroll scenes, when a page's animations or transitions feel disconnected, generic or unpolished, when designing transitions between sections, scenes or shots, or when asked for motion direction, choreography, pacing or camera moves.
---

# Motion design

The technique skills build effects. This skill decides how the page moves as one piece: one motion language, a designed handoff at every boundary, a pace with peaks and rests, a camera that moves for a reason, and one world shared by every technique. Without it, a page can be correct effect by effect and still read as a row of demos: each scene with its own ease and its own light, and a straight edge between them.

## Scope

- **Owns** scenes and the handoffs between them, from about 0.4 s to several screens of scroll, the page's pace, the camera, and the coherence of techniques.
- **Does not own** components and micro-interactions. Buttons, menus, hover, the 300 ms caps, springs, origins and interruptibility belong to `emil-design-eng` and `review-animations`. On a component they win; on a scene this skill wins, because a scene's arrival is longer than any interface answer.
- **Decides, never builds.** It chooses the device and its placement. GSAP mechanics (`ScrollScene`, timelines, SplitText) stay in `scroll-storytelling`; recipes stay in `shader-craft`, `gpu-particles`, `cinematic-footage` and `scene-3d`; capture and scoring stay in `motion-review`.

## Conventions

| Name                           | Where                                                                     | Section |
| ------------------------------ | ------------------------------------------------------------------------- | ------- |
| `## Motion language`           | `DESIGN.md`, after the direction sections; one per project                | §1      |
| `### Transitions`              | `DESIGN.md`, under `## Page: <name>`, before `### Storyboard`             | §3      |
| `Lead:` and `Intensity:`       | each storyboard block of `scroll-storytelling` §3                         | §4      |
| Motion tokens                  | `packages/ui/src/motion/tokens.ts`, extended only through `design-system` | §1      |
| Boundary strips, hard-cut list | the `motion-review` round folder (`motion-review` §2.3)                   | §7      |
| Polish checklist               | §7, scored by `motion-review` criteria 4, 7, 10 and 11                    | §7      |

`DESIGN.md` records choices and names tokens; values live in `tokens.ts` and `theme.css`.

## 1. Motion language

One language per project: every scene, transition, camera move and pointer response obeys it. Write it right after the direction, whose words it takes, and before any concept is storyboarded. Every line is a choice a reviewer can check on a recording.

```markdown
## Motion language

- Personality: <archetype>; <three words from the direction>
- Material: <what the page moves like>; weight <light | medium | heavy>; overshoot <none | small>
- Travel: <axis and sense>, because <what the story moves through>
- Eases: signature `<token>`, settle `<token>`, exit `<token>`; `none` only for <values the scroll drives directly>
- Durations: element `<token>`, block `<token>`, scene arrival `<token>`, transition <share of the outgoing track>
- Spans and distances: scrubbed spans `<token>` in window heights; settle distance `<token>`, travel distance `<token>`
- Entry: from <upstream side>, by <transform | mask>, opacity alongside; exit: <ratio> of the entry, continuing <downstream>
- Stagger: `<token>` in <reading order>, each item overlapping the previous by <share>
- Rest: at least <screens> where only ambient moves, after every peak
- Pointer: lag `<token>`; <what follows the pointer, what never does>
- Light: key from <direction>, <colour temperature>; grade <black level, contrast, shadow tint>; grain <every stage | none>
- Never: <the feeling it refuses, in one word>; <moves the direction forbids>
```

Fill it from the tables of `references/motion-language.md`: archetypes, materials, durations per kind of move, eases per role.

- **Start from one archetype**, then adjust. Each of the four (premium, professional, energetic, playful) sets ease, overshoot, duration, stagger and favoured transitions together. Pick by the direction's words; never assemble values one by one, because separately chosen values mix personalities and the mix reads as nobody's.
- **One easing family.** A signature ease carries most tweens, a settle ease the supporting moves, an exit ease the exits. The ease is the most recognisable trait of a motion personality: two families on one page read as two authors.
- **Tokens only.** Each ease, duration, stagger, scrubbed span and travel distance names a token. Magic offsets and spans chosen scene by scene are the main source of mismatched rhythm, as much as durations. When the language needs a role the tokens lack (an exit ease, an overshoot settle, a `CustomEase` curve), add it through `design-system` and check the curve in the GSAP Ease Visualizer. A raw number is a value nobody reviewed, and the next scene will not reuse it.
- **Durations by kind of move**, not by element: element, block, scene arrival, transition, hold, rest. Distance scales duration inside the scale, so a move across the screen takes the longer step. The same kind of move at the same pace is what makes a page feel deliberate.
- **Travel has a motive.** One axis and sense, taken from what the story moves through: a descent, light entering from one side, a process that runs left to right. Entrances come from upstream, exits leave downstream, and counter-motion exists only between depth planes. A constant direction joins separate scenes into one journey; a reversal reads as going back. Derive every driven move from it: light paths, wipes, flows, particle drift, a shader's light path or flow, the camera. Copy is the exception: it settles in place in reading order, entering from the medium's side by the settle distance (a short one, about 8 to 16 px), because a long copy travel competes with the medium. To check, list every animated element with its direction: one against the travel needs a physical reason (gravity, reading order) or goes.
- **Exits are shorter and accelerate**: 60 to 70 % of the entry, ease-in, continuing the travel. The eye has already left an exiting element, and a slow exit holds attention on what no longer matters. A visitor can scroll back, so an exit must also read as an entry played in reverse.
- **Entries move by transform or mask**, with opacity alongside, never opacity alone. Opacity has no direction, so it cannot show travel.
- **One stagger interval** for lines and blocks across the page, in reading order, each item overlapping the previous. The characters of a short split may use the tight token. Rhythm is a repeated interval; several intervals read as noise.
- **The "never" line binds** the storyboard, the transitions and the camera. A personality is defined as much by what it refuses.
- **One archetype per page.** A single moment may borrow from another (a celebration at the action), never a whole scene, and the shift happens at a rest. A borrowed move reads as an accent only against a stable base.

## 2. Principles on a scrubbed timeline

The classic principles assume a played animation: a clock runs and the viewer watches. On a scrubbed timeline the scroll is the clock and the visitor holds the playhead: they stop on any frame, speed up, go back. A tween's duration becomes its share of the track, the scene's `length` sets the absolute pace, and the `scrub` token adds one lag to the whole timeline.

| Principle                     | Played animation                           | Scrubbed timeline                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anticipation                  | A small counter-move before the action     | A setup phase of 10 to 20 % of the beat: a dim, a gather, the copy settling, the camera's target moving first. A counter-move reads as a glitch when scrubbed back                                   |
| Follow-through and overlap    | Parts stop at different times              | The lead stops first and its support settles after it, phases overlapping by 30 to 50 % through the timeline's position parameter. `scrub` smoothing is shared by everything and replaces no overlap |
| Arcs                          | Natural paths are curves                   | A move between two points follows an arc (x and y on different eases, or a motion path); a camera path is a smooth curve with eased progress. Straight lines only for a mechanical personality       |
| Secondary action              | A supporting motion enriches the main      | The world answers the lead: light, shadow, a label, a counter. It starts after the lead, moves less, and never gets its own phase                                                                    |
| Staging                       | One idea per shot, the eye led by contrast | Any frame can become a rest frame, so every frame is composed, not only the keyframes. The lead sits in the clear area, away from the copy                                                           |
| Timing and spacing            | Timing is duration, spacing is the ease    | Timing is scroll distance, spacing is the ease inside it. Arrivals keep their ease inside a scrubbed timeline; `ease: "none"` only for a value the scroll drives at a constant rate                  |
| Exaggeration                  | Push beyond realism for clarity            | Only where the personality allows. An overshoot on a scrub comes back when the visitor scrolls up and reads as a wobble: keep overshoot to played moves                                              |
| Continuity, object permanence | Objects persist off screen                 | An element leaves where it will return; nothing vanishes by opacity mid-frame unless the story destroys it; something of each scene survives into the next                                           |

**One smoothing layer.** Between the scroll position and the world, exactly one layer smooths, or none: the `scrub` token, a `quickTo`, or the world's own spring or damping. Smooth scrolling moves copy and world together and opens no gap; every further layer adds its lag to the last, and stacked lags put the world visibly behind the copy it illustrates, so a block arrives over a state that has not formed. Which layer each setup keeps: `scroll-storytelling` §4.

**Scroll clocks are linear.** A value whose clock is the scroll (a wipe front, a shader's progress, a frame index) takes `ease: "none"` under the scrub. An in-out ease there squeezes a full-screen crossing into the curve's steep middle, a few dozen pixels of scroll, and it reads as a flash.

## 3. Transition grammar

A boundary is any place where the frame changes world: section to section, a stage to the flat section after it, shot to shot inside a stage, a change of scheme. Design each one before the storyboard and record it in the page's table:

```markdown
### Transitions

| From              | To                | Technique   | Carrier        | Direction        | Length                                                |
| ----------------- | ----------------- | ----------- | -------------- | ---------------- | ----------------------------------------------------- |
| <section or shot> | <section or shot> | <technique> | <what crosses> | <axis and sense> | <seconds, or share of the outgoing track and overlap> |
```

- **One row per boundary**, in page order, shot seams and scheme changes included. A `cut` row writes `none: <reason>` as its carrier. An undesigned boundary falls back to whatever the code does: a straight edge or a crossfade.
- **The carrier is visible on both sides**: on the last frame of the outgoing side and the first frame of the incoming one. It is an element, a colour field, the light or the camera's move. The carrier is what the eye follows across; without one, the boundary is a cut whatever its effect.
- **A carrier keeps its profile.** Rebuilt in another technique on the far side (a DOM line continuing a rendered beam, a DOM shape continuing a particle form), it matches angle, core, halo, falloff and colour token, not only position: a thin line continuing a glowing beam reads as a second object.
- **A carrier never crosses copy.** It lands at a corner of the text block or behind an opaque target, and on narrow screens, where stacked copy sits in its path, it keeps only its landing.
- **Length** is in seconds for a played transition, or a share of the outgoing track plus its overlap with the incoming one for a scrubbed transition.

### Techniques

| Technique                        | What crosses the boundary                                                                     | Fits when                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Match cut                        | A shape: same position, scale and screen direction on both sides                              | Two worlds rhyme (a round window, a round pupil); chained footage         |
| Match on action                  | A movement: the cut lands mid-move and the move continues at the same speed                   | A travel or a gesture carries from one world into the next                |
| Camera move through a cut        | The camera's path and speed, the world changing behind an occluder (cloud, water, dark)       | A journey through spaces                                                  |
| Shared element                   | One element travels and lands in the next layout (container transform)                        | The next section is about what this one introduced                        |
| Mask or wipe along the travel    | An edge moving in the travel direction, shaped by the story (horizon, beam, fold, water line) | A change of world or scheme; a stage giving way to a flat section         |
| Luminance- or depth-keyed reveal | The frame's own light or depth decides where the next frame appears first                     | Light stories (bright burns through first); worlds with a depth map or 3D |
| Motion-blur smear                | A blur along the camera's direction, peaking at the seam                                      | An energetic personality; a fast travel or a whip between framings        |
| Light leak                       | A wash of the key light, peaking at the seam                                                  | Footage with a warm or analogue grade; light stories                      |
| Morph                            | The subject's form interpolates in place: particles, an SDF, a word                           | A thing that becomes another                                              |
| Overlap of scroll ranges         | Time: the next scene starts while this one ends, copy or light leading (a J or L cut)         | Almost every scene-to-scene boundary, alone or under another technique    |

Placement, build owner and failure modes of each: `references/transition-grammar.md`. Between footage shots, a match cut, a match on action or a camera move through a cut needs chained shots (`cinematic-footage` §2).

### Stage to flat

The boundary most often left undesigned: a held `ScrollScene` releases and a rectangle of render slides away over a flat section. Resolve it inside the hold. The last 15 to 30 % of the outgoing track performs the transition while the stage is still held, so the frame that scrolls away already shows the next section's surface, scheme and light. Four patterns, alone or combined:

1. **Resolve the surface.** The stage grades or dissolves toward the next section's surface token, keyed on luminance, depth or the travel.
2. **Carry an element.** The stage's subject continues as the next section's first element.
3. **Mask along the travel.** The next surface wipes over the stage in the travel direction.
4. **Lead with the next copy.** The next section's first line arrives over the stage's last phase, on a ground that already matches it.

A straight edge between a rendered world and a flat page says the world was a box. When the stage's matter runs to its edge on the same ground, bands of the ground over the stage's edges dissolve it; they live in the markup, never in the shader, because the next stage may still show its poster as it arrives. The mechanics belong to `scroll-storytelling` §4.

### Scheme changes

A change of ground (dark to light, or the reverse) is a full-screen sweep inside the outgoing scene's hold that leaves the frame entirely on the next section's ground; the next section then rises on that ground, with no edge.

- **Never a static gradient band between two sections.** A diagonal front across a box of width W needs a band taller than W, or one of its corners already shows the next ground against the section above: a hard edge. A held, full-viewport frame frees the geometry.
- **At the end of the outgoing scene**, never at the start of the incoming one: there, the incoming scene scrolls in under its cover and the frame shows a screen of empty ground. Placed at the end, the incoming section's own content arrives right behind the front.
- **The front's leading edge takes the medium's colour**, so it reads as the medium arriving (light, a liquid, a material), not as a gradient.

Recipe: `scroll-storytelling` `references/section-handoffs.md`.

Between two flat sections: a shared axis for siblings (the steps of one sequence move along one axis), fade through for unrelated content (out completely, then in, never superimposed), a container transform for one object that grows into a section.

### When a plain cut is right

- Between two flat sections of one scheme with nothing to carry: a device there is decoration.
- From a rest into a rest, where the page's rhythm already marks the change.
- Into the action section, where the calm is the point.
- Once per page, for a shock the story asks for, written as such in its row.

### Forbidden defaults

- **An unrelated crossfade**: two images that share nothing, superimposed at partial opacity. For the length of the fade the frame is mud and the eye has no anchor. A dissolve between frames that already match (the poster into the canvas, a match cut softened over a few frames) is not this.
- **A generic noise dissolve**: isotropic noise with no direction and no link to the subject, which reads as a shader preset. The same threshold mechanism is allowed once its field is keyed to the light, the depth, the medium or the travel.
- **A hard cut from a WebGL stage to a flat section**: the stage's rectangle sliding off, or a flat surface rising under a straight edge. Use the patterns of "Stage to flat".

### Editing rules from film

- **Murch's rule of six, in priority order**: emotion, story, rhythm, eye-trace, the two-dimensional plane of the screen, the three-dimensional space of the action. When two clash, sacrifice from the bottom. A seam may break spatial continuity if it keeps the feeling, the beat and the pace, because viewers forgive a jump in space long before a break in feeling or story.
- **Screen direction (the 180° rule).** A subject, the camera and the travel keep their screen direction across a boundary. Reverse it only when the story turns back, and say so in the row; otherwise a reversal reads as a return or a mistake.
- **Eye-trace and eyeline.** The incoming focal point sits where the eye is at the end of the outgoing side, within about 15 % of the frame. When a subject looks or points, the next frame shows what is there. A cut that makes the eye jump across the frame reads as a jolt; one that meets it reads as continuity.
- **Cut on movement.** A seam inside a movement is invisible; a seam at rest is seen. Place every transition in the moving part of its range, never inside a reading hold, because the eye tracks the motion and does not check what changed behind it. Footage paces its film so seams fall where the camera travels fastest and slows where copy is read (`cinematic-footage` §5).

## 4. Choreography and pacing

### One world or held scenes

Choose before the storyboard, and log the choice.

- **One world**: one stage mounted once, fixed behind the whole page, copy scrolling in normal flow over it, each block of copy a state of the world, held while it is read. Choose it when the story is one continuous subject (one material, one place, one cloud of points, one object) seen in several states. Every handoff becomes a morph of the same subject, so a cut is impossible; there are no held tracks, no layout shift from holding, and one canvas and one trigger for the page.
- **Held scenes**: separate `ScrollScene`s, each with its own stage. Choose them when the scenes are different subjects or techniques. Two canvases cannot hand anything to each other, so every boundary between them needs its row and a carrier.
- **Every section gets a state** in one world, reading sections included: a quiet state (laid down, dimmed, at an edge) keeps the world present without competing with the copy.
- **Bookend**: the closing block can return to the first state, in the same place with the copy on the same side, so one motion closes the page with no new composition.

The build: `scroll-storytelling` §4, "One world".

### One lead per moment

- **Lead, support, ambient.** In any frame one element leads: it moves first and farthest, and it carries the beat. Support (a label, light, shadow, a counter) follows with overlap and moves less. Ambient stays at the edges, slow enough to read over. Two leads split the eye, and the visitor remembers neither.
- **Name the lead** of each phase in the scene's storyboard block (`Lead:`). A phase whose lead cannot be named is either a hold or a defect.

### Beats, holds and rests

- **Four acts per scene**: setup (10 to 20 % of the track), action (30 to 40 %), reaction (10 to 20 %: the secondary action, the world answering) and resolution with its hold (25 to 35 %). The structure is adapted from the LottieFiles motion-design skill (anticipation, action, reaction, resolution) and scaled from interface milliseconds to screens of scroll.
- **Reading holds.** Copy never moves while it is read: it is fully in before the lead's action and holds still through the hold.
- **A named action plays while it is read.** A block whose copy names a state holds that state. A block whose copy names an action (the parts join, the colour fills in, the shape splits) plays that change while it is on screen, over a reading window about twice as long as a hold. With holds only, the action happens between two blocks, while no copy is on screen, and the reader arrives at the sentence once the action is over. Two blocks of copy are never readable at once; a swap is sequential, the old block fully out before the next is in. Moving or superimposed text cannot be read, and ghosted copy is the most visible sign of an unedited page.
- **Rests.** After every peak comes a stretch of scroll where only ambient moves, at least the language's `Rest`. Without a rest, the next peak has nothing to rise from.

### Crescendo and release

- Score each scene's intensity from 1 (still) to 5 (the signature's peak) in its storyboard block (`Intensity:`).
- The page builds to its signature and releases after it. Two scenes at 4 or 5 always have a section at 2 or less between them, because intensity is relative and a page at 5 everywhere has no peak.
- Echo scenes reuse the signature's carrier, colour or direction at a lower intensity, which makes the signature the page's theme rather than one effect among several.

### Four acts across the page

| Act             | Role on the page                                                                  | Intensity | Share of the scroll |
| --------------- | --------------------------------------------------------------------------------- | --------- | ------------------- |
| 1. Anticipation | The first viewport: a complete poster, the promise, a held tension                | 2         | 10 to 15 %          |
| 2. Action       | The signature: the peak                                                           | 5         | 35 to 45 %          |
| 3. Reaction     | Echo scenes and proof: the consequences, smaller, reusing the signature's carrier | 2 to 3    | 25 to 35 %          |
| 4. Resolution   | The action section: still, one button; its frame may answer the first viewport    | 1         | 10 to 15 %          |

When the signature is the hero, act 1 is its first frame and its setup phase. All shares are starting values to tune against the recording.

## 5. Camera language

For 3D scenes, footage, 2.5D relief and DOM parallax. No camera move without a motive written in the storyboard.

- **Motives**: follow (a subject moves and the camera keeps it), reveal (the move uncovers what the beat names), reframe (the move brings the next focal point into place), travel (the journey is the story). A move without one is decoration and competes with the copy.
- **Dolly or zoom.** A dolly moves the camera: planes separate, parallax grows, the visitor is there. A zoom changes the focal length: everything scales together and nothing separates, which reads as scrutiny or a slideshow. Dolly for journeys, zoom for emphasis, never both in one shot without a reason; a dolly-zoom is a deliberate vertigo beat.
- **Focal length feel.** Wide (24 mm, about 53° vertical) exaggerates depth and speed; normal (35 to 50 mm, 38° to 27°) feels natural; long (85 mm, about 16°) compresses distance and calms. A 3D camera's vertical field of view is 2 × atan(12 / focal length in mm) for a 24 mm sensor height. Every footage prompt names its lens (`cinematic-footage` §2).
- **Parallax layers.** Speed ratios by depth, as starting values: foreground 1, middle 0.5, background 0.2, three or four layers at most. More layers blur into a smear; fewer read flat.
- **At rest at both ends, one speed between.** A shot eases in at its start, eases out at its end and keeps one speed in between, because a surge mid-shot reads as a mistake. A shot that continues through a cut keeps its speed at that end so the seam does not stutter; only the journey's first and last ends ease.
- **Along the travel.** The camera moves in the language's direction of travel; a counter-move needs a reason in the storyboard.
- **The target leads.** When the camera turns, its look-at target moves first and the camera follows, a small anticipation that makes the move feel aimed.
- **No unmotivated shake, roll or orbit.** Shake and roll need an energetic personality and a beat that asks for them; an orbit needs an object the visitor inspects.

## 6. Coherence across techniques

When shaders, particles, footage, 3D and DOM share a page, four things hold them together. Each is written in the language and checked side by side on the recording.

- **One light**: one key direction and colour temperature (`Light:`). Shader lights, particle shading, 3D lights and the rotation of the HDRI, footage prompts and keyframes, relief shading, and the DOM's gradients and veils all agree. Light from two directions reads as two composited worlds.
- **One grade and one grain.** One black level, contrast curve and shadow tint across stages, from shared post settings (`shader-craft` §5, §6), with footage keyframes graded to the same palette before generation. Grain comes from one recipe (`shader-craft` §4), at one size and amplitude on every stage, or on none. A lifted black or a finer grain beside a deep one shows the seam between techniques.
- **One palette from tokens.** Every colour, light and seam tint resolves from `theme.css` at runtime, so a scheme swap recolours everything at once and nothing drifts.
- **One personality.** Shader uniforms, particle springs, camera paths and DOM tweens take the same eases and the same travel; a particle spring settles in about the language's block arrival. Visitors feel the motion before they notice the technique.
- **Scheme changes are transitions.** A page that crosses from dark to light does it once or twice at most, at a motivated moment (night to day, inside to outside), with its row in `### Transitions` and the sweep of §3. An unmotivated flip breaks the world more than any cut.

## 7. Polish checklist

Each check is observable on the captures of `motion-review` §2 and feeds a criterion of its grid. Boundary strips and the hard-cut list come from `motion-review` §2.3. Thresholds are starting values.

| #   | Check                                                                                                                       | Evidence                                                                                                                    | Criterion |
| --- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Every boundary and shot seam has a row in `### Transitions`                                                                 | The table against the page's sections and the stage's shots                                                                 | 11        |
| 2   | The carrier is on the outgoing side's last frame and on the incoming side's first frame                                     | Boundary strip                                                                                                              | 11        |
| 3   | No forbidden default: no unrelated images superimposed, no undirected noise mid-dissolve, no stage edge over a flat section | Middle frames of each boundary strip                                                                                        | 11        |
| 4   | No unplanned hard cut                                                                                                       | Every time on the hard-cut list matches a `cut` row                                                                         | 11        |
| 5   | Screen direction holds across every boundary, or the row gives the reason                                                   | The lead's direction on both sides of the strip                                                                             | 11        |
| 6   | The incoming focal point lies within about 15 % of the frame from where the outgoing one ended                              | The strip's last outgoing and first incoming frames, side by side                                                           | 11        |
| 7   | Shot seams are invisible: SSIM ≥ 0.95 at a match cut or a chained seam, or a device covers it                               | `cinematic-footage` §3 seam measure; the seam's strip                                                                       | 11        |
| 8   | A rest separates the peaks, on paper and on screen                                                                          | `Intensity:` lines; sheet tiles over the rest show only ambient motion                                                      | 11        |
| 9   | Copy holds still while read, and two copy blocks are never readable at once                                                 | Sheet tiles at holds; strips over every copy swap                                                                           | 11        |
| 10  | Every arrival decelerates into rest                                                                                         | Arrival strip: the spacing shrinks to the last frame                                                                        | 4         |
| 11  | One lead per frame; support moves after it and less                                                                         | Sheet: in each tile one element is clearly ahead                                                                            | 4         |
| 12  | Camera moves start and end at rest, with one speed between                                                                  | Strip over the shot: even spacing in the middle, shrinking at both ends                                                     | 4         |
| 13  | Every ease, duration and stagger is a token named by the language                                                           | `grep -rn -e ease -e duration -e stagger apps/web/src/features/<page>` and the scenes it uses, against `## Motion language` | 7         |
| 14  | Entrances come from upstream and exits leave downstream; counter-motion only between depth planes                           | Arrival and boundary strips                                                                                                 | 7         |
| 15  | One light, one grade, one grain across techniques                                                                           | The hold tile of every scene, side by side: key direction, black level, grain size                                          | 7         |
| 16  | Reduced motion keeps the hierarchy: the still plates show each beat's lead, in order                                        | Reduced-motion screenshots (`motion-review` §2.5)                                                                           | 10        |

## 8. Process

1. **Read** the direction, the message hierarchy and the section plan (`landing-page` §2, §3), and the chosen concept and technique family (`signature-experience` §3, §4).
2. **Language.** Write `## Motion language` when the project has none. Otherwise obey it, and change it only as a logged decision.
3. **Transitions.** List the page's sections and shots in order, and write `### Transitions`: one row per boundary with its technique, carrier, direction and length. Then give each scene its intensity (§4).
4. **Storyboard** with `scroll-storytelling` §3. Each block's first and last phases carry its rows, and it names its `Lead:` and `Intensity:`. A footage shot list follows the rows (`cinematic-footage` §2): a match cut designs the keyframes on both sides of its seam.
5. **Build** through `scroll-storytelling` §4 and the technique skills.
6. **Record** with `motion-review` §2, boundary strips and the hard-cut list included.
7. **Inspect every boundary frame by frame** against §7: the strip first, then every frame of its span when the strip leaves a doubt.
8. **Fix** at the source and record again. A fix at a boundary can break the pace, so run the whole checklist each round.

**Self-check before the storyboard.** An autonomous run (`signature-experience`) logs it under `## Decisions`; an interactive session shows the language and the table with the storyboard for approval.

- Every line of the language is filled, and every ease, duration and stagger names a token.
- The travel names its motive, and no row contradicts the "never" line.
- Every boundary has a row, none uses a forbidden default, and every `cut` row gives its reason.
- Every match cut, match on action or camera move through a cut between footage shots has chained shots.
- The intensity map rises to the signature and puts a rest between peaks.

## Avoid

- A storyboard written before the language and the transitions table.
- Scenes that each bring their own ease, light or grain.
- A boundary left to the code's default: a crossfade, a noise preset, a stage sliding off as a box.
- Two leads in one frame, copy moving while it is read, two copy blocks readable at once.
- A camera move without a motive, a speed change inside a shot, a zoom where the story travels.
- Overshoot on a scrub.
- A raw number in a choreography where a token belongs.
- A scheme flip without its row and its reason.
- A reference's look instead of its principle (`design-inspiration`).

## Sources and licences

Ideas are paraphrased and adapted; no text or code is copied.

- LottieFiles, [motion-design-skill](https://github.com/LottieFiles/motion-design-skill) (MIT, © 2025 LottieFiles): the four personality archetypes and the four-act structure, rewritten for scroll scenes and this project's tokens.
- Frank Thomas and Ollie Johnston, _The Illusion of Life_ (1981); Issara Willenskomer, [UX in Motion Manifesto](https://medium.com/ux-in-motion/a87a4584ddc); Val Head, _Designing Interface Animation_ (2016): the principles of §2.
- Walter Murch, _In the Blink of an Eye_ (2001): the rule of six. Continuity editing, match cut, match on action, split edit and the 180-degree rule as described on Wikipedia (CC BY-SA 4.0).
- [Material motion](https://m2.material.io/design/motion/the-motion-system.html) (shared axis, fade through, container transform), [Carbon motion](https://carbondesignsystem.com/elements/motion/overview/) and [Fluent 2 motion](https://fluent2.microsoft.design/motion): patterns between flat sections, hierarchy and stagger.
- Codrops demos, MIT: [SeamTransitions](https://github.com/codrops/SeamTransitions) and [Interlude](https://github.com/codrops/interlude), with the article "From Shader Uniforms to Clip-Path Wipes" (2026): the stage-to-flat seams, and GSAP owning the curve of a stateless shader. Technique ideas only, no code ported.
- GSAP [Eases](https://gsap.com/docs/v3/Eases/) and [CustomEase](https://gsap.com/docs/v3/Eases/CustomEase), under the GSAP Standard License.

## Reference skills

`scroll-storytelling` (budget, storyboard, `ScrollScene`, kinetic type), `emil-design-eng` and `review-animations` (components), `shader-craft`, `gpu-particles`, `cinematic-footage` and `scene-3d` (techniques), `motion-review` (capture and grid), `design-system` (tokens), `signature-experience` (the order of a run), `gsap-timeline` and `gsap-plugins` (Flip, CustomEase).
