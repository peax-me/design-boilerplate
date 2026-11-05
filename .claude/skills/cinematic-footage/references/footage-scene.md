# Footage scene

The modules and tests of a scroll-driven footage stage, checked as written in this repository (typecheck, `oxlint --type-aware`, `oxfmt`) and run in Vitest browser mode, the package's own set-up:

- The first frame draws upright, from the frame the poster shows.
- One load queue serves the whole stage: never more than 6 requests in flight, every shot's coarse frames first (`a/0001 a/0009 a/0012 b/0001 b/0009 b/0012 c/0001 …`), then the frames closest to the playhead.
- Decoded bitmaps stay at 8 for the stage (9 alive counting the first frame's), across a walk through all three shots.
- With decoding slowed to 1.5 s, a jump straight into a dissolve showed no pixel of the next shot and no black pixel until its first frame was on the texture; then the dissolve ran.
- Under StrictMode with 300 ms of network latency, frames keep loading to the last shot. With the store created during render and aborted by the first cleanup, the same test fails: no frame after the first ever arrives.
- A frame answered with a 404 is asked once, a frame that does not decode is decoded once, and the picture shows the nearest good frame, read from its grey level (each test frame has its own). Before the fix, the missing frame was asked twice and the broken one decoded again on every frame.
- With six frames failing at the network (a rejected `fetch`), the rest of the stage still loads and the picture reaches frame 9. Before the fix, each rejection ended a worker: the six were gone and the picture stayed on frame 8, the last coarse frame loaded.
- The scene picks the portrait frames in boxes of 0.56, 0.60, 0.67 and 0.75, the landscape ones at 0.80, and in every one its first drawn frame matches the poster's cover crop within 1 level.
- `place` holds the first frame through the dead zone (the first tenth of the scroll) and ends on the last frame of the last shot.
- The clip, under StrictMode, draws its first frame at once, scrubs, and is opened again by the second mount instead of staying closed.

Shared code comes from `shader-craft` (`references/shader-chunks.md` for the GLSL, `references/effect-skeleton.md` for `useSceneResource` and the test support): these modules import it, never copy it. Rename `footage` to the effect's name.

## `apps/web/src/features/<feature>/<slot>-frames.ts`

The app builds the URLs, with the base path of the static export. The first landscape frame is the poster's own URL, so one download serves both: that frame is not written to `public/media`.

```ts
import poster from "./images/<slot>-poster.avif";

const MEDIA = `${process.env.NEXT_PUBLIC_BASE_PATH}/media/<feature>`;
/* The stage's shots in story order: each one's folder name and frame count. */
const SHOTS = [
  ["first-shot", 50],
  ["second-shot", 50],
  ["third-shot", 50],
] as const;

/* Frame URLs of one shot: 0001.avif, 0002.avif… in its folder, or in its portrait crop. */
function frames(shot: string, count: number, crop: "" | "/portrait" = ""): string[] {
  return Array.from(
    { length: count },
    (_, index) => `${MEDIA}/${shot}${crop}/${String(index + 1).padStart(4, "0")}.avif`,
  );
}

/* The poster is frame 0001 of the first landscape shot: the scene loads it from the same URL, so it downloads once. */
export const stageShots = {
  landscape: SHOTS.map(([shot, count], index) =>
    index === 0 ? [poster.src, ...frames(shot, count).slice(1)] : frames(shot, count),
  ),
  portrait: SHOTS.map(([shot, count]) => frames(shot, count, "/portrait")),
};
```

The effect component composes `Stage` like any effect (`shader-craft` `references/effect-skeleton.md`, `fit="cover"` for a full-bleed hero) and passes `shots` and `progress` to the lazy scene inside `renderScene`.

## `packages/ui/src/scene/<effect>-frames.ts`

```ts
/* One stage loads at most this many frames at a time, at low priority: the page's own requests go first. */
const LOAD_CONCURRENCY = 6;
/* Decoded frames kept for the whole stage: a 1600×900 frame is 5.8 MB once decoded, about 40 KB compressed. */
const DECODED_FRAMES = 8;
/* Every 8th frame of every shot, and each shot's last, load before the rest: the whole scrub works early. */
const COARSE_STRIDE = 8;
/* The share of each shot's scroll during which the next shot dissolves in. */
const DISSOLVE_SHARE = 0.2;
/* The first tenth of the scroll holds the first frame: a scene mounted there still shows the poster's frame. */
const DEAD_ZONE = 0.1;

export interface Frame {
  index: number;
  bitmap: ImageBitmap;
}

/* Every frame of every shot in one list: shot k owns the indices from starts[k] to starts[k + 1] - 1. */
export interface FrameStore {
  urls: string[];
  starts: number[];
  blobs: Array<Blob | undefined>;
  requested: Set<number>;
  decoded: Map<number, ImageBitmap>;
  decoding: Set<number>;
  /* The frame the scroll shows, and the next shot's first frame once it is being prepared: never evicted. */
  playhead: number;
  prepared: number | undefined;
  loading: AbortController;
}

export interface Placement {
  shot: number;
  frame: number;
  local: number;
  dissolve: number;
}

function shotOf(store: FrameStore, index: number): number {
  return store.starts.findLastIndex((start) => start <= index);
}

function shotEnd(store: FrameStore, shot: number): number {
  return (store.starts[shot + 1] ?? store.urls.length) - 1;
}

function isCoarse(store: FrameStore, index: number): boolean {
  const shot = shotOf(store, index);
  return (
    (index - (store.starts[shot] ?? 0)) % COARSE_STRIDE === 0 || index === shotEnd(store, shot)
  );
}

/* Coarse frames first, then the closest to the playhead: the order follows the visitor as they scroll. */
function nextToLoad(store: FrameStore): number | undefined {
  let best: number | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let index = 0; index < store.urls.length; index += 1) {
    const score =
      (isCoarse(store, index) ? 0 : store.urls.length) + Math.abs(index - store.playhead);
    if (!store.requested.has(index) && score < bestScore) {
      best = index;
      bestScore = score;
    }
  }
  return best;
}

/* A frame that fails (a non-OK answer, a network error) stays requested and missing: it is never fetched again,
   its neighbours stand in, and the worker moves on to the next frame. */
async function loadFrame(store: FrameStore, index: number): Promise<void> {
  try {
    const response = await fetch(store.urls[index] ?? "", {
      signal: store.loading.signal,
      priority: "low",
    });
    if (response.ok) {
      const { blobs } = store;
      blobs[index] = await response.blob();
    }
  } catch {
    /* A network error, or the store closing: nothing to keep for this frame. */
  }
}

export function createFrameStore(shots: string[][]): FrameStore {
  const starts = shots.map((_, shot) =>
    shots.slice(0, shot).reduce((sum, urls) => sum + urls.length, 0),
  );
  const urls = shots.flat();
  const store: FrameStore = {
    urls,
    starts,
    blobs: Array.from({ length: urls.length }),
    requested: new Set(),
    decoded: new Map(),
    decoding: new Set(),
    playhead: 0,
    prepared: undefined,
    loading: new AbortController(),
  };
  async function work(): Promise<void> {
    for (
      let index = nextToLoad(store);
      index !== undefined && !store.loading.signal.aborted;
      index = nextToLoad(store)
    ) {
      store.requested.add(index);
      // oxlint-disable-next-line no-await-in-loop -- each worker loads one frame at a time, the closest still missing.
      await loadFrame(store, index);
    }
  }
  /* Six workers share one queue; none of them ever rejects, and all stop once the store closes. */
  void Promise.all(Array.from({ length: LOAD_CONCURRENCY }, work));
  return store;
}

/* Closest index to target inside one shot that passes the test. */
function nearestInShot(
  store: FrameStore,
  target: number,
  has: (index: number) => boolean,
): number | undefined {
  const shot = shotOf(store, target);
  const first = store.starts[shot] ?? 0;
  const last = shotEnd(store, shot);
  for (let offset = 0; offset <= last - first; offset += 1) {
    if (target - offset >= first && has(target - offset)) {
      return target - offset;
    }
    if (target + offset <= last && has(target + offset)) {
      return target + offset;
    }
  }
  return undefined;
}

/* The stage keeps DECODED_FRAMES bitmaps, the farthest from the playhead go first; the playhead and the
   prepared frame stay. A bitmap already uploaded to a texture can close: the GPU keeps its copy. */
function evict(store: FrameStore): void {
  const kept = new Set([store.playhead, store.prepared]);
  const farthest = [...store.decoded.keys()]
    .filter((index) => !kept.has(index))
    .toSorted(
      (first, second) => Math.abs(second - store.playhead) - Math.abs(first - store.playhead),
    );
  for (const index of farthest.slice(0, Math.max(store.decoded.size - DECODED_FRAMES, 0))) {
    store.decoded.get(index)?.close();
    store.decoded.delete(index);
  }
}

/* Decoded off the main thread, already flipped for WebGL: three's flipY does nothing on an ImageBitmap.
   A frame that does not decode is dropped for good, so it is never retried and its neighbours stand in. */
async function decode(store: FrameStore, index: number, blob: Blob): Promise<void> {
  store.decoding.add(index);
  try {
    const bitmap = await createImageBitmap(blob, {
      imageOrientation: "flipY",
      premultiplyAlpha: "none",
    });
    store.decoded.set(index, bitmap);
    evict(store);
  } catch {
    const { blobs } = store;
    blobs[index] = undefined;
  } finally {
    store.decoding.delete(index);
  }
}

/* Stops loading and frees every decoded frame, when the scene unmounts. */
export function closeFrameStore(store: FrameStore): void {
  store.loading.abort();
  for (const bitmap of store.decoded.values()) {
    bitmap.close();
  }
  store.decoded.clear();
}

/* The closest decoded frame of the target's shot, while the exact one decodes. */
export function frameAt(store: FrameStore, target: number): Frame | undefined {
  const source = nearestInShot(store, target, (index) => store.blobs[index] !== undefined);
  const blob = source === undefined ? undefined : store.blobs[source];
  if (
    source !== undefined &&
    blob !== undefined &&
    !store.decoded.has(source) &&
    !store.decoding.has(source)
  ) {
    decode(store, source, blob).catch(() => null);
  }
  const shown = nearestInShot(store, target, (index) => store.decoded.has(index));
  const bitmap = shown === undefined ? undefined : store.decoded.get(shown);
  return shown === undefined || bitmap === undefined ? undefined : { index: shown, bitmap };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/* Shots joined by a dissolve (generated apart). Chained shots play as one paced film instead: chained-seams.md replaces place and DISSOLVE_FRAGMENT.
   After the dead zone, each shot owns an equal part of the progress; the end of each part but the last dissolves into the next shot.
   frame is a store index: starts[shot] plus the frame inside the shot. */
export function place(progress: number, store: FrameStore): Placement {
  const shots = store.starts.length;
  const moving = Math.max(progress - DEAD_ZONE, 0) / (1 - DEAD_ZONE);
  const scaled = Math.min(moving, 1) * shots;
  const shot = Math.min(Math.floor(scaled), shots - 1);
  const local = scaled - shot;
  const first = store.starts[shot] ?? 0;
  const dissolve = shot < shots - 1 ? smoothstep(1 - DISSOLVE_SHARE, 1, local) : 0;
  return {
    shot,
    frame: first + Math.round(local * (shotEnd(store, shot) - first)),
    local,
    dissolve,
  };
}
```

## `packages/ui/src/scene/<effect>-shaders.ts`

```ts
import { COVER_UV, FBM, GRADIENT_NOISE, HASH } from "./shader-chunks.ts";

/* Two shots crossed by a noise threshold: the next shot burns through the current one along an organic edge,
   refracted and lit where they meet. */
export const DISSOLVE_FRAGMENT = `
  #define OCTAVES 4
  uniform sampler2D uShotA;
  uniform sampler2D uShotB;
  uniform float uDissolve;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uFrameAspect;

  ${HASH}
  ${GRADIENT_NOISE}
  ${FBM}
  ${COVER_UV}

  void main() {
    vec2 uv = coverUv(gl_FragCoord.xy, uResolution, uFrameAspect);
    float field = clamp(fbm(uv * vec2(uFrameAspect, 1.0) * 2.5 + uTime * 0.03) * 0.8 + 0.5, 0.0, 1.0);
    const float EDGE = 0.12;
    float threshold = mix(-EDGE, 1.0, uDissolve);
    float reveal = 1.0 - smoothstep(threshold, threshold + EDGE, field);
    float seam = 1.0 - abs(reveal * 2.0 - 1.0);
    vec2 bend = vec2(dFdx(field), dFdy(field)) * seam * 6.0;
    vec3 current = texture(uShotA, uv + bend).rgb;
    vec3 next = texture(uShotB, uv - bend).rgb;
    vec3 color = mix(current, next, reveal) * (1.0 + seam * 0.35);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
```

## `packages/ui/src/scene/<effect>-scene.tsx`

```tsx
"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useState } from "react";
import {
  ImageBitmapLoader,
  LinearFilter,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
} from "three";

import type { SceneProps } from "../motion/stage.tsx";
import { closeFrameStore, createFrameStore, type Frame, frameAt, place } from "./footage-frames.ts";
import { DISSOLVE_FRAGMENT } from "./footage-shaders.ts";
import { FULL_SCREEN } from "./shader-chunks.ts";
import { StageCanvas } from "./stage-canvas.tsx";
import { useFirstFrame } from "./use-first-frame.ts";
import { useSceneResource } from "./use-scene-resource.ts";

/* From this far into a shot, the next shot's first frame is decoded and waiting on the second texture. */
const PREPARE_NEXT_FROM = 0.5;
/* The portrait frames are a centred 3:4 crop (675×900). Any box at most 3:4 (every phone, with or without its
   toolbar, and a tablet held upright) covers them the way the poster's cover crop covers the landscape frame, so
   they match it; wider boxes use the landscape frames. */
const PORTRAIT_ASPECT = 675 / 900;

type Orientation = "landscape" | "portrait";

interface FootageSceneProps extends SceneProps {
  /* Frame URLs of each shot in story order, for both crops, built by the app with NEXT_PUBLIC_BASE_PATH.
     The first landscape frame is the poster's own URL (its static import's src): one download serves both. */
  shots: Record<Orientation, string[][]>;
  /* Tweened from 0 to 1 by the page's ScrollScene choreography. */
  progress: { value: number };
}

/* Frames arrive flipped from decoding; no mipmaps, so a frame change is one upload. */
function frameTexture(image?: ImageBitmap): Texture<ImageBitmap | undefined> {
  const texture = new Texture(image);
  Object.assign(texture, {
    flipY: false,
    colorSpace: SRGBColorSpace,
    minFilter: LinearFilter,
    generateMipmaps: false,
    needsUpdate: image !== undefined,
  });
  return texture;
}

/* Built imperatively: the material keeps this very uniforms object, while R3F's uniforms prop copies it.
   The store loads the frames; everything is made and released together (see useSceneResource). */
function createFootage(first: ImageBitmap, shots: string[][]) {
  const uniforms = {
    uShotA: { value: frameTexture(first) },
    uShotB: { value: frameTexture() },
    uDissolve: { value: 0 },
    uTime: { value: 0 },
    uResolution: { value: new Vector2() },
    uFrameAspect: { value: first.width / first.height },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: FULL_SCREEN,
    fragmentShader: DISSOLVE_FRAGMENT,
  });
  return { material, uniforms, store: createFrameStore(shots) };
}

type FootageState = ReturnType<typeof createFootage>;

function disposeFootage({ material, uniforms, store }: FootageState): void {
  closeFrameStore(store);
  material.dispose();
  uniforms.uShotA.value.dispose();
  uniforms.uShotB.value.dispose();
}

function show(texture: Texture<ImageBitmap | undefined>, frame: Frame | undefined): void {
  if (frame === undefined || texture.image === frame.bitmap) {
    return;
  }
  Object.assign(texture, { image: frame.bitmap, needsUpdate: true });
}

/* Mutations live outside the component: the React Compiler lint rejects writing to hook values in useFrame.
   The dissolve stays at 0 until the second texture holds the next shot's first frame: no black, no stale frame. */
function advance(footage: FootageState, frame: { delta: number; progress: number }): void {
  const { store } = footage;
  const { uShotA, uShotB, uDissolve, uTime } = footage.uniforms;
  const placement = place(frame.progress, store);
  const next = store.starts[placement.shot + 1];
  const prepared = next !== undefined && placement.local >= PREPARE_NEXT_FROM ? next : undefined;
  Object.assign(store, { playhead: placement.frame, prepared });
  show(uShotA.value, frameAt(store, placement.frame));
  const waiting = prepared === undefined ? undefined : frameAt(store, prepared);
  const ready = waiting !== undefined && waiting.index === prepared;
  if (ready) {
    show(uShotB.value, waiting);
  }
  uDissolve.value = ready ? placement.dissolve : 0;
  uTime.value += frame.delta;
}

/* Rendered once the footage exists, so the first frame it reports is a drawn one. */
function FootageFrame({
  footage,
  onReady,
  progress,
}: { footage: FootageState } & Pick<FootageSceneProps, "onReady" | "progress">) {
  useFirstFrame(onReady);
  useFrame((state, delta) => {
    advance(footage, { delta, progress: progress.value });
    state.gl.getDrawingBufferSize(footage.uniforms.uResolution.value);
  });
  return (
    <mesh frustumCulled={false} material={footage.material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

function FootagePlane({ onReady, shots, progress }: Omit<FootageSceneProps, "tier">) {
  /* The crop follows the stage's own box at mount, not the window or the tier. */
  const size = useThree((state) => state.size);
  const [orientation] = useState<Orientation>(() =>
    size.width / size.height <= PORTRAIT_ASPECT ? "portrait" : "landscape",
  );
  const chosen = shots[orientation];
  /* Suspends until the first frame is decoded: the scene's first frame is the poster's frame. */
  const first = useLoader(ImageBitmapLoader, chosen[0]?.[0] ?? "", (loader) => {
    loader.setOptions({ imageOrientation: "flipY", premultiplyAlpha: "none" });
  });
  const footage = useSceneResource(createFootage, disposeFootage, first, chosen);
  return footage === null ? null : (
    <FootageFrame footage={footage} onReady={onReady} progress={progress} />
  );
}

export function FootageScene({ tier, ...footage }: FootageSceneProps) {
  return (
    <StageCanvas tier={tier} flat className="absolute inset-0">
      <FootagePlane {...footage} />
    </StageCanvas>
  );
}
```

## `packages/ui/src/scene/<effect>-clip.ts` (beyond 150 frames)

For a shot past 150 frames, the scene opens a clip instead of a frame store: `const clip = useSceneResource(openClip, closeClip, url)`, then a child component calls `use(clip.ready)` (it suspends until the first frame is decoded), seeks with `clip.seek(local × clip.video.duration)` in `useFrame`, and samples `clip.texture`. `tests/<effect>-clip.test.tsx` below shows the whole pattern.

```ts
import { LinearFilter, VideoTexture } from "three";

/* Closer than this, a seek would land on the frame already shown. */
const SAME_TIME = 0.001;

export interface Clip {
  video: HTMLVideoElement;
  texture: VideoTexture;
  /* Resolves at loadeddata: the duration is known and the first frame decoded. */
  ready: Promise<void>;
  seek: (time: number) => void;
}

/* Waits for the first frame. A clip that fails to load rejects, and the stage's boundary brings the poster back. */
function firstFrame(video: HTMLVideoElement, texture: VideoTexture): Promise<void> {
  const ready = new Promise<void>((resolve, reject) => {
    video.addEventListener("loadeddata", () => {
      Object.assign(texture, { needsUpdate: true });
      resolve();
    });
    video.addEventListener("error", () => {
      reject(new Error(`The clip ${video.src} did not load.`));
    });
  });
  /* A clip closed before it loaded may still reject: nobody waits on it any more. */
  ready.catch(() => null);
  return ready;
}

/* An all-intra clip (every frame a keyframe) scrubbed by seeking. iOS Safari may load nothing until a video plays,
   so the clip starts muted and goes back to its first frame, paused, as soon as it plays; if play() is refused and
   no data comes, ready never resolves and the poster stays. Seeks run one at a time, always to the latest target,
   because queued seeks make the picture trail the scroll; the texture updates when a seek lands. */
export function openClip(url: string): Clip {
  const video = Object.assign(document.createElement("video"), {
    muted: true,
    playsInline: true,
    preload: "auto",
    src: url,
  });
  const texture = Object.assign(new VideoTexture(video), {
    minFilter: LinearFilter,
    generateMipmaps: false,
  });
  const ready = firstFrame(video, texture);
  let seeking = false;
  let target: number | undefined;
  function seek(time: number): void {
    const clamped = Math.min(Math.max(time, 0), video.duration - SAME_TIME);
    if (seeking) {
      target = clamped;
      return;
    }
    if (!Number.isFinite(clamped) || Math.abs(clamped - video.currentTime) < SAME_TIME) {
      return;
    }
    seeking = true;
    Object.assign(video, { currentTime: clamped });
  }
  video.addEventListener("seeked", () => {
    texture.needsUpdate = true;
    seeking = false;
    if (target !== undefined) {
      const next = target;
      target = undefined;
      seek(next);
    }
  });
  video.addEventListener(
    "playing",
    () => {
      video.pause();
      seek(0);
    },
    { once: true },
  );
  video.play().catch(() => null);
  return { video, texture, ready, seek };
}

/* Releases the video's data and the texture, when the scene unmounts. */
export function closeClip({ video, texture }: Clip): void {
  video.pause();
  video.removeAttribute("src");
  video.load();
  texture.dispose();
}
```

## `packages/ui/tests/<effect>-scene.test.tsx`

Frames are drawn in the test and served from memory; the network and the decoder are watched with pass-through spies.

```tsx
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { closeFrameStore, createFrameStore, place } from "../src/scene/footage-frames.ts";
import { FootageScene } from "../src/scene/footage-scene.tsx";
import { canvasIn, canvasPixels, countPixels } from "./support/canvas-pixels.ts";

const FRAMES = 12;
const LATENCY_MS = 300;

/* A shot of identical frames served from memory: red over blue (to see the orientation), or one colour. */
async function shotUrls(paint: "red-over-blue" | "green" | "grey"): Promise<string[]> {
  const canvas = new OffscreenCanvas(320, 180);
  const context = canvas.getContext("2d");
  const colours = {
    "red-over-blue": ["#f00", "#00f"],
    green: ["#0a0", "#0a0"],
    grey: ["#ccc", "#ccc"],
  };
  const [top = "", bottom = ""] = colours[paint];
  if (context !== null) {
    context.fillStyle = top;
    context.fillRect(0, 0, 320, 90);
    context.fillStyle = bottom;
    context.fillRect(0, 90, 320, 90);
  }
  const url = URL.createObjectURL(await canvas.convertToBlob({ type: "image/png" }));
  return Array.from({ length: FRAMES }, () => url);
}

/* A shot whose frame k is a flat grey of level gradeOf(k): the picture tells which frame is on screen. */
function gradeOf(frame: number): number {
  return 20 + frame * 18;
}

function gradedShot(): Promise<string[]> {
  const canvas = new OffscreenCanvas(32, 18);
  const context = canvas.getContext("2d");
  return Promise.all(
    Array.from({ length: FRAMES }, async (_, frame) => {
      const grade = gradeOf(frame);
      if (context !== null) {
        context.fillStyle = `rgb(${grade} ${grade} ${grade})`;
        context.fillRect(0, 0, 32, 18);
      }
      return URL.createObjectURL(await canvas.convertToBlob({ type: "image/png" }));
    }),
  );
}

/* The progress at which the playhead of a one-shot stage stands on that frame, past the dead zone. */
function progressAt(frame: number): number {
  return 0.1 + (0.9 * frame) / (FRAMES - 1);
}

/* The grey level at the centre of the canvas. */
async function gradeOnScreen(canvas: HTMLCanvasElement): Promise<number> {
  const pixels = await canvasPixels(canvas);
  return pixels[(18 * 64 + 32) * 4] ?? 0;
}

function slowFetch(): void {
  const network = window.fetch.bind(window);
  vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
    await new Promise((resolve) => {
      setTimeout(resolve, LATENCY_MS);
    });
    return network(input, init);
  });
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  return input instanceof URL ? input.href : input.url;
}

/* Answers 404 for one URL, fails the network for others, lets every other request through; the spy counts requests. */
function failingNetwork({ missing, unreachable }: { missing: string; unreachable: string[] }) {
  const network = window.fetch.bind(window);
  return vi.spyOn(window, "fetch").mockImplementation((input, init) => {
    if (urlOf(input) === missing) {
      return Promise.resolve(new Response(null, { status: 404 }));
    }
    if (unreachable.includes(urlOf(input))) {
      return Promise.reject(new TypeError("Failed to fetch"));
    }
    return network(input, init);
  });
}

function requestsFor(fetches: ReturnType<typeof failingNetwork>, url: string): number {
  return fetches.mock.calls.filter(([input]) => urlOf(input) === url).length;
}

/* Watches every decode, letting it through; decodesOf counts those of one blob, told apart by its size. */
function watchDecodes() {
  return vi.spyOn(window, "createImageBitmap");
}

function decodesOf(decodes: ReturnType<typeof watchDecodes>, size: number): number {
  return decodes.mock.calls.filter(([image]) => image instanceof Blob && image.size === size)
    .length;
}

async function mountFootage(
  shots: string[][],
  progress: { value: number },
): Promise<HTMLCanvasElement> {
  const ready = vi.fn<() => void>();
  const screen = await render(
    <StrictMode>
      <div style={{ width: 320, height: 180, position: "relative" }}>
        <FootageScene
          tier="full"
          onReady={ready}
          progress={progress}
          shots={{ landscape: shots, portrait: shots }}
        />
      </div>
    </StrictMode>,
  );
  await expect.poll(() => ready.mock.calls.length, { timeout: 15_000 }).toBe(1);
  return canvasIn(screen.container);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("place", () => {
  const store = createFrameStore([
    Array.from({ length: FRAMES }, (_, index) => `first-${index}`),
    Array.from({ length: FRAMES }, (_, index) => `second-${index}`),
  ]);
  closeFrameStore(store);

  it("holds the first frame through the dead zone", () => {
    expect(place(0.08, store)).toMatchObject({ shot: 0, frame: 0, dissolve: 0 });
  });

  it("dissolves the end of a shot into the next one", () => {
    expect(place(0.53, store).dissolve).toBeGreaterThan(0);
  });

  it("ends on the last frame of the last shot", () => {
    expect(place(1, store)).toMatchObject({ shot: 1, frame: FRAMES * 2 - 1, dissolve: 0 });
  });
});

describe("footage scene under StrictMode", () => {
  it("keeps loading frames after the double mount of development, over a slow network", async () => {
    slowFetch();
    const shots = [
      await shotUrls("red-over-blue"),
      await shotUrls("green"),
      await shotUrls("grey"),
    ];
    const progress = { value: 0 };
    const canvas = await mountFootage(shots, progress);

    progress.value = 1;

    await expect
      .poll(
        async () =>
          countPixels(
            await canvasPixels(canvas),
            (red, green, blue) => Math.min(red, green, blue) > 150,
          ),
        {
          timeout: 10_000,
        },
      )
      .toBeGreaterThan(2000);
  });

  it("asks once for a missing frame, decodes a broken one once, and shows the nearest good frame", async () => {
    const shot = await gradedShot();
    const missing = `${shot.join("")}#missing`;
    const brokenBytes = "not an image";
    const broken = URL.createObjectURL(new Blob([brokenBytes]));
    const fetches = failingNetwork({ missing, unreachable: [] });
    const decodes = watchDecodes();
    const progress = { value: 0 };
    const canvas = await mountFootage(
      [[...shot.slice(0, 5), missing, broken, ...shot.slice(7)]],
      progress,
    );

    progress.value = progressAt(5);
    await expect.poll(() => gradeOnScreen(canvas), { timeout: 5000 }).toBeCloseTo(gradeOf(4), -1);
    progress.value = progressAt(6);
    await expect.poll(() => gradeOnScreen(canvas), { timeout: 5000 }).toBeCloseTo(gradeOf(7), -1);

    expect(requestsFor(fetches, missing)).toBe(1);
    expect(decodesOf(decodes, brokenBytes.length)).toBe(1);
  });

  it("keeps loading the stage after network errors", async () => {
    const shot = await gradedShot();
    const unreachable = shot.slice(1, 7).map((url) => `${url}#unreachable`);
    const fetches = failingNetwork({ missing: "", unreachable });
    const progress = { value: 0 };
    const canvas = await mountFootage(
      [[...shot.slice(0, 1), ...unreachable, ...shot.slice(7)]],
      progress,
    );

    progress.value = progressAt(9);
    await expect.poll(() => gradeOnScreen(canvas), { timeout: 5000 }).toBeCloseTo(gradeOf(9), -1);

    expect(shot.slice(7).map((url) => requestsFor(fetches, url))).not.toContain(0);
  });
});
```

## `packages/ui/tests/<effect>-clip.test.tsx`

The fixture is a 2-second all-intra clip, 31 KB, made once:

```bash
ffmpeg -f lavfi -i "testsrc2=size=128x72:rate=15:duration=2" -an -c:v libx264 -crf 32 -g 1 -bf 0 \
  -pix_fmt yuv420p -movflags +faststart packages/ui/tests/fixtures/clip.mp4
```

```tsx
import { useFrame } from "@react-three/fiber";
import { StrictMode, use } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { type Clip, closeClip, openClip } from "../src/scene/footage-clip.ts";
import { StageCanvas } from "../src/scene/stage-canvas.tsx";
import { useFirstFrame } from "../src/scene/use-first-frame.ts";
import { useSceneResource } from "../src/scene/use-scene-resource.ts";
import clipUrl from "./fixtures/clip.mp4?url";
import { canvasIn, canvasPixels, countPixels } from "./support/canvas-pixels.ts";

interface ClipProps {
  onReady: () => void;
  progress: { value: number };
}

function ClipFrame({ clip, onReady, progress }: ClipProps & { clip: Clip }) {
  use(clip.ready);
  useFirstFrame(onReady);
  useFrame(() => {
    clip.seek(progress.value * clip.video.duration);
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={clip.texture} toneMapped={false} />
    </mesh>
  );
}

/* The way a scene uses a clip: opened in the effect that closes it, drawn once its first frame is decoded. */
function ClipPlane(props: ClipProps) {
  const clip = useSceneResource(openClip, closeClip, clipUrl);
  return clip === null ? null : <ClipFrame clip={clip} {...props} />;
}

describe("clip under StrictMode", () => {
  it("draws its first frame, scrubs, and survives the double mount of development", async () => {
    const ready = vi.fn<() => void>();
    const progress = { value: 0 };
    const screen = await render(
      <StrictMode>
        <div style={{ width: 320, height: 180, position: "relative" }}>
          <StageCanvas
            tier="light"
            flat
            orthographic
            camera={{ position: [0, 0, 1], left: -1, right: 1, top: 1, bottom: -1 }}
          >
            <ClipPlane onReady={ready} progress={progress} />
          </StageCanvas>
        </div>
      </StrictMode>,
    );
    await expect.poll(() => ready.mock.calls.length, { timeout: 15_000 }).toBe(1);
    const canvas = canvasIn(screen.container);
    const first = await canvasPixels(canvas);

    progress.value = 0.8;

    expect(countPixels(first, (red, green, blue) => red + green + blue > 120)).toBeGreaterThan(100);
    await expect
      .poll(async () => (await canvasPixels(canvas)).join() === first.join(), { timeout: 5000 })
      .toBe(false);
  });
});
```

Why it is shaped this way:

- The first frame comes through `useLoader(ImageBitmapLoader, …)`, which suspends: the scene mounts with the poster's frame already decoded, so its first drawn frame is the poster and the crossfade does not pop.
- The frame store, the textures and the material are made in the effect that disposes them (`useSceneResource`): under StrictMode in development, a store created during render would be aborted by the first cleanup and never load another frame. The same holds for the clip: `openClip` in the effect, `closeClip` in its cleanup.
- The crop is chosen from the stage's own box when the scene mounts: the portrait frames when the box is at most 3:4 (every phone, with or without its toolbar, and a tablet held upright), where their crop matches the poster's cover crop; wider boxes use the landscape frames.
- One store per stage: frames are fetched as compressed blobs (about 6 MB for a whole desktop stage) and decoded on demand with `createImageBitmap`, off the main thread. Only 8 decoded frames stay, the farthest from the playhead closing first; the playhead and the prepared frame never close. 150 decoded 1600×900 frames would take 860 MB.
- A frame that fails stays requested and missing: a non-OK response or a network error is never stored, a blob that does not decode is dropped, so neither is asked or decoded again, and the nearest neighbour stands in. Each request catches its own failure: a rejection that escaped would end its worker, and six transient errors would stop the whole stage. Only the store closing stops the workers.
- The next shot's first frame is decoded from the middle of the current shot and uploaded to the second texture before the dissolve starts; the dissolve stays at 0 until it is there.
- `imageOrientation: "flipY"` at decode, `flipY: false` on the texture: three's `flipY` does nothing on an `ImageBitmap`, and a frame decoded without the flip draws upside down. No mipmaps: a frame change is one upload.
- Materials are built imperatively, and writes go through module-level functions, for the reasons in `shader-craft` §3.
- The clip starts muted and pauses back on its first frame as soon as it plays, because iOS Safari may load nothing until a video plays; if `play()` is refused and no data comes, `ready` never resolves and the poster stays. `ready` resolves at `loadeddata`, when the duration is known: a seek before metadata never fires `seeked`, and a `NaN` duration would make every seek target `NaN`. Seeks are coalesced: setting `currentTime` on every scroll frame queues seeks and the picture lags behind the scroll.
