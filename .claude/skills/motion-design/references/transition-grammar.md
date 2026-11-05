# Transition grammar

Placement, build owner and failure modes for each technique of `motion-design` §3. This file decides the device; the recipes live in the skills it names. Shares of a track are starting values.

## Match cut

- **What:** the outgoing side's last frame and the incoming side's first frame share a shape, its position, its scale and its screen direction. Only the content changes.
- **Placement:** in the moving part of the lead's move, never at a hold. Scrubbed, the swap is instant or a dissolve over matched frames lasting at most 5 % of the track.
- **Build:** footage designs the end keyframe of shot A on the shape of shot B and chains the shots (`cinematic-footage` §2), then measures the seam (§3). In the DOM, the shape in section B sits on the rectangle where the shape of section A ends (`scroll-storytelling` §4).
- **Fails when** the shapes differ by more than about a tenth in position or scale, which reads as a jump, or when the screen direction flips.

## Match on action

- **What:** the cut lands during a movement, and the movement continues on the other side at the same speed and in the same direction.
- **Placement:** in the fastest part of the move, the middle of its ease, never at its start or its end.
- **Build:** footage generates both sides with the same move and speed, chained from the finalized last frame. Particles and 3D carry the velocity across the morph.
- **Fails when** the speed changes at the cut, or the move stops just before it.

## Camera move through a cut

- **What:** the camera keeps its path and speed while the world changes behind an occluder that fills the frame at the seam: cloud, water, rock, darkness, a passing object.
- **Placement:** the occluder covers the frame at the seam; the cut happens behind it.
- **Build:** footage designs the seam keyframe almost filled by the medium and chains the shots; a shader can add a passing layer of mist in post (`shader-craft` §5).
- **Fails when** the camera slows at the seam, or the occluder appears only for the seam, unmotivated by the world.

## Shared element

- **What:** one element (a product, a headline, a colour field, a line) leaves the outgoing layout and lands in the incoming one. Material calls it a container transform.
- **Placement:** it leaves in the outgoing side's last phase and lands by the incoming side's first hold, on an arc, in the travel direction.
- **Build:** one scene whose timeline spans the boundary, or Flip between two layouts (`gsap-plugins`, `scroll-storytelling` §4).
- **Fails when** it changes size, aspect and content at once mid-flight, or when two copies are visible at the same moment.

## Mask or wipe along the travel

- **What:** the incoming side is uncovered through an edge that moves in the travel direction. The edge takes its shape from the story: a horizon, the edge of a beam, a fold, a water line.
- **Placement:** 15 to 30 % of the outgoing track; the edge decelerates into the far side of the frame.
- **Build:** a `clip-path` tween in the DOM (`emil-design-eng`, clip-path); in a shader, a threshold field biased by a gradient along the travel axis, with GSAP tweening the uniform and the shader holding no state (`shader-craft` §3).
- **Fails when** the edge runs against the travel, a straight edge stands where the world offers a shape, or the edge sits still during a hold.

## Luminance- or depth-keyed reveal

- **What:** the frame's own luminance (light burns through first) or depth (near first, or far first) sets where the incoming frame appears first.
- **Placement:** like a mask, over 15 to 30 % of the track; the soft edge travels from the brightest or nearest areas outward.
- **Build:** the threshold dissolve of `cinematic-footage` §5 with its field taken from the outgoing frame's luminance or from a depth map (`cinematic-footage` §6 makes one), plus a little noise for texture.
- **Fails when** the outgoing frame has a narrow luminance range, so the whole frame flips at once. Check its histogram, and add a gradient bias along the travel.

## Motion-blur smear

- **What:** a fast move blurs the outgoing frame into the incoming one along the camera's direction; the blur peaks at the seam and clears on the incoming side.
- **Placement:** a short span, 5 to 10 % of the track, centred on the seam.
- **Build:** a directional blur in post (`shader-craft` §5), its strength driven by the transition's progress and peaking at the middle. Never a CSS blur on large areas: it repaints every frame.
- **Fails when** the blur runs in another direction than the move, or when it appears on a calm personality.

## Light leak

- **What:** a wash of the key light crosses the seam and recedes on the incoming side, hiding the change at its peak.
- **Placement:** centred on the seam; it enters from the language's key-light side.
- **Build:** an additive gradient in post, its colour from a theme token, eased up then down.
- **Fails when** it flashes: the luminance rise stays gradual, with never more than three flashes in any second (WCAG 2.3.1). It also fails when it comes from the side opposite the key light.

## Morph

- **What:** the subject's form interpolates in place: particles regroup, two SDFs blend, a mesh morphs, a word becomes another. Not the editing tool called morph cut.
- **Placement:** the signature move of its scene, with holds on each shape (`gpu-particles` §6).
- **Build:** `gpu-particles` for silhouettes, `shader-craft` for SDF blends, the word cycle of `scroll-storytelling` §5 for words.
- **Fails when** the middle frame has no readable silhouette (check the frame at 50 %), or when position and form change at once.

## Overlap of scroll ranges

- **What:** the incoming scene starts while the outgoing one ends. The incoming copy or light leads into the outgoing side's last phase (a J cut), or the outgoing ambient lingers into the incoming side's first phase (an L cut).
- **Placement:** the incoming side starts at 70 to 80 % of the outgoing track; the overlap is 10 to 20 % of the range.
- **Build:** the outgoing choreography's last phase brings in the incoming carrier, or the incoming scene's first phase keeps the outgoing ambient (`scroll-storytelling` §4).
- **Fails when** the overlap holds two leads, or two blocks of copy are readable at once.

## Stage to flat

`motion-design` §3 gives the four patterns: resolve the surface, carry an element, mask along the travel, lead with the next copy. They are adapted from the hero-to-page seams of Codrops SeamTransitions (MIT): technique ideas only, no code ported. The common rule is that the transition happens inside the outgoing track while the stage is held, so the release moves a frame that already matches what follows.

## Between flat sections

Patterns from Material motion, paraphrased:

- **Shared axis:** siblings in one sequence (steps, chapters) enter and leave along one axis, the travel's.
- **Fade through:** unrelated content fades out completely, then the next fades in. Never superimposed, so it is not the forbidden crossfade.
- **Container transform:** one element grows into the next section.
