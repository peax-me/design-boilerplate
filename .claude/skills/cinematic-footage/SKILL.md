---
name: cinematic-footage
description: Generate AI footage with Magnific and drive it with the scroll inside the design system. Keyframes first, shots chained from last frame to first frame, seamless loops checked with SSIM, drafts before finals under the 30,000-credit page cap, AVIF frame sequences encoded with ffmpeg and avifenc (all-intra H.264 beyond 150 frames), drawn as textures in StageCanvas with noise-threshold dissolves between shots, 2.5D relief from a depth map, and the poster taken from the first frame. Use when a page needs a real place, a product in the world, a journey through spaces, scroll-driven video, an image sequence, a video loop behind content, or a still that moves in depth.
---

# Cinematic footage

Footage earns its place when the story needs a real place or a real object in the world: a camera that travels through a space, a product in its element, a journey from one world to the next. The scroll is the camera: the visitor drives the shot. A shader is cheaper for matter and light (`shader-craft`), particles explain a transformation (`gpu-particles`), and an object to inspect is a model (`scene-3d`). The boilerplate ships no footage: every shot is generated for its project.

## 1. When

| The story                                         | Footage                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| A journey through places (descend, fly, cross)    | Chained shots, one continuous camera move each, dissolved on scroll  |
| A product in its world                            | One scroll-driven shot around the product, keyframed at both ends    |
| An atmosphere behind copy                         | A seamless loop, playing on its own, with a pause control            |
| A still that should breathe                       | 2.5D relief from a depth map (§6), no video at all                   |

Avoid footage for anything a visitor must read or trust as real evidence: product UI comes from real screenshots, people presented as customers are never generated (`asset-production`).

## 2. Generate

Work in this order: shot list, keyframes, drafts, review, finals, review. Every paid call follows the budget rules at the end of this section.

**Shot list.** One row per shot: what the camera does (one continuous move: descend, push in, crane up, orbit), where it starts and ends, the beat of copy it carries, and its duration. Write moves that read both ways: a visitor scrolls back, and water pouring, people walking or smoke rising look broken in reverse, while a camera travelling through a still or slowly drifting world does not.

**Model.** Read the live catalog: `video_models_list` (`onlyRecommended: true` to start). Filter by capability first, then rank:

- Chaining and loops need start and end frames: the model must list `supportsStartFrame` and `supportsEndFrame` (`keyframes.start`, `keyframes.end`). Keyframes and `references[]` exclude each other (`prohibitedWith` in the catalog), so style consistency comes from the keyframe images themselves.
- Among the models that qualify, prefer `agentRecommendation.tier: "sota"`, then the lowest `rank`; copy the `slug` verbatim. Never pick a model, a resolution or a price from memory: the catalog and `simulate_cost` change.
- Drafts use the same model at its draft resolution (`Draft`, or the lowest listed in `resolutions`), so the draft predicts the final.

**Keyframes.** Design the boundary frames as stills first, they are cheap and fix the look: `images_models_list { onlyRecommended: true }`, then `images_generate` at the shot's aspect ratio, prompt assembled as in `asset-production` §4. The first keyframe of the first shot becomes the poster. Compose every keyframe with the subject inside the central 9:16 band, because phones see a centred portrait crop of the same frames (§3). The first approved keyframe is the style reference of the others.

**Prompt** each shot from the shot list, in plain sentences: the camera move with its speed, the subject, the light and its direction, the lens, the medium (water, cloud, dust), then the constraints. Set `cameraMotion` when the model lists it, `promptMode: "manual"` where the model offers it, no `multi_prompt` (one shot, no cuts), and leave sound off (`withSoundEffects` unset or false): the footage is silent.

```text
Camera: slow continuous descent through <space>, no cuts, steady speed, ends <end framing>.
Subject: <one concrete subject from the copy>. Light: <direction, quality, colour from DESIGN.md>.
Lens: <focal length feel, depth of field>. Medium: <particles, haze, caustics>.
Constraints: no text, no lettering, no logos, no screens with readable content, no captions, no watermark.
```

When the model supports `negativePrompt`, add `text, letters, logo, watermark, subtitles, cut, morphing`. Copy never lives in the video: it stays HTML, readable, translatable and accessible.

**Chaining.** The last frame of a shot is the first frame of the next: `video_metadata` (free) for the real duration, then `video_extract_frames { creationIdentifier, timestampsSeconds: ["last"], visible: false }` (free), and pass the returned still as the next shot's `keyframes.start` (`{ type: "image", url: <still identifier> }`), with the next designed keyframe as `keyframes.end`. Download each extracted still into the masters: it is the seam both shots must meet.

**Loops.** The same image as `keyframes.start` and `keyframes.end`, then measure the seam locally (§3): SSIM between the first and last frames ≥ 0.95. Below that, cut the clip at the frame closest to the first one, or generate again. Drop the last frame of a loop when it repeats the first, or the loop stutters on a doubled frame.

**Review before spending more.** Free tools, on every draft and every final:

- `video_view_frames { count: 16 }`: a contact sheet; check framing, light, the subject in the central band, the end frame.
- `video_analyze`, one question at a time: "Does any legible or pseudo text, logo or interface appear? Give timestamps." "Is there any cut, or is the camera move continuous?" "Do surfaces melt, flicker or morph?" On two to ten creations together: "Do these shots share light, colour and scale?"
- Two misses on one shot: rewrite the shot or its keyframes instead of generating again.

**Budget.** 30,000 credits per page, exploration, drafts and retries included; Magnific is the only paid provider.

- Price the whole plan before the first call: `simulate_cost` with the exact arguments of every keyframe, draft and final, plus one retry per final shot. If it does not fit, shorten shots, use fewer shots, or carry a beat with 2.5D relief (§6) instead of video.
- `simulate_cost` again before each paid call (arguments drift), then record the call and its credits in `assets/provenance.json` with the page's running total (`asset-production` owns the format). In an autonomous run, a call that would take the page past 30,000 is a hard stop (ADR-0028); in an interactive session, every paid call still waits for the user's yes.
- Download every result at once (`creations_register_download`, then save): result URLs expire.

## 3. Encode

Check the tools first: `avifenc --version` (and `cwebp -version`, `ffmpeg -version`); if missing, `brew install libavif webp ffmpeg`.

| Budget per stage, all shots included | Default                                   |
| ------------------------------------ | ----------------------------------------- |
| Frames                               | ≤ 150 AVIF frames; beyond, all-intra H.264 |
| Desktop                              | 1600 px wide, ≤ 6 MB                      |
| Mobile                               | centred portrait crop at the full 900 px height (506×900), ≤ 3 MB |
| Loop seam, chained seam              | SSIM ≥ 0.95                               |

```bash
master=assets/source/<feature>/<slot>/<shot>.mp4
frames=$(mktemp -d)                                   # PNG intermediates are never versioned
out=apps/web/public/media/<feature>/<slot>
count=150                                             # this shot's share of the stage's 150 frames
duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$master")
mkdir -p "$frames/landscape" "$frames/portrait" "$out/portrait"
ffmpeg -i "$master" -an -vf "fps=$count/$duration,scale=1600:-2:flags=lanczos" -frames:v $count "$frames/landscape/%04d.png"
ffmpeg -i "$master" -an -vf "fps=$count/$duration,scale=-2:900:flags=lanczos,crop=506:900" -frames:v $count "$frames/portrait/%04d.png"
for frame in "$frames"/landscape/*.png; do
  avifenc --speed 6 --qcolor 50 --yuv 420 --depth 8 "$frame" "$out/$(basename "${frame%.png}").avif"
done
for frame in "$frames"/portrait/*.png; do
  avifenc --speed 6 --qcolor 50 --yuv 420 --depth 8 "$frame" "$out/portrait/$(basename "${frame%.png}").avif"
done
cat "$out"/*.avif | wc -c; cat "$out"/portrait/*.avif | wc -c   # bytes against 6 MB and 3 MB
```

Over budget: lower `--qcolor` by 5 and encode again; at 35 and still over, use fewer frames rather than lower quality. Several shots in one stage share the 150 frames and the budgets: number each shot's frames in its own slot folder.

Beyond 150 frames, encode an all-intra H.264 clip (every frame a keyframe, so a seek in either direction is instant), at the same sizes and budgets:

```bash
ffmpeg -i "$master" -an -vf "scale=1600:-2:flags=lanczos" -c:v libx264 -preset slow -crf 23 -g 1 -bf 0 \
  -pix_fmt yuv420p -movflags +faststart "$out/<shot>.mp4"
```

Measure the seams:

```bash
ffmpeg -i "$master" -vf "select=eq(n\,0)" -frames:v 1 first.png
ffmpeg -sseof -0.5 -i "$master" -update 1 last.png
ffmpeg -i first.png -i last.png -lavfi ssim -f null - 2>&1 | grep -o "All:[0-9.]*"      # ≥ 0.95
# a loop below 0.95: the frame closest to the first, among the last 30
ffmpeg -i "$master" -loop 1 -i first.png -lavfi "[0][1]ssim=stats_file=ssim.log:shortest=1" -f null -
awk '{ for (i = 1; i <= NF; i++) if ($i ~ /^All:/) { split($i, value, ":"); print $1, value[2] } }' ssim.log \
  | tail -n 30 | sort -k2 -g -r | head -n 1                                              # cut there (-frames:v)
```

**Files.** Masters (MP4s, keyframes, extracted seam stills, depth maps, masks) in `assets/source/<feature>/<slot>/`, never shipped. Frames in `apps/web/public/media/<feature>/<slot>/NNNN.avif` and `…/<slot>/portrait/NNNN.avif`. Provenance: one entry per sequence (its folder, frame count and encoding command), pointing at its master and every Magnific creation behind it.

**Poster.** This skill owns video posters. The poster is frame `0001.avif` of the first shot, the very file the scene draws first. Encode that frame at `--qcolor 65` in both sets: it is the LCP and stays on screen the longest. Then copy it to `apps/web/src/features/<feature>/images/<slot>-poster.avif`, import it statically and pass it as the stage's `poster` with `loading="eager"` and `fetchPriority="high"`. Because the portrait frames are a centred crop at the same height, the same poster, framed with `object-fit: cover`, matches the portrait first frame too. The static export serves images unoptimised, so the poster is AVIF itself.

## 4. Load

- Frames load only inside the lazy scene, after the stage's own trigger: a phone that never interacts never downloads them, and Lighthouse measures the poster.
- The first frame is loaded by the scene through Suspense before it draws, so the first drawn frame is the poster's frame.
- Then coarse to fine: both ends first, then every 2^k-th frame down to every frame, six requests at a time, `priority: "low"`. The scrub works at once and sharpens while it loads; a missing frame shows its nearest loaded neighbour.
- Keep frames compressed in memory and decode them on demand with `createImageBitmap` (off the main thread), keeping about eight decoded frames around the playhead: a decoded 1600×900 frame weighs 5.8 MB.
- The frame set follows the stage's orientation when the scene mounts (portrait or landscape), not the quality tier: a landscape tablet is `light` but wide.
- URLs are built by the app with `process.env.NEXT_PUBLIC_BASE_PATH`.

## 5. Render

Start from `references/footage-scene.md`: the frame store, the dissolve shader, the scene and the video scrubber, verified against this repo's typecheck, lint and format and run in a browser. The contract of `shader-craft` §2 applies: an effect component composes `Stage`, the lazy scene renders a full-screen plane in `<StageCanvas flat>`, the page tweens a `{ value }` progress object in its `ScrollScene`.

- **Frames are textures.** Decode with `imageOrientation: "flipY"` and set `flipY: false` on the texture (three's flip does nothing on an `ImageBitmap`), `colorSpace: SRGBColorSpace`, `LinearFilter`, no mipmaps; upload only when the frame index changes.
- **The scroll places the playhead**: each shot owns an equal part of the progress, and the end of each part but the last dissolves into the next shot.
- **Dissolves are noise thresholds**, not crossfades: the next shot burns through the current one along an organic edge, with a slight refraction and a lit seam where they meet.

```glsl
float field = clamp(fbm(uv * vec2(uFrameAspect, 1.0) * 2.5 + uTime * 0.03) * 0.8 + 0.5, 0.0, 1.0);
const float EDGE = 0.12;
float threshold = mix(-EDGE, 1.0, uDissolve);              // 0: all current shot, 1: all next shot
float reveal = 1.0 - smoothstep(threshold, threshold + EDGE, field);
float seam = 1.0 - abs(reveal * 2.0 - 1.0);                 // 1 on the edge
vec2 bend = vec2(dFdx(field), dFdy(field)) * seam * 6.0;    // the edge refracts both shots
vec3 color = mix(texture(uShotA, uv + bend).rgb, texture(uShotB, uv - bend).rgb, reveal) * (1.0 + seam * 0.35);
```

The field is the FBM of `shader-craft` §4; `uv` comes from `coverUv`, so the canvas frames the footage exactly like the poster. Tint the seam with a token colour when the brand has one that suits light.

- **Beyond 150 frames**, the all-intra clip plays through a `VideoTexture` on a muted, inline, `preload="auto"` video that never plays: the scroll sets `currentTime`. Coalesce seeks (one at a time, always to the latest target) and mark the texture for update on `seeked`. On iOS Safari a muted inline video may show no frame until it has played once: check on a real device, and if so, `play()` it and pause it on `playing` before the first seek.
- **Idle life** for a scroll-driven stage is optional (it rests when the visitor rests). A loop plays on its own: mark its stage `ambient`, so the motion audit fails it if it freezes.

## 6. Relief 2.5D

A single still moves in depth: cheaper than video, and often enough for a secondary beat.

1. **Depth**: `images_depth_map { creationIdentifier }` on the still (grayscale, near is bright).
2. **Subject cut-out**: `images_remove_background` on the still: a transparent PNG of the subject.
3. **Filled background**: `images_segment { prompt: "<the subject>" }` for its mask, widen the mask by the largest shift, upload it (`creations_request_upload`, then `creations_finalize_upload`: local files take this route), then `images_retouch { mode: "erase", editType: "precise", maskCreationIdentifier }`: a plate where the subject was is now background, so nothing ghosts when the layers slide. Run `images_depth_map` again on the plate.

```bash
# widen the mask by the largest shift: sigma ≈ shift / 1.75 (28 grows it by 48 px, 3 % of 1600)
ffmpeg -i mask.png -vf "format=gray,gblur=sigma=28,lut=y='if(gt(val,10),255,0)'" mask-wide.png
# encode: plate as AVIF; cut-out keeps the colour under transparent pixels, or filtering draws a halo
avifenc --speed 6 --qcolor 60 --yuv 420 plate.png plate.avif
cwebp -q 85 -alpha_q 100 -exact subject.png -o subject.webp
# depth: softened so displacement does not tear, lossless so it does not ripple
ffmpeg -i depth.png -vf "format=gray,gblur=sigma=2" depth-soft.png && cwebp -lossless -exact depth-soft.png -o depth.webp
```

4. **Shift each layer by its depth**, at most 3 % of the width: `uParallax` is the smoothed pointer (mouse only, `gsap.quickTo`) or the scroll, within [−1, 1].

```glsl
vec2 parallax(sampler2D depthMap, vec2 uv, vec2 direction) {
  float depth = texture(depthMap, uv).r;                 // near = 1, far = 0
  return uv + direction * (depth - uFocus) * 0.06;       // |depth − focus| ≤ 0.5: at most 0.03 of the width
}
// plate = texture(uPlate, parallax(uPlateDepth, uv, uParallax)); subject over it with its alpha
```

Every Magnific step here is paid: quote it like any other call (§2).

## 7. Accessibility

- The poster carries the accessible name: its `alt` says in one sentence what the footage shows. The canvas is `aria-hidden` (the stage does it), and nothing essential lives in the footage.
- No text in the video, ever: check every draft with `video_analyze`. Copy over footage sits on the effect component's contrast veil (`shader-craft` §6).
- Reduced motion shows the poster and the `ScrollScene` still plates: the first frame of each shot, so the whole journey reads without motion.
- No more than three flashes in any second (WCAG 2.3.1): no lightning, strobing light or fast cuts; keep each dissolve over a stretch of scroll.
- A loop that plays on its own for more than five seconds next to content needs a pause control (WCAG 2.2.2); scroll-driven footage stops when the visitor stops. `Stage` has none yet: add it once, for every stage, through `design-system` (`shader-craft` §6).
- Silent: no audio track (`-an`), nothing that could autoplay sound.

## Avoid

- Stock-looking footage with no beat: a drone shot that could open any site.
- Text, logos or interfaces in generated video; real customers' faces.
- Models, resolutions or prices from memory; a paid call without `simulate_cost`; finals before an approved draft.
- Hard cuts inside a scroll shot, actions that read wrong in reverse, a camera that changes speed for no reason.
- More than 150 frames as AVIF, or a sequence over 6 MB on desktop or 3 MB on phones.
- Decoding every frame up front, or decoding on the main thread with `<img>` uploads.
- A first drawn frame that is not the poster: a black canvas fading in over the poster is the worst pop of all.
- 2.5D shifts beyond 3 % of the width, or a background plate without its subject removed.

## Reference skills

`asset-production` (quotes, provenance, prompts, delivery), `shader-craft` (stage contract, noise, contrast veil, poster rules for canvases), `scroll-storytelling` (beats and still plates), `scene-3d` (when a model beats footage), `threejs-textures` for the API (its vanilla set-ups give way to `StageCanvas`, see `AGENTS.md`), `motion-review` and the `design-reviewer` agent for judgement.
