# Footage scene

Four modules that typecheck, lint and format as written in this repository, run in a browser (Vitest browser mode, the package's own set-up) on three short AVIF shots and an all-intra MP4:

- The first frame draws upright, from the frame the poster shows.
- One load queue serves the whole stage: never more than 6 requests in flight, every shot's coarse frames first (`a/0001 a/0009 a/0012 b/0001 b/0009 b/0012 c/0001 …`), then the frames closest to the playhead.
- Decoded bitmaps stay at 8 for the stage (9 alive counting the first frame's), across a walk through all three shots.
- With decoding slowed to 1.5 s, a jump straight into a dissolve showed no pixel of the next shot and no black pixel until its first frame was on the texture; then the dissolve ran. No capture of the walk had a black pixel.
- The clip draws its first frame at once (suspended until `loadeddata`), lands its coalesced seeks on the latest target, and releases its video after unmount.

Shared GLSL comes from `shader-chunks.ts` (`shader-craft` `references/shader-chunks.md`): these modules import it, never copy it. Rename `footage` to the effect's name.

## `apps/web/src/features/<feature>/<slot>-frames.ts`

The app builds the URLs, with the base path of the static export. The first landscape frame is the poster's own URL, so one download serves both: that frame is not written to `public/media`.

```ts
import poster from "./images/<slot>-poster.avif";

const MEDIA = `${process.env.NEXT_PUBLIC_BASE_PATH}/media/<feature>`;

/* Frame URLs of one shot: 0001.avif, 0002.avif… in the shot's folder, or in its portrait crop. */
function frames(shot: string, count: number, crop: "" | "/portrait" = ""): string[] {
  return Array.from(
    { length: count },
    (_, index) => `${MEDIA}/${shot}${crop}/${String(index + 1).padStart(4, "0")}.avif`,
  );
}

/* The poster is frame 0001 of the first landscape shot: the scene loads it from the same URL, so it downloads once. */
export const journeyShots = {
  landscape: [
    [poster.src, ...frames("dive", 50).slice(1)],
    frames("rise", 50),
    frames("clouds", 50),
  ],
  portrait: [
    frames("dive", 50, "/portrait"),
    frames("rise", 50, "/portrait"),
    frames("clouds", 50, "/portrait"),
  ],
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

export function createFrameStore(shots: string[][], signal: AbortSignal): FrameStore {
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
  };
  async function work(): Promise<void> {
    for (let index = nextToLoad(store); index !== undefined; index = nextToLoad(store)) {
      store.requested.add(index);
      // oxlint-disable-next-line no-await-in-loop -- each worker fetches one frame at a time, the closest still missing.
      const response = await fetch(store.urls[index] ?? "", { signal, priority: "low" });
      // oxlint-disable-next-line no-await-in-loop -- same worker: the body is read before the next pick.
      store.blobs[index] = await response.blob();
    }
  }
  /* Aborted on unmount; a frame that fails stays missing and its neighbours stand in. */
  Promise.all(Array.from({ length: LOAD_CONCURRENCY }, work)).catch(() => null);
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

/* Decoded off the main thread, already flipped for WebGL: three's flipY does nothing on an ImageBitmap. */
async function decode(store: FrameStore, index: number, blob: Blob): Promise<void> {
  store.decoding.add(index);
  try {
    const bitmap = await createImageBitmap(blob, {
      imageOrientation: "flipY",
      premultiplyAlpha: "none",
    });
    store.decoded.set(index, bitmap);
    evict(store);
  } finally {
    store.decoding.delete(index);
  }
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
    decode(store, source, blob).catch(() => {
      store.decoding.delete(source);
    });
  }
  const shown = nearestInShot(store, target, (index) => store.decoded.has(index));
  const bitmap = shown === undefined ? undefined : store.decoded.get(shown);
  return shown === undefined || bitmap === undefined ? undefined : { index: shown, bitmap };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/* Each shot owns an equal part of the progress; the end of each part but the last dissolves into the next shot.
   frame is a store index: starts[shot] plus the frame inside the shot. */
export function place(progress: number, store: FrameStore): Placement {
  const shots = store.starts.length;
  const scaled = Math.min(Math.max(progress, 0), 1) * shots;
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
import { useEffect, useState } from "react";
import {
  ImageBitmapLoader,
  LinearFilter,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
} from "three";

import type { SceneProps } from "../motion/stage.tsx";
import { createFrameStore, type Frame, type FrameStore, frameAt, place } from "./footage-frames.ts";
import { DISSOLVE_FRAGMENT } from "./footage-shaders.ts";
import { FULL_SCREEN } from "./shader-chunks.ts";
import { StageCanvas } from "./stage-canvas.tsx";
import { useFirstFrame } from "./use-first-frame.ts";

/* From this far into a shot, the next shot's first frame is decoded and waiting on the second texture. */
const PREPARE_NEXT_FROM = 0.5;

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

/* Built imperatively: the material keeps this very uniforms object, while R3F's uniforms prop copies it. */
function createFootage(first: ImageBitmap) {
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
  return { material, uniforms };
}

type FootageState = ReturnType<typeof createFootage>;

function show(texture: Texture<ImageBitmap | undefined>, frame: Frame | undefined): void {
  if (frame === undefined || texture.image === frame.bitmap) {
    return;
  }
  Object.assign(texture, { image: frame.bitmap, needsUpdate: true });
}

/* Mutations live outside the component: the React Compiler lint rejects writing to hook values in useFrame.
   The dissolve stays at 0 until the second texture holds the next shot's first frame: no black, no stale frame. */
function advance(
  footage: FootageState,
  store: FrameStore,
  frame: { delta: number; progress: number },
): void {
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

function FootagePlane({ onReady, shots, progress }: Omit<FootageSceneProps, "tier">) {
  /* The crop follows the stage's own box at mount, not the window or the tier. */
  const size = useThree((state) => state.size);
  const [orientation] = useState<Orientation>(() =>
    size.height > size.width ? "portrait" : "landscape",
  );
  const chosen = shots[orientation];
  /* Suspends until the first frame is decoded: the scene's first frame is the poster's frame. */
  const first = useLoader(ImageBitmapLoader, chosen[0]?.[0] ?? "", (loader) => {
    loader.setOptions({ imageOrientation: "flipY", premultiplyAlpha: "none" });
  });
  const [footage] = useState(() => createFootage(first));
  const [loading] = useState(() => new AbortController());
  const [store] = useState(() => createFrameStore(chosen, loading.signal));
  useEffect(
    () => () => {
      loading.abort();
      footage.material.dispose();
      footage.uniforms.uShotA.value.dispose();
      footage.uniforms.uShotB.value.dispose();
      for (const bitmap of store.decoded.values()) {
        bitmap.close();
      }
    },
    [footage, loading, store],
  );
  useFirstFrame(onReady);
  useFrame((state, delta) => {
    advance(footage, store, { delta, progress: progress.value });
    state.gl.getDrawingBufferSize(footage.uniforms.uResolution.value);
  });
  return (
    <mesh frustumCulled={false} material={footage.material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
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

For a shot past 150 frames, the scene reads `const clip = use(loadClip(url))` instead of a frame store: it suspends until the first frame is decoded, then `advance` calls `clip.seek(local × clip.duration)` and the material samples `clip.texture`. Dispose the clip in the scene's unmount effect.

```ts
import { LinearFilter, VideoTexture } from "three";

/* Closer than this, a seek would land on the frame already shown. */
const SAME_TIME = 0.001;

export interface Clip {
  texture: VideoTexture;
  duration: number;
  seek: (time: number) => void;
  dispose: () => void;
}

const clips = new Map<string, Promise<Clip>>();

/* An all-intra clip (every frame a keyframe) scrubbed by seeking: one seek at a time, always to the latest target,
   because queued seeks make the picture trail the scroll. The texture updates when a seek lands. */
function createClip(url: string, video: HTMLVideoElement): Clip {
  const texture = Object.assign(new VideoTexture(video), {
    minFilter: LinearFilter,
    generateMipmaps: false,
    needsUpdate: true,
  });
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
  function dispose(): void {
    clips.delete(url);
    video.pause();
    video.removeAttribute("src");
    video.load();
    texture.dispose();
  }
  return { texture, duration: video.duration, seek, dispose };
}

/* Resolves at loadeddata: the duration is known and the first frame decoded, so a scene that suspends on it
   (React's use) never fades in black, and every seek fires seeked. Cached by URL, as use() requires. */
export function loadClip(url: string): Promise<Clip> {
  const cached = clips.get(url);
  if (cached !== undefined) {
    return cached;
  }
  const opening = new Promise<Clip>((resolve, reject) => {
    const video = Object.assign(document.createElement("video"), {
      muted: true,
      playsInline: true,
      preload: "auto",
      src: url,
    });
    video.addEventListener("loadeddata", () => {
      resolve(createClip(url, video));
    });
    video.addEventListener("error", () => {
      reject(new Error(`The clip ${url} did not load.`));
    });
  });
  clips.set(url, opening);
  return opening;
}
```

Why it is shaped this way:

- The first frame comes through `useLoader(ImageBitmapLoader, …)`, which suspends: the scene mounts with the poster's frame already decoded, so its first drawn frame is the poster and the crossfade does not pop.
- The crop is chosen from the stage's own box when the scene mounts (`useThree` size), not from the window or the tier: a landscape tablet is `light` but wide, and a stage need not fill the window.
- One store per stage: frames are fetched as compressed blobs (about 6 MB for a whole desktop stage) and decoded on demand with `createImageBitmap`, off the main thread. Only 8 decoded frames stay, the farthest from the playhead closing first; the playhead and the prepared frame never close. 150 decoded 1600×900 frames would take 860 MB.
- The next shot's first frame is decoded from the middle of the current shot and uploaded to the second texture before the dissolve starts; the dissolve stays at 0 until it is there.
- `imageOrientation: "flipY"` at decode, `flipY: false` on the texture: three's `flipY` does nothing on an `ImageBitmap`, and a frame decoded without the flip draws upside down. No mipmaps: a frame change is one upload.
- Materials are built imperatively, and writes go through module-level functions, for the reasons in `shader-craft` §3.
- The clip resolves at `loadeddata`, when the duration is known: a seek before metadata never fires `seeked`, and a `NaN` duration would make every seek target `NaN`. Seeks are coalesced: setting `currentTime` on every scroll frame queues seeks and the picture lags behind the scroll.
