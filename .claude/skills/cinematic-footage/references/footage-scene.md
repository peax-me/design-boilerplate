# Footage scene

Four modules that typecheck, lint and format as written in this repository, run in a browser (Vitest browser mode, the package's own set-up) on two short AVIF sequences: frames load coarse to fine (`0, 11, 8, 4, 2, 6, 10, 1, …` for 12 frames), the first frame draws upright, mid-scroll the next shot has burnt through 43 % of the frame along a lit seam, and the last shot ends complete. The scrubber was run on an all-intra MP4: four quick seeks landed on the last target, and the texture changed after `seeked`.

Rename `footage` to the effect's name. The effect component composes `Stage` like any effect (`shader-craft` `references/effect-skeleton.md`) and, inside `renderScene` (client-only, after the stage's triggers), picks the frame set by the stage's orientation and passes `shots`, `frameAspect` and `progress`:

```tsx
renderScene={(scene) => {
  const portrait = window.matchMedia("(orientation: portrait)").matches;
  return (
    <LazyFootageScene
      {...scene}
      progress={progress}
      shots={portrait ? portraitShots : landscapeShots}
      frameAspect={portrait ? 506 / 900 : 1600 / 900}
    />
  );
}}
```

The app builds the URLs with `process.env.NEXT_PUBLIC_BASE_PATH` (`${base}/media/<feature>/<slot>/${String(index + 1).padStart(4, "0")}.avif`).

## `packages/ui/src/scene/<effect>-frames.ts`

```ts
/* Frames load several at a time, at low priority: the page's own requests go first. */
const LOAD_CONCURRENCY = 6;
/* Decoded frames kept around the playhead: a 1600×900 frame is 5.8 MB once decoded, the compressed one about 40 KB. */
const DECODED_FRAMES = 8;
/* The share of each shot's scroll during which the next shot dissolves in. */
const DISSOLVE_SHARE = 0.2;

export interface Frame {
  index: number;
  bitmap: ImageBitmap;
}

export interface FrameStore {
  blobs: Array<Blob | undefined>;
  decoded: Map<number, ImageBitmap>;
  decoding: Set<number>;
}

export interface Placement {
  shot: number;
  frame: number;
  dissolve: number;
}

/* Both ends first, then every 2^k-th frame down to every frame: the scrub works at once and sharpens as it loads. */
export function coarseToFine(count: number): number[] {
  const order = new Set([0, count - 1]);
  for (let stride = 2 ** Math.floor(Math.log2(Math.max(count - 1, 1))); stride >= 1; stride /= 2) {
    for (let index = 0; index < count; index += stride) {
      order.add(index);
    }
  }
  return [...order];
}

export function loadFrames(urls: string[], signal: AbortSignal): FrameStore {
  const blobs: Array<Blob | undefined> = Array.from({ length: urls.length });
  const queue = coarseToFine(urls.length);
  async function work(): Promise<void> {
    for (let index = queue.shift(); index !== undefined; index = queue.shift()) {
      // oxlint-disable-next-line no-await-in-loop -- each worker fetches one frame at a time, in coarse-to-fine order.
      const response = await fetch(urls[index] ?? "", { signal, priority: "low" });
      // oxlint-disable-next-line no-await-in-loop -- same worker: the body is read before the next request.
      blobs[index] = await response.blob();
    }
  }
  /* Aborted on unmount; a frame that fails stays missing and its neighbours stand in. */
  Promise.all(Array.from({ length: LOAD_CONCURRENCY }, work)).catch(() => null);
  return { blobs, decoded: new Map(), decoding: new Set() };
}

function nearest(
  index: number,
  has: (candidate: number) => boolean,
  count: number,
): number | undefined {
  for (let offset = 0; offset < count; offset += 1) {
    if (has(index - offset)) {
      return index - offset;
    }
    if (has(index + offset)) {
      return index + offset;
    }
  }
  return undefined;
}

function keepAround(store: FrameStore, index: number): void {
  const farthest = [...store.decoded.keys()].toSorted(
    (first, second) => Math.abs(second - index) - Math.abs(first - index),
  );
  for (const evicted of farthest.slice(0, Math.max(store.decoded.size - DECODED_FRAMES, 0))) {
    store.decoded.get(evicted)?.close();
    store.decoded.delete(evicted);
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
    keepAround(store, index);
  } finally {
    store.decoding.delete(index);
  }
}

/* The closest decoded frame to the playhead, while the exact one decodes off the main thread. */
export function frameAt(store: FrameStore, index: number): Frame | undefined {
  const count = store.blobs.length;
  const source = nearest(index, (candidate) => store.blobs[candidate] !== undefined, count);
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
  const shown = nearest(index, (candidate) => store.decoded.has(candidate), count);
  const bitmap = shown === undefined ? undefined : store.decoded.get(shown);
  return shown === undefined || bitmap === undefined ? undefined : { index: shown, bitmap };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/* Each shot owns an equal part of the progress; the end of each part but the last dissolves into the next shot. */
export function place(progress: number, frameCounts: readonly number[]): Placement {
  const shots = frameCounts.length;
  const scaled = Math.min(Math.max(progress, 0), 1) * shots;
  const shot = Math.min(Math.floor(scaled), shots - 1);
  const local = scaled - shot;
  const frames = frameCounts[shot] ?? 1;
  const dissolve = shot < shots - 1 ? smoothstep(1 - DISSOLVE_SHARE, 1, local) : 0;
  return { shot, frame: Math.round(local * (frames - 1)), dissolve };
}
```

## `packages/ui/src/scene/<effect>-shaders.ts`

```ts
export const FULL_SCREEN = `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* Two shots crossed by a noise threshold: the next shot burns through the current one along an organic edge.
   PCG hash (Jarzynski and Olano, JCGT 2020), gradient noise and coverUv as in the shader-craft recipes. */
export const DISSOLVE_FRAGMENT = `
  #define OCTAVES 4
  uniform sampler2D uShotA;
  uniform sampler2D uShotB;
  uniform float uDissolve;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uFrameAspect;

  uint pcg(uint value) {
    uint state = value * 747796405u + 2891336453u;
    uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
  }
  float hash(ivec2 cell) {
    return float(pcg(uint(cell.x) + pcg(uint(cell.y)))) / 4294967295.0;
  }
  vec2 gradientAt(ivec2 cell) {
    float angle = 6.2831853 * hash(cell);
    return vec2(cos(angle), sin(angle));
  }
  float gradientNoise(vec2 p) {
    ivec2 cell = ivec2(floor(p));
    vec2 f = fract(p);
    vec2 fade = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = dot(gradientAt(cell), f);
    float b = dot(gradientAt(cell + ivec2(1, 0)), f - vec2(1.0, 0.0));
    float c = dot(gradientAt(cell + ivec2(0, 1)), f - vec2(0.0, 1.0));
    float d = dot(gradientAt(cell + ivec2(1, 1)), f - vec2(1.0, 1.0));
    return mix(mix(a, b, fade.x), mix(c, d, fade.x), fade.y);
  }
  float fbm(vec2 p) {
    const mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
    float sum = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < OCTAVES; octave++) {
      sum += amplitude * gradientNoise(p);
      p = turn * p * 2.03;
      amplitude *= 0.5;
    }
    return sum;
  }
  vec2 coverUv(vec2 fragCoord, vec2 resolution, float posterAspect) {
    float canvasAspect = resolution.x / resolution.y;
    vec2 scale = canvasAspect > posterAspect
      ? vec2(1.0, posterAspect / canvasAspect)
      : vec2(canvasAspect / posterAspect, 1.0);
    return (fragCoord / resolution - 0.5) * scale + 0.5;
  }

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

import { useFrame, useLoader } from "@react-three/fiber";
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
import { type Frame, type FrameStore, frameAt, loadFrames, place } from "./footage-frames.ts";
import { DISSOLVE_FRAGMENT, FULL_SCREEN } from "./footage-shaders.ts";
import { StageCanvas } from "./stage-canvas.tsx";
import { useFirstFrame } from "./use-first-frame.ts";

interface FootageSceneProps extends SceneProps {
  /* Frame URLs of each shot, in story order, for the stage's orientation, built by the app with NEXT_PUBLIC_BASE_PATH. */
  shots: string[][];
  /* Tweened from 0 to 1 by the page's ScrollScene choreography. */
  progress: { value: number };
  /* Width over height of the frames: the canvas covers like the poster does. */
  frameAspect: number;
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
function createFootage(first: ImageBitmap, frameAspect: number) {
  const uniforms = {
    uShotA: { value: frameTexture(first) },
    uShotB: { value: frameTexture() },
    uDissolve: { value: 0 },
    uTime: { value: 0 },
    uResolution: { value: new Vector2() },
    uFrameAspect: { value: frameAspect },
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

/* Mutations live outside the component: the React Compiler lint rejects writing to hook values in useFrame. */
function advance(
  footage: FootageState,
  stores: FrameStore[],
  frame: { delta: number; progress: number },
): void {
  const { uShotA, uShotB, uDissolve, uTime } = footage.uniforms;
  const placement = place(
    frame.progress,
    stores.map((store) => store.blobs.length),
  );
  const current = stores[placement.shot];
  const next = stores[placement.shot + 1];
  show(uShotA.value, current === undefined ? undefined : frameAt(current, placement.frame));
  if (placement.dissolve > 0 && next !== undefined) {
    show(uShotB.value, frameAt(next, 0));
  }
  uDissolve.value = placement.dissolve;
  uTime.value += frame.delta;
}

function FootagePlane({ onReady, shots, progress, frameAspect }: Omit<FootageSceneProps, "tier">) {
  /* Suspends until the first frame is decoded: the scene's first frame is the poster's frame. */
  const first = useLoader(ImageBitmapLoader, shots[0]?.[0] ?? "", (loader) => {
    loader.setOptions({ imageOrientation: "flipY", premultiplyAlpha: "none" });
  });
  const [footage] = useState(() => createFootage(first, frameAspect));
  const [loading] = useState(() => new AbortController());
  const [stores] = useState(() => shots.map((urls) => loadFrames(urls, loading.signal)));
  useEffect(
    () => () => {
      loading.abort();
      footage.material.dispose();
      footage.uniforms.uShotA.value.dispose();
      footage.uniforms.uShotB.value.dispose();
      for (const bitmap of stores.flatMap((store) => [...store.decoded.values()])) {
        bitmap.close();
      }
    },
    [footage, loading, stores],
  );
  useFirstFrame(onReady);
  useFrame((state, delta) => {
    advance(footage, stores, { delta, progress: progress.value });
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

## `packages/ui/src/scene/<effect>-scrubber.ts` (beyond 150 frames)

Replace the frame store with this when a shot needs more than 150 frames: the scene's `uShotA` becomes `scrubber.texture`, and `advance` calls `seek(placement local progress × duration)` instead of `frameAt`.

```ts
import { LinearFilter, VideoTexture } from "three";

/* An all-intra clip (every frame a keyframe) scrubbed by seeking: one seek at a time, always to the latest target,
   because queued seeks make the picture trail the scroll. The texture updates when a seek lands. */
export function createScrubber(url: string): {
  texture: VideoTexture;
  seek: (time: number) => void;
} {
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
  let seeking = false;
  let target: number | undefined;
  function seek(time: number): void {
    if (seeking) {
      target = time;
      return;
    }
    seeking = true;
    video.currentTime = time;
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
  return { texture, seek };
}
```

Why it is shaped this way:

- The first frame comes through `useLoader(ImageBitmapLoader, …)`, which suspends: the scene mounts with the poster's frame already decoded, so its first drawn frame is the poster and the crossfade does not pop.
- Frames are fetched as compressed blobs (about 6 MB for a whole desktop sequence) and decoded on demand with `createImageBitmap`, off the main thread. Only 8 decoded frames stay in memory around the playhead: 150 decoded 1600×900 frames would take 860 MB.
- `imageOrientation: "flipY"` at decode, `flipY: false` on the texture: three's `flipY` does nothing on an `ImageBitmap`, and a frame decoded without the flip draws upside down.
- No mipmaps on frame textures: each frame change is one upload, not a mipmap chain.
- Materials are built imperatively, and writes go through module-level functions, for the reasons in `shader-craft` §3.
- Seeks on a video are coalesced: setting `currentTime` on every scroll frame queues seeks and the picture lags behind the scroll.
