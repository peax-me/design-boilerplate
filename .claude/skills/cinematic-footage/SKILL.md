---
name: cinematic-footage
description: Generate AI footage with Magnific and drive it with the scroll inside the design system. Keyframes first, drafts finalized into the same shot, shots chained from the last frame of the finalized shot, seamless loops and seams checked with SSIM, under the 30,000-credit page cap; AVIF frame sequences encoded with ffmpeg and avifenc (all-intra H.264 beyond 150 frames), loaded coarse to fine in one queue per stage, drawn as textures in StageCanvas as one film paced by the scroll, chained seams blended over a few held frames keyed by light with a push and speed-driven motion blur, unchained seams dissolved as the page's transitions table says; 2.5D relief from a depth map; the poster taken from the first frame. Use when a page needs a real place, a product in the world, a journey through spaces, scroll-driven video, an image sequence, a video loop behind content, or a still that moves in depth.
---

# Cinematic footage

Footage earns its place when the story needs a real place or a real object in the world: a camera that travels through a space, a product in its element, a journey from one world to the next. The scroll is the camera: the visitor drives the shot. A shader is cheaper for matter and light (`shader-craft`), particles explain a transformation (`gpu-particles`), and an object to inspect is a model (`scene-3d`). The boilerplate ships no footage: every shot is generated for its project.

## Workflow

1. Shot list and beats with `scroll-storytelling`, every seam designed with `motion-design` §3; quote the whole plan (§2 Budget).
2. Keyframes, then drafts, review, finalize, chain the next shot (§2).
3. Encode, check budgets and seams, place the poster and the still plates (§3).
4. Build the stage from `references/footage-scene.md`, and from `references/chained-seams.md` when the shots are chained (§4, §5); tests and shader checks from `shader-craft` §8.
5. Measure on a real GPU at both tiers, then `pnpm test:e2e` and Lighthouse.

## 1. When

| The story                                         | Footage                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A journey through places (descend, fly, cross)    | Chained shots, one continuous camera move each, joined as `### Transitions` says          |
| A product in its world                            | One scroll-driven shot around the product, keyframed at both ends                         |
| An atmosphere behind copy                         | A seamless loop: a plain video loop component, or an ambient stage when it needs WebGL    |
| A still that should breathe                       | 2.5D relief from a depth map (§6), no video at all                                        |

**Two routes for a loop.** A loop that only plays is a plain video: the loop component of `asset-production` (MP4 and WebM, its poster, `muted`, `playsInline`, its own pause control, the poster alone under reduced motion) owns it. This skill only generates it (§2); `asset-production` §6 encodes it with its poster and §7 ships it. A loop that needs a WebGL treatment (a dissolve into another shot, a shader grade, a pointer response) is an `ambient` stage built here, with frames drawn as textures and `Stage`'s pause control.

Avoid footage for anything a visitor must read or trust as real evidence: product UI comes from real screenshots, people presented as customers are never generated (`asset-production`).

## 2. Generate

Work in this order: shot list, keyframes, drafts, review, finalize, review, chain. Every paid call follows the budget rules at the end of this section.

**Shot list.** One row per shot: what the camera does (one continuous move: descend, push in, crane up, orbit), where it starts and ends, the beat of copy it carries, and its duration. Write moves that read both ways: a visitor scrolls back, and water pouring, people walking or smoke rising look broken in reverse, while a camera travelling through a still or slowly drifting world does not.

**Seam design.** Each seam between two shots has its row in the page's `### Transitions` before any keyframe, because the row designs the keyframes (`motion-design` §3). A match cut puts the same composition, scale and screen direction on both sides of the seam. A match on action, or a camera move through a cut, keeps the same move and speed across it, so the shot does not ease at that end. The lens and the move follow the camera language of `motion-design` §5.

**Model.** Read the live catalog: `video_models_list` (`onlyRecommended: true` to start). Filter by capability first, then rank:

- Chaining and loops need start and end frames: the model must list `supportsStartFrame` and `supportsEndFrame` (`keyframes.start`, `keyframes.end`). Keyframes and `references[]` exclude each other (`prohibitedWith` in the catalog), so style consistency comes from the keyframe images themselves.
- Among the models that qualify, prefer `agentRecommendation.tier: "sota"`, then the lowest `rank`; copy the `slug` verbatim. Never pick a model, a resolution or a price from memory: the catalog and `simulate_cost` change.
- Prefer a model whose `resolutions` list `Draft`: a draft at that resolution can be finalized into the same shot (below).
- This ranking supersedes the model order that ADR-0027 records (Seedance 2.5 first, from the catalog of 2026-11-04): the live catalog decides.

**Keyframes.** Design the boundary frames as stills first, they are cheap and fix the look: `images_models_list { onlyRecommended: true }`, then `images_generate` at the shot's aspect ratio, prompt assembled as in `asset-production` §4. The first keyframe of the first shot becomes the look of the poster. Compose every keyframe with the subject inside the central 3:4 band, because phones see a centred 3:4 crop of the same frames (§3). The first approved keyframe is the style reference of the others.

**Prompt** each shot from the shot list, in plain sentences: the camera move with its speed, the subject, the light and its direction, the lens, the medium (water, cloud, dust), then the constraints. Set `cameraMotion` when the model lists it, `promptMode: "manual"` where the model offers it, no `multi_prompt` (one shot, no cuts), and leave sound off (`withSoundEffects` unset or false): the footage is silent.

```text
Camera: slow continuous descent through <space>, no cuts, steady speed, ends <end framing>.
Subject: <one concrete subject from the copy>. Light: <direction, quality, colour from DESIGN.md>.
Lens: <focal length feel, depth of field>. Medium: <particles, haze, caustics>.
Surface: clean image, no film grain, no noise (grain is added in the shader).
Constraints: no text, no lettering, no logos, no screens with readable content, no captions, no watermark.
```

A shot that crosses a seam is written as one physical move through what joins the two spaces: the camera flies into the dark opening and the opening becomes the next space around the lens, or it glides toward the bright gap and passes through into the open. Say that it is physically travelling. A prompt that describes two places invites the model to cut or morph between them.

When the model supports `negativePrompt`, add `text, letters, logo, watermark, subtitles, cut, morphing, crossfade, dissolve, double exposure, film grain`. Copy never lives in the video: it stays HTML, readable, translatable and accessible. Grain never lives in it either: grain baked into frames multiplies their weight (§3), while the grain recipe of `shader-craft` §4 costs nothing.

**Drafts, then the same shot in full quality.**

- Generate the draft with `resolution: "Draft"` and the exact keyframes, prompt and duration of the final.
- Review it (below). When it is right, `video_finalize_draft { identifier }` renders that very shot at final quality, within 14 days of the draft. Never call `video_generate` again for the final: it makes a different video, and the review no longer holds. A second finalize of the same draft returns the existing final without billing again.
- On a model without `Draft`, a low-resolution take only previews the motion: the final is a new generation, so review the final as a fresh take.

**Chaining.** The last frame of a finalized shot is the first frame of the next, so finals are made one shot at a time:

1. `video_metadata` (free) on the finalized shot for its real duration.
2. `video_extract_frames { creationIdentifier, timestampsSeconds: ["last"], visible: false }` (free).
3. The returned still becomes the next shot's `keyframes.start` (`{ type: "image", url: <still identifier> }`), with the next designed keyframe as `keyframes.end`.
4. Download each extracted still into the masters: it is the seam both shots must meet (§3 measures it).
5. Check the new take's head: `video_extract_frames` for its first two frames, then SSIM of the previous shot's last frame against each (§3). Some start-frame models (Kling 2.5, in one test) return the start keyframe verbatim as frame 1 and re-render from frame 2, which drifts in texture on a detailed surface: SSIM near 1 at frame 1, far lower at frame 2. Then frame 1 duplicates the previous shot's last frame: drop it at encoding (`skip=1`), and let the held-frame blend of §5 cover the small texture pop that remains, never a longer overlap.

A draft's last frame is softer than the final's: chaining from a draft starts the next shot blurred.

A match cut, a match on action or a camera move through a cut requires chained shots. Shots generated in parallel from shared keyframes each start and end at rest, and meet on a different frame, speed and light: the model fills the gap with a morph or a crossfade, and only a plain cut or a dissolve that their row states can join them. Chained, the match cut sits inside the footage itself, and no shader has to invent the continuity.

**Loops.** The same image as `keyframes.start` and `keyframes.end`, then measure the seam locally (§3): SSIM between the first and last frames ≥ 0.95. Below that, cut the clip at the frame closest to the first one, or generate again. Drop the last frame of a loop when it repeats the first, or the loop stutters on a doubled frame.

**Review before spending more.** Free tools, on every draft and every final:

- `video_view_frames { count: 16 }`: a contact sheet; check framing, light, the subject in the central band, the end frame.
- `video_analyze`, one question at a time, on all the takes of a journey together when the question is about the seams: "Does any legible or pseudo text, logo or interface appear? Give timestamps." "Is there any cut, or is the camera move continuous?" "Do surfaces melt, flicker or morph?" On two to ten creations together: "Do these shots share light, colour and scale?"
- Two misses on one shot: rewrite the shot or its keyframes instead of generating again.

**Budget.** 30,000 credits per page, exploration, drafts and retries included; Magnific is the only paid provider.

- Plan within the cap before the first quote: with the cap and the page's `spent` in view, choose the number and length of shots, or carry a beat with 2.5D relief (§6) instead of video. Never fit the cap by shortening a shot below the scroll its storyboard beat needs: drop a shot or move a beat to relief instead. Once a priced plan would pass the cap, do not re-plan on your own: an autonomous run stops and asks (`asset-production` §3), with the cheaper variant as an option in the question.
- Price the whole plan before the first call: `simulate_cost` with the exact arguments of every keyframe, draft and final, plus one retry per final shot, a ranged quote counting at its top (`asset-production` §3). `video_finalize_draft` is not in `simulate_cost`: count it at the price of the equivalent `video_generate` at final resolution, an upper bound.
- `simulate_cost` again before each paid call (arguments drift). `account_balance` keeps no history: read it right before and right after `video_finalize_draft`, and record the difference as its real cost.
- Record every paid call and its credits in `assets/provenance.json` with the page's running total (`asset-production` owns the format).
- Approval follows `asset-production`: an interactive session works from the quote the user approved; an autonomous run proceeds while the page total is at or under 30,000 credits and stops above it (ADR-0028).
- Download every result at once (`creations_register_download`, then save): result URLs expire.

## 3. Encode

Check the tools first: `avifenc --version` (and `cwebp -version`, `ffmpeg -version`); if missing, `brew install libavif webp ffmpeg`.

| Budget per stage, all shots included | Default                                                                |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Frames                               | ≤ 150 AVIF frames; beyond, all-intra H.264                             |
| Desktop                              | 1600 px wide, ≤ 6 MB, whatever the format                              |
| Mobile                               | centred 3:4 portrait crop at the full 900 px height (675×900), ≤ 3 MB |
| Loop seam, chained seam              | SSIM ≥ 0.95                                                            |

Each shot is its own slot: its frames go to `apps/web/public/media/<feature>/<shot>/NNNN.avif` and `…/<shot>/portrait/NNNN.avif`, so shots never overwrite each other. Several shots in one stage share the 150 frames and the budgets: run the block once per shot with its share of `count`.

```bash
shot=<shot>
master=assets/source/<feature>/$shot/$shot.mp4
frames=$(mktemp -d)                                   # PNG intermediates are never versioned
out=apps/web/public/media/<feature>/$shot
count=50                                              # this shot's share of the stage's 150 frames
skip=0                                                # frames dropped at the head: 1 when the take's frame 1 is its start keyframe (§2), more when a seam needs it (below)
duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$master")
rate=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$master")
# count frames from the first to the last source frame, both included: the seams and the poster need the true ends
# (a hair under the exact rate, so float rounding never pushes the last frame out of the last slot)
step=$(awk -v n="$count" -v d="$duration" -v r="$rate" -v s="$skip" 'BEGIN { split(r, q, "/"); f = q[2] / q[1]; print 0.9999 * (n - 1) / (d - (s + 1) * f) }')
sample="trim=start_frame=${skip},setpts=PTS-STARTPTS,fps=${step}:round=up"
mkdir -p "$frames/landscape" "$frames/portrait" "$out/portrait"
ffmpeg -i "$master" -an -vf "$sample,scale=1600:-2:flags=lanczos" -frames:v $count "$frames/landscape/%04d.png"
ffmpeg -i "$master" -an -vf "$sample,scale=-2:900:flags=lanczos,crop=675:900" -frames:v $count "$frames/portrait/%04d.png"
for frame in "$frames"/landscape/*.png; do
  avifenc --speed 6 --qcolor 50 --yuv 420 --depth 8 "$frame" "$out/$(basename "${frame%.png}").avif"
done
for frame in "$frames"/portrait/*.png; do
  avifenc --speed 6 --qcolor 50 --yuv 420 --depth 8 "$frame" "$out/portrait/$(basename "${frame%.png}").avif"
done
cat "$out"/*.avif | wc -c; cat "$out"/portrait/*.avif | wc -c   # sum every shot of the stage against 6 MB and 3 MB
```

`fps` keeps the last source frame of each output slot: with its default rounding, the sequence would start one or two frames late, and the poster and the seams would be off. `round=up` and that step put the first and the last source frames in the sequence (checked on four clips, trimmed or not: SSIM 1.000 at both ends). The portrait set weighs about half the landscape one: 150 frames of clean graphic test footage at `--qcolor 50` weighed 1.5 MB at 675×900 against 3.3 MB at 1600×900. Over budget: lower `--qcolor` by 5 and encode again (each step took about 15 % off: 1.25 MB at 45, 1.03 MB at 40 for that portrait set); at 35 and still over, use fewer frames rather than lower quality. Keep `$frames` until the poster and the still plates are encoded.

**Poster.** The poster of a sequence is frame 0001 of the first shot, encoded once at `--qcolor 65` (it is the LCP and stays on screen the longest), at the location `asset-production` §7 gives to every video poster:

```bash
avifenc --speed 6 --qcolor 65 --yuv 420 --depth 8 "$frames/landscape/0001.png" apps/web/src/features/<feature>/images/<slot>-poster.avif
rm -f "$out/0001.avif"                                 # the scene loads frame 1 from the poster's URL instead
avifenc --speed 6 --qcolor 65 --yuv 420 --depth 8 "$frames/portrait/0001.png" "$out/portrait/0001.avif"
```

The app imports it statically, passes it as the stage's `poster` (`fill`, `loading="eager"`, `fetchPriority="high"`), and puts `poster.src` first in the landscape frame list: the desktop scene loads frame 1 from the poster's own URL, one download for both. Because the portrait frames are a centred 3:4 crop at the same height, the same poster, framed with `object-fit: cover`, matches the portrait first frame in every box that uses those frames (§4). The static export serves images unoptimised, so the poster is AVIF itself.

**Still plates** for reduced motion: one per beat, from the frame that tells it (a hold, an arrival), and always the destination, the last frame of the last shot, so the journey reads to its end without motion. Encode them from the kept PNGs like the poster (`--qcolor 65`) into `apps/web/src/features/<feature>/images/<slot>-still-<beat>.avif`, and pass them to `ScrollScene still`.

**Beyond 150 frames**, encode an all-intra H.264 clip (every frame a keyframe, so a seek in either direction is instant). The budget binds it like a sequence:

```bash
ffmpeg -i "$master" -an -vf "scale=1280:-2:flags=lanczos" -c:v libx264 -preset slow -crf 28 -g 1 -bf 0 \
  -pix_fmt yuv420p -movflags +faststart "$out/$shot.mp4"
```

Measured on clean graphic test footage, 300 frames: 1600 px at CRF 23 weighed 11 MB, CRF 28 7.2 MB, CRF 32 5.0 MB; 1280 px at CRF 28 4.8 MB, CRF 32 3.4 MB (150 AVIF frames at 1600 px: 3.3 MB). Start at 1280 px and CRF 28, raise the CRF before dropping below 1280 px, and cut frames if 32 is not enough. Noise is the budget's enemy: the same tests on a grainy source weighed 15 to 150 MB, so generate clean footage and add grain in the shader.

**Seams.** Loops and chained shots are measured before encoding:

```bash
# a loop: first and last frame of one master
ffmpeg -i "$master" -vf "select=eq(n\,0)" -frames:v 1 first.png
ffmpeg -sseof -0.5 -i "$master" -update 1 last.png
ffmpeg -i first.png -i last.png -lavfi ssim -f null - 2>&1 | grep -o "All:[0-9.]*"            # ≥ 0.95
# a chained seam: last frame of shot A against first frame of shot B
ffmpeg -sseof -0.5 -i shot-a.mp4 -update 1 seam-last.png
ffmpeg -i shot-b.mp4 -frames:v 1 seam-first.png
ffmpeg -i seam-last.png -i seam-first.png -lavfi ssim -f null - 2>&1 | grep -o "All:[0-9.]*"   # ≥ 0.95
```

Below 0.95, find the best frame and cut there:

```bash
# frame of shot B closest to the seam, within its first 30 frames (n is 1-based)
ffmpeg -i shot-b.mp4 -loop 1 -i seam-last.png -lavfi "[0][1]ssim=stats_file=seam.log:shortest=1" -f null -
best=$(awk '{ for (i = 1; i <= NF; i++) if ($i ~ /^All:/) { split($i, value, ":"); print $1, value[2] } }' seam.log \
  | head -n 30 | sort -k2 -g -r | head -n 1 | sed 's/^n:\([0-9]*\).*/\1/')
# then encode shot B again from there: set skip=$((best - 1)) in the block above
```

Measured on test clips: a chained seam of 0.929 between two 1080p shots rose to 0.970 after `skip=2` (compared at 1600 px; 0.991 at the source size), and a 640×360 pair went from 0.88 to 0.98. For a loop, the same log against `first.png`, read from its last 30 lines (`tail -n 30`), gives the cut point (`-frames:v`). When no frame reaches 0.95, the seam's dissolve hides it (place it over the seam), or shot B is generated again from the finalized last frame.

**Files.** Masters (MP4s, keyframes, extracted seam stills, depth maps, masks) in `assets/source/<feature>/<shot>/`, never shipped. Provenance: one entry per sequence (its folder, frame count and encoding command), pointing at its master and every Magnific creation behind it.

## 4. Load

- Frames load only inside the lazy scene, after the stage's own trigger: a phone that never interacts never downloads them, and Lighthouse measures the poster.
- The first frame is loaded by the scene through Suspense before it draws, so the first drawn frame is the poster's frame.
- **One queue per stage**, at most six requests in flight, `priority: "low"`: every shot's coarse frames first (every 8th and each shot's last, so the whole scrub works early), then the missing frame closest to the playhead, picked again at each request so the order follows the visitor. A missing frame shows its nearest loaded neighbour in the same shot.
- **One decoded-frame cap per stage**: keep frames compressed in memory and decode them on demand with `createImageBitmap` (off the main thread); about eight decoded frames stay, the farthest from the playhead closing first. A decoded 1600×900 frame weighs 5.8 MB, a 675×900 one 2.4 MB.
- **The next shot is prepared**: from the middle of a shot, the next shot's first frame is decoded and uploaded to the second texture, and the dissolve waits at 0 until it is there: never black, never a stale frame.
- **The crop follows the stage's box** when the scene mounts, not the window or the quality tier: the portrait frames when the box is at most 3:4 (`PORTRAIT_ASPECT = 675 / 900`), which takes in every phone, with or without its toolbar, and a tablet held upright. In those boxes the portrait frames crop exactly like the poster's cover crop (checked in the browser at 0.56, 0.60, 0.67 and 0.75: within 1 level). Wider boxes, 4:5 and beyond, use the landscape frames, cropped like the poster.
- **A frame that fails is dropped for good**: a non-OK response or a network error is never stored and a blob that does not decode is discarded, so neither is asked or decoded again; the worker that asked moves on to the next frame, and the nearest neighbour in the shot stands in.
- **Every resource lives in the effect that disposes it** (`useSceneResource`, `shader-craft` §3): the store, its textures and the clip. Created during render, StrictMode's first cleanup would abort the store or close the clip in development, and the scene would stay on one frame or black.
- URLs are built by the app with `process.env.NEXT_PUBLIC_BASE_PATH`.

## 5. Render

Start from `references/footage-scene.md`: the frame store, the dissolve shader, the scene and the clip, verified against this repo's typecheck, lint and format and run in a browser. The contract of `shader-craft` §2 applies: an effect component composes `Stage` (usually `fit="cover"` for a full-bleed hero), the lazy scene renders a full-screen plane in `<StageCanvas flat>`, the page tweens a `{ value }` progress object in its `ScrollScene`, and the scene copies it every frame.

- **Frames are textures.** Decode with `imageOrientation: "flipY"` and set `flipY: false` on the texture (three's flip does nothing on an `ImageBitmap`), `colorSpace: SRGBColorSpace`, `LinearFilter`, no mipmaps; upload only when the frame index changes.
- **Chained shots play as one film**: concatenated end to end, with no frame played twice and no stretch where two shots play at once, under one playhead. The page's choreography paces it with a monotone curve through (scroll, film) points, flat where copy is read and steep where the camera travels, so every seam falls in a steep part and copy only in flat ones. An equal share of the scroll per shot puts chained seams at the shots' designed rest frames, inside a reading hold, where the seam is seen.
- **A chained seam blends a few held frames**: 2 to 4 on each side, the outgoing shot holding its last frame while it keeps pushing in, the incoming one holding its first, and a luminance key from the seam's row deciding where the incoming shows first (dark first into a dark opening, light first out into brightness). A longer overlap where both shots play superimposes two camera positions and doubles every structure with parallax.
- **Motion blur follows the film's speed**: a radial smear toward the shot's heading, driven by how fast the film runs, smoothed over about a tenth of a second, with the heading gliding rather than jumping. A smear tied to the seam window shows when a visitor crosses the seam slowly and reads as a glitch.
- **One grade, one grain**: every stage of the page ends with the same grade chunk (`shader-craft` §4).

`pace`, `placeFilm`, the seam and smear shaders and their checks: `references/chained-seams.md`. The rest of the stage (store, loading, clip, tests) stays as `references/footage-scene.md` builds it.
- **Unchained seams dissolve along a threshold**, never a crossfade (`DISSOLVE_FRAGMENT` in `footage-scene.md`): an FBM field over the frame, a threshold that sweeps from below 0 to 1 with the dissolve, a soft edge where the next shot burns through, the two shots refracted along the field's slope at that edge, and the seam lit slightly brighter. Tint the seam with a token colour when the brand has one that suits light. The frame is mapped with `coverUv`, so the canvas crops exactly like the poster. The field follows the seam's row in `### Transitions`: the FBM field alone, with no direction, is the generic noise dissolve that `motion-design` §3 forbids. Bias it along the travel, weight it by the outgoing frame's luminance or a depth map, or shape it after the medium the camera passes through, and place the dissolve in the moving part of the shot, never over a hold.
- **Beyond 150 frames**, the all-intra clip plays through a `VideoTexture` on a muted, inline, `preload="auto"` video: the scroll seeks it. `openClip` and `closeClip` go through `useSceneResource`; a child component suspends on `use(clip.ready)` until `loadeddata` (first frame decoded, duration known); seeks are coalesced (one at a time, always to the latest target); the texture updates on `seeked`; the video and texture are released on unmount. iOS Safari may load nothing until a video plays, so `openClip` starts it muted and puts it back, paused, on its first frame as soon as it plays; if `play()` is refused and no data comes, `ready` never resolves and the poster stays. Check it on a real device.
- **Ambient or not**: a scroll-driven stage rests when the visitor rests, so it is not `ambient`. A WebGL loop moves on its own: mark it `ambient` and `Stage` gives it its pause control once live; the motion audit then also fails it if it freezes.
- **Late mounts**: a phone loads the scene after its first interaction, often a scroll, so it may mount mid-journey and crossfade from the poster to the current frame, by design. `place` holds the first frame through its dead zone, the first tenth of the scroll, so the common case stays on the poster's frame.

**Tests first**, in the package's Vitest browser mode, before the scene:

- `place`: the dead zone holds the first frame, the end of each shot but the last dissolves, progress 1 is the last frame of the last shot.
- Chained film: `pace` passes through its points and never decreases; `placeFilm` holds the outgoing last frame and the incoming first frame inside each seam window, its mix runs from 0 to 1 across it, and outside every window it shows one frame (`references/chained-seams.md`).
- The store: at most six requests in flight, coarse frames first, decoded bitmaps capped (count `createImageBitmap` and `close` calls); a 404 asked once, a broken frame decoded once, the nearest good frame on screen (read from the picture); with network errors on several frames, the rest of the stage still loads.
- The mounted scene, inside `<StrictMode>` and with network latency: frames keep loading to the last shot. With decoding slowed, a jump into a dissolve shows no black pixel and none of the next shot until its first frame is on the texture.
- The clip, inside `<StrictMode>`: its first frame draws and a seek changes the picture (`references/footage-scene.md` has these tests).
- The dissolve shader: the compile and blank-frame test of `shader-craft` §8.

## 6. Relief 2.5D

A single still moves in depth: cheaper than video, and often enough for a secondary beat.

1. **Depth**: `images_depth_map { creationIdentifier }` on the still (grayscale, near is bright).
2. **Subject cut-out**: `images_remove_background` on the still: a transparent PNG of the subject.
3. **Filled background**: `images_segment { prompt: "<the subject>" }` for its mask; widen the mask by the largest shift (below); upload it (`creations_request_upload`, then `creations_finalize_upload`: local files take this route); then `images_retouch { mode: "erase", editType: "precise", maskCreationIdentifier }`: where the subject was is now background, so nothing ghosts when the layers slide. Run `images_depth_map` again on the plate.

```bash
# widen the mask by the largest shift: sigma ≈ shift / 1.75 (28 grows it by 48 px, 3 % of 1600)
ffmpeg -i mask.png -vf "format=gray,gblur=sigma=28,lut=y='if(gt(val,10),255,0)'" mask-wide.png
# encode: plate as AVIF; cut-out keeps the colour under transparent pixels, or filtering draws a halo
avifenc --speed 6 --qcolor 60 --yuv 420 plate.png plate.avif
cwebp -q 85 -alpha_q 100 -exact subject.png -o subject.webp
# depth: softened so displacement does not tear, lossless so it does not ripple
ffmpeg -i depth.png -vf "format=gray,gblur=sigma=2" depth-soft.png && cwebp -lossless -exact depth-soft.png -o depth.webp
```

4. **Shift each layer by its depth**, at most 3 % of the width in any direction (a diagonal pointer included), whatever the focus depth: `uParallax` is the smoothed pointer (mouse only, `gsap.quickTo`) or the scroll, within [−1, 1]; `uFocus` is the depth that stays still.

```glsl
vec2 parallax(sampler2D depthMap, vec2 uv, vec2 direction) {
  float depth = texture(depthMap, uv).r;                       // near = 1, far = 0
  float reach = max(uFocus, 1.0 - uFocus);                     // the largest |depth - focus| possible
  vec2 heading = direction / max(length(direction), 1.0);      // never longer than 1, even on a diagonal
  return uv + heading * (depth - uFocus) * (0.03 / reach);     // never more than 0.03, in any direction
}
// plate = texture(uPlate, parallax(uPlateDepth, uv, uParallax)); subject over it with its alpha
```

Every Magnific step here is paid: quote it like any other call (§2).

A liquid that should run over the still (water, oil, a glaze, a drip) is a shader over the photo, traced from its own relief: `shader-craft` `references/liquid-on-photo.md`.

## 7. Accessibility

- The poster carries the accessible name: its `alt` says in one sentence what the footage shows. The canvas is `aria-hidden` (the stage does it), and nothing essential lives in the footage.
- No text in the video, ever: check every draft with `video_analyze`. Copy over footage sits on the effect component's contrast veil, checked on the brightest and the darkest frame under the copy (`shader-craft` §6): a journey from a dark interior to a bright sky changes the worst case from beat to beat.
- Reduced motion shows the poster and the still plates (§3): one per beat and the destination, so the whole journey reads without motion.
- No more than three flashes in any second (WCAG 2.3.1): no lightning, strobing light or fast cuts; keep each dissolve over a stretch of scroll.
- A loop that plays on its own gets a pause control: `Stage`'s built-in control for an ambient stage, the loop component's own for a plain video (WCAG 2.2.2). Scroll-driven footage stops when the visitor stops.
- Silent: no audio track (`-an`), nothing that could autoplay sound.

## Avoid

- Stock-looking footage with no beat: a drone shot that could open any site.
- Text, logos or interfaces in generated video; real customers' faces.
- Models, resolutions or prices from memory; a paid call without `simulate_cost`; a final made with `video_generate` after an approved draft.
- Chaining from a draft's last frame; making later finals before the shot they continue is final.
- Grain baked into the frames.
- Hard cuts inside a scroll shot, actions that read wrong in reverse, a camera that changes speed for no reason.
- A seam without its row in `### Transitions`, a match cut between shots that were not chained, or an undirected noise dissolve.
- A chained take whose first frame repeats the previous shot's last; an overlap where two shots play at once; a seam at the end of an equal share of the scroll, inside a reading hold.
- Motion blur tied to the seam window instead of the film's speed; a grade or a grain per scene.
- More than 150 frames as AVIF, or a stage over 6 MB on desktop or 3 MB on phones, in any format.
- Several shots in one folder; the poster stored twice.
- Decoding every frame up front, one queue per shot, or decoding on the main thread with `<img>` uploads.
- Retrying a frame that failed, a loader that stops at a network error, or a store or clip created during render (StrictMode closes it in development).
- A first drawn frame that is not the poster, or a dissolve into a shot whose frame is not there yet.
- 2.5D shifts beyond 3 % of the width, or a background plate without its subject removed.

## Reference skills

`asset-production` (quotes, provenance, prompts, delivery, the loop component), `shader-craft` (stage contract, framing, shared chunks, contrast veil, shader tests, poster rules for canvases), `motion-design` (transitions between shots, camera language), `scroll-storytelling` (beats and still plates), `scene-3d` (when a model beats footage), `threejs-textures` for the API (its vanilla set-ups give way to `StageCanvas`, see `AGENTS.md`), `motion-review` and the `design-reviewer` agent for judgement.
