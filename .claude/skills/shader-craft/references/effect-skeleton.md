# Effect skeleton

The modules and tests of a shader effect, checked as written in this repository: `pnpm --filter @repo/ui typecheck`, `oxlint --type-aware`, `oxfmt`, and every test below green in Vitest browser mode (three runs of the full set, 18 of 18). What the tests proved:

- Writing `uProgress` from the page object changes the drawn pixels, also after StrictMode's double mount.
- The copy and the veil paint above the live canvas, the veil lets clicks through, and the stage's pause control stays reachable. With the copy and veil unpositioned, the canvas painted over both (the layering test goes red).
- `useSceneResource` creates twice under StrictMode, disposes the first, never shows a disposed resource, and sends a failed creation to the error boundary.
- The shader test goes red on a compile error (`'undefinedThing' : undeclared identifier`) and on a flat frame (`expected 0 to be greater than 2`).

Rename `Effect` to the effect's name and replace the fragment shader with the recipe. `use-scene-resource.ts`, `use-smoothed-pointer.ts` and `tests/support/canvas-pixels.ts` are shared: the first effect of a project creates them, every later scene imports them.

## `packages/ui/src/motion/<effect>-stage.tsx`

```tsx
"use client";

import { cva } from "class-variance-authority";
import { lazy, type ReactElement, type ReactNode } from "react";

import { Stage } from "./stage.tsx";

/* One import for the stage to prepare and the lazy scene to render. */
function loadEffectScene() {
  return import("../scene/effect-scene.tsx");
}

const LazyEffectScene = lazy(async () => {
  const { EffectScene } = await loadEffectScene();
  return { default: EffectScene };
});

/* cover: the stage fills the window and its poster covers it, cropped like the canvas (coverUv).
   poster: the stage takes the poster's own height, so canvas and poster share one box and aspect. */
const stageVariants = cva("col-start-1 row-start-1 w-full", {
  variants: {
    fit: {
      cover: "h-svh [&_img]:size-full [&_img]:object-cover",
      poster: "[&_img]:h-auto [&_img]:w-full",
    },
  },
});

interface EffectStageProps {
  /* A next/image element of the scene's first frame: the LCP, the reduced-motion page and the accessible name (alt). */
  poster: ReactElement;
  /* A stable { value } object the page's ScrollScene choreography tweens from 0 to 1. */
  progress: { value: number };
  /* The poster's width over height, from its static import: poster.width / poster.height. */
  posterAspect: number;
  fit?: "cover" | "poster";
  /* Copy laid over the effect, on a veil of the background token that keeps it readable over any frame. */
  children?: ReactNode;
}

export function EffectStage({
  poster,
  progress,
  posterAspect,
  fit = "poster",
  children,
}: EffectStageProps) {
  return (
    <div data-slot="effect-stage" className="grid">
      <Stage
        ambient
        className={stageVariants({ fit })}
        poster={poster}
        prepareScene={loadEffectScene}
        renderScene={(scene) => (
          <LazyEffectScene {...scene} progress={progress} posterAspect={posterAspect} />
        )}
      />
      {/* Positioned, so they paint above the stage's positioned scene layer; the veil lets clicks through and fades
          out before the bottom-end corner, where the stage's pause control sits, and the copy box hugs its content. */}
      {children === undefined ? null : (
        <>
          <div
            aria-hidden
            className="pointer-events-none relative col-start-1 row-start-1 bg-linear-to-r from-background to-transparent"
          />
          <div className="relative col-start-1 row-start-1 self-center justify-self-start">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
```

- `fit="cover"`: the stage is sized by its class (`h-svh`, the height a `ScrollScene` holds: a phone toolbar that collapses mid-scroll never resizes it or its canvas), the poster layer fills it, and the image covers it (`object-fit: cover`) exactly as `coverUv` crops the canvas. Pass a `next/image` with `fill`, or any image: the wrapper sizes it.
- `fit="poster"`: the stage takes the poster's own height; canvas and poster share one box, and `coverUv` is the identity.
- **Layering.** `Stage` is positioned and its scene layer too, so anything after it in the grid paints under the canvas unless it is positioned: the veil and the copy are `relative`. The veil ignores the pointer (`pointer-events-none`), and the copy box hugs its content (`justify-self-start`), so neither covers the stage's pause control in the bottom-end corner. The veil sits on the side where the copy is; change the gradient direction in the component, never in the page, and keep the copy out of the bottom-end corner. Its opacity follows the contrast rule of `SKILL.md` §6.
- `pauseLabel` and `playLabel` of `Stage` default to English: pass the page language's words through the effect component when the site is not in English.

## `packages/ui/src/scene/use-scene-resource.ts`

```ts
import { useEffect, useState } from "react";

/* A GPU or network resource, created in the effect that disposes it. In development, StrictMode mounts, cleans up
   and mounts again (React Three Fiber applies it inside the canvas too): a resource made during render and disposed
   in a cleanup would stay disposed while still in use. Null until created; inputs that change re-create it. The
   resource is published like a subscription's value, unless the cleanup came first. An error thrown by create
   reaches the nearest error boundary, so a scene that fails falls back to its poster. */
export function useSceneResource<Resource, Inputs extends unknown[]>(
  create: (...inputs: Inputs) => Resource,
  dispose: (resource: Resource) => void,
  ...inputs: Inputs
): Resource | null {
  const [resource, setResource] = useState<Resource | null>(null);
  useEffect(
    () => {
      const created = create(...inputs);
      let current = true;
      queueMicrotask(() => {
        if (current) {
          setResource(created);
        }
      });
      return () => {
        current = false;
        dispose(created);
      };
    },
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- every input is a dependency, compared one by one; a call site always passes the same number.
    [create, dispose, ...inputs],
  );
  return resource;
}
```

A scene renders a child once the resource exists, and that child calls `useFirstFrame`: the first frame the stage hears about is a drawn one. `create` and `dispose` are module-level functions (stable), and the inputs are values that only change when the resource must be rebuilt.

## `packages/ui/src/scene/use-smoothed-pointer.ts`

```ts
import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect, useState } from "react";
import { Vector2 } from "three";

import { duration, ease } from "../motion/tokens.ts";

/* The mouse over the canvas, from -1 to 1 on both axes, smoothed on the GSAP ticker. A finger means scroll: only
   mouse pointers steer. Listened on the window, because copy laid over the canvas would swallow canvas events. */
export function useSmoothedPointer(): Vector2 {
  const canvas = useThree((state) => state.gl.domElement);
  const [pointer] = useState(() => new Vector2());
  useEffect(() => {
    const toX = gsap.quickTo(pointer, "x", { duration: duration.slow, ease: ease.standard });
    const toY = gsap.quickTo(pointer, "y", { duration: duration.slow, ease: ease.standard });
    const listening = new AbortController();
    function follow(event: PointerEvent): void {
      if (event.pointerType !== "mouse") {
        return;
      }
      const box = canvas.getBoundingClientRect();
      toX(((event.clientX - box.left) / box.width) * 2 - 1);
      toY(1 - ((event.clientY - box.top) / box.height) * 2);
    }
    window.addEventListener("pointermove", follow, { passive: true, signal: listening.signal });
    return () => {
      listening.abort();
      gsap.killTweensOf(pointer);
    };
  }, [canvas, pointer]);
  return pointer;
}
```

## `packages/ui/src/scene/<effect>-scene.tsx`

```tsx
"use client";

import { useFrame } from "@react-three/fiber";
import { ShaderMaterial, Vector2 } from "three";

import type { QualityTier } from "../lib/quality-tier.ts";
import type { SceneProps } from "../motion/stage.tsx";
import { COVER_UV, FULL_SCREEN } from "./shader-chunks.ts";
import { StageCanvas } from "./stage-canvas.tsx";
import { useFirstFrame } from "./use-first-frame.ts";
import { useSceneResource } from "./use-scene-resource.ts";
import { useSmoothedPointer } from "./use-smoothed-pointer.ts";

const MARCH_STEPS: Record<QualityTier, number> = { light: 48, full: 96 };
/* Replace with the effect's shader; the chunks it needs come from shader-chunks.ts. */
const fragmentShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  uniform float uPosterAspect;
  ${COVER_UV}
  void main() {
    vec2 uv = coverUv(gl_FragCoord.xy, uResolution, uPosterAspect);
    gl_FragColor = vec4(uv, uProgress, 1.0);
    #include <colorspace_fragment>
  }
`;

interface EffectPlaneProps extends SceneProps {
  progress: { value: number };
  /* The poster's width over height: coverUv frames the canvas like the poster in any box. */
  posterAspect: number;
}

/* Built imperatively: the material keeps this very uniforms object, while R3F's uniforms prop copies it. */
export function createEffect(pointer: Vector2, tier: QualityTier, posterAspect: number) {
  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPointer: { value: pointer },
    uResolution: { value: new Vector2() },
    uPosterAspect: { value: posterAspect },
  };
  const material = new ShaderMaterial({
    uniforms,
    defines: { MAX_STEPS: MARCH_STEPS[tier] },
    vertexShader: FULL_SCREEN,
    fragmentShader,
  });
  return { material, uniforms };
}

type Effect = ReturnType<typeof createEffect>;

function disposeEffect({ material }: Effect): void {
  material.dispose();
}

/* Mutations live outside the component: the React Compiler lint rejects writing to hook values in useFrame.
   The first frame always gets a 0.1 s delta, so it draws at uTime 0.1 on every load: the frame the poster shows. */
function advance(uniforms: Effect["uniforms"], frame: { delta: number; progress: number }): void {
  const { uTime, uProgress } = uniforms;
  uTime.value += frame.delta;
  uProgress.value = frame.progress;
}

/* Rendered once the material exists, so the first frame it reports is a drawn one. */
function EffectFrame({
  effect,
  onReady,
  progress,
}: { effect: Effect } & Omit<EffectPlaneProps, "tier" | "posterAspect">) {
  useFirstFrame(onReady);
  useFrame((state, delta) => {
    advance(effect.uniforms, { delta, progress: progress.value });
    state.gl.getDrawingBufferSize(effect.uniforms.uResolution.value);
  });
  return (
    <mesh frustumCulled={false} material={effect.material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

function EffectPlane({ tier, onReady, progress, posterAspect }: EffectPlaneProps) {
  const pointer = useSmoothedPointer();
  const effect = useSceneResource(createEffect, disposeEffect, pointer, tier, posterAspect);
  return effect === null ? null : (
    <EffectFrame effect={effect} onReady={onReady} progress={progress} />
  );
}

export function EffectScene(props: EffectPlaneProps) {
  return (
    <StageCanvas tier={props.tier} flat className="absolute inset-0">
      <EffectPlane {...props} />
    </StageCanvas>
  );
}
```

Why it is shaped this way:

- The `ShaderMaterial` is built imperatively and passed as `material`: React Three Fiber 9 copies a `uniforms` prop into the material's own uniform objects, so writes to the object you passed never reach the GPU. A material constructed with `uniforms` keeps that very object.
- It is created in the effect that disposes it (`useSceneResource`): in development, StrictMode mounts, cleans up and mounts again, inside the canvas too, and a resource made during render would stay disposed while in use. three happens to rebuild a disposed material on its next render, but loaders, videos and simulations do not: one rule for all of them.
- `advance` lives outside the component because the React Compiler lint (`react(immutability)`) rejects writing to a hook value inside a `useFrame` callback.
- `createEffect` is exported: the shader test builds the material with it, without mounting a stage.
- A paused stage stops advancing the canvas: `uTime` stops with it and the frame holds.
- Token colours: wrap the canvas in a host `div` (`const [host, setHost] = useState<HTMLDivElement | null>(null)`), resolve the tokens on it and write them into colour uniforms when they change (`SKILL.md` §6).

## `packages/ui/tests/<effect>-scene.test.tsx`

Tests first: write this file before the shader, watch it fail, then make it pass. `onShaderError` turns a compile or link error into a thrown error (three only logs it otherwise), the readback catches a shader that compiles but draws nothing, with the motion audit's own blank threshold, and the StrictMode case catches a resource disposed by the first cleanup.

```tsx
import { StrictMode } from "react";
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  type ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { QualityTier } from "../src/lib/quality-tier.ts";
import { createEffect, EffectScene } from "../src/scene/effect-scene.tsx";
import { canvasIn, canvasPixels, countPixels } from "./support/canvas-pixels.ts";

const SIZE = 32;
/* The motion audit's blank threshold (ADR-0026): luminance spread under 2 is an empty canvas. */
const BLANK_SPREAD = 2;

/* Draws one frame of the material, failing on any compile or link error instead of logging it. */
function drawOnce(material: ShaderMaterial): Uint8Array {
  const renderer = new WebGLRenderer();
  renderer.setSize(SIZE, SIZE);
  renderer.debug.onShaderError = (gl, ...[, vertexShader, fragmentShader]) => {
    const logs = [gl.getShaderInfoLog(fragmentShader), gl.getShaderInfoLog(vertexShader)];
    throw new Error(
      logs.filter((log) => log !== null && log !== "").join("\n") || "The shader did not link.",
    );
  };
  const scene = new Scene().add(new Mesh(new PlaneGeometry(2, 2), material));
  renderer.render(scene, new OrthographicCamera());
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  const gl = renderer.getContext();
  gl.readPixels(0, 0, SIZE, SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  renderer.dispose();
  return pixels;
}

function luminanceSpread(pixels: Uint8Array): number {
  const luminance = Array.from({ length: pixels.length / 4 }, (_, index) => {
    const offset = index * 4;
    return (
      0.2126 * (pixels[offset] ?? 0) +
      0.7152 * (pixels[offset + 1] ?? 0) +
      0.0722 * (pixels[offset + 2] ?? 0)
    );
  });
  const mean = luminance.reduce((sum, value) => sum + value, 0) / luminance.length;
  return Math.sqrt(
    luminance.reduce((sum, value) => sum + (value - mean) ** 2, 0) / luminance.length,
  );
}

describe("effect scene shader", () => {
  it.each<QualityTier>(["light", "full"])(
    "compiles and draws a frame that is not blank on the %s tier",
    (tier) => {
      const { material, uniforms } = createEffect(new Vector2(), tier, 16 / 9);
      uniforms.uResolution.value.set(SIZE, SIZE);

      expect(luminanceSpread(drawOnce(material))).toBeGreaterThan(BLANK_SPREAD);
    },
  );
});

describe("effect scene under StrictMode", () => {
  it("keeps writing its uniforms after the double mount of development", async () => {
    const progress = { value: 0 };
    const ready = vi.fn<() => void>();
    const screen = await render(
      <StrictMode>
        <div style={{ width: 200, height: 100, position: "relative" }}>
          <EffectScene tier="light" onReady={ready} progress={progress} posterAspect={2} />
        </div>
      </StrictMode>,
    );
    await expect.poll(() => ready.mock.calls.length, { timeout: 15_000 }).toBe(1);
    const canvas = canvasIn(screen.container);

    progress.value = 1;

    await expect
      .poll(
        async () => countPixels(await canvasPixels(canvas), (_red, _green, blue) => blue > 245),
        { timeout: 5000 },
      )
      .toBeGreaterThan(1000);
  });
});
```

## `packages/ui/tests/<effect>-stage.test.tsx`

```tsx
import "../src/styles/globals.css";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { EffectStage } from "../src/motion/effect-stage.tsx";
import { LIVE_TIMEOUT } from "../stories/support/live-timeout.ts";
import { DESKTOP } from "./support/viewports.ts";

/* A flat poster, enough for the stage to frame. */
function posterUrl(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 90;
  return canvas.toDataURL();
}

function centreOf(element: Element): [x: number, y: number] {
  const box = element.getBoundingClientRect();
  return [box.left + box.width / 2, box.top + box.height / 2];
}

/* What a pointer at that place would hit, with the veil made hittable for the check: it paints above the canvas. */
function paintedAt(veil: HTMLElement, [x, y]: [number, number]): Element | null {
  veil.style.setProperty("pointer-events", "auto");
  const top = document.elementFromPoint(x, y);
  veil.style.removeProperty("pointer-events");
  return top;
}

function veilIn(container: HTMLElement): HTMLElement {
  const veil = container.querySelector<HTMLElement>("[data-slot=effect-stage] > [aria-hidden]");
  if (veil === null) {
    throw new Error("The stage has no veil.");
  }
  return veil;
}

async function renderLiveStage() {
  await page.viewport(DESKTOP.width, DESKTOP.height);
  const screen = await render(
    <EffectStage
      fit="cover"
      progress={{ value: 0 }}
      posterAspect={16 / 9}
      poster={<img src={posterUrl()} alt="Poster" />}
    >
      <p>A headline that must stay readable</p>
    </EffectStage>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Pause animation" }), LIVE_TIMEOUT)
    .toBeVisible();
  return screen;
}

describe("EffectStage layering", () => {
  it("paints the copy above the live scene", async () => {
    const screen = await renderLiveStage();
    const copy = screen.getByText("A headline that must stay readable").element();

    expect(document.elementFromPoint(...centreOf(copy))).toBe(copy);
  });

  it("paints the veil above the scene and lets pointer events through it", async () => {
    const screen = await renderLiveStage();
    const veil = veilIn(screen.container);
    const corner: [number, number] = [40, DESKTOP.height - 40];

    expect(paintedAt(veil, corner)).toBe(veil);
    expect(document.elementFromPoint(...corner)?.tagName).toBe("CANVAS");
  });

  it("keeps the stage's pause control reachable", async () => {
    const screen = await renderLiveStage();
    const pause = screen.getByRole("button", { name: "Pause animation" }).element();

    expect(document.elementFromPoint(...centreOf(pause))?.closest("button")).toBe(pause);
  });
});
```

## `packages/ui/tests/use-scene-resource.test.tsx`

```tsx
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { SilentBoundary } from "../src/lib/silent-boundary.tsx";
import { useSceneResource } from "../src/scene/use-scene-resource.ts";

interface Resource {
  label: string;
  disposed: boolean;
}

let made = 0;

function create(label: string): Resource {
  made += 1;
  return { label, disposed: false };
}

function dispose(resource: Resource): void {
  Object.assign(resource, { disposed: true });
}

function fail(): Resource {
  throw new Error("The resource could not be created.");
}

function Probe({
  make,
  seen,
}: {
  make: (label: string) => Resource;
  seen: (resource: Resource) => void;
}) {
  const resource = useSceneResource(make, dispose, "probe");
  if (resource !== null) {
    seen(resource);
  }
  return null;
}

describe("useSceneResource", () => {
  it("re-creates the resource on StrictMode's second mount and only ever shows a live one", async () => {
    made = 0;
    const seen = vi.fn<(resource: Resource) => void>();
    await render(
      <StrictMode>
        <Probe make={create} seen={seen} />
      </StrictMode>,
    );

    await expect.poll(() => seen.mock.calls.length).toBeGreaterThan(0);
    expect(made).toBe(2);
    expect(seen.mock.calls.every(([resource]) => !resource.disposed)).toBe(true);
  });

  it("sends a failed creation to the error boundary, so the poster stays", async () => {
    const fallBack = vi.fn<() => void>();
    await render(
      <SilentBoundary onError={fallBack}>
        <Probe make={fail} seen={vi.fn<(resource: Resource) => void>()} />
      </SilentBoundary>,
    );

    await expect.poll(() => fallBack.mock.calls.length).toBe(1);
  });
});
```

## `packages/ui/tests/support/canvas-pixels.ts`

```ts
import { page } from "vitest/browser";

const GRID = { width: 64, height: 36 };

export function canvasIn(container: HTMLElement): HTMLCanvasElement {
  const canvas = container.querySelector("canvas");
  if (canvas === null) {
    throw new Error("The scene drew no canvas.");
  }
  return canvas;
}

/* What the page shows of a canvas, on a small grid. A screenshot, because a WebGL canvas drawn without
   preserveDrawingBuffer reads back empty once its frame is presented. */
export async function canvasPixels(canvas: HTMLCanvasElement): Promise<Uint8ClampedArray> {
  const base64 = await page.screenshot({ element: canvas, save: false });
  const bytes = Uint8Array.from(atob(base64), (character) => character.codePointAt(0) ?? 0);
  const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
  const probe = new OffscreenCanvas(GRID.width, GRID.height);
  const context = probe.getContext("2d");
  context?.drawImage(bitmap, 0, 0, GRID.width, GRID.height);
  bitmap.close();
  return context?.getImageData(0, 0, GRID.width, GRID.height).data ?? new Uint8ClampedArray();
}

export function countPixels(
  pixels: Uint8ClampedArray,
  matches: (red: number, green: number, blue: number) => boolean,
): number {
  let count = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (matches(pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0)) {
      count += 1;
    }
  }
  return count;
}
```

## `apps/web/src/features/<feature>/<name>-scene.tsx`

```tsx
"use client";

import { EffectStage } from "@repo/ui/motion/effect-stage";
import { ScrollScene } from "@repo/ui/motion/scroll-scene";
import Image from "next/image";
import { useState } from "react";

import poster from "./images/<slot>-poster.avif";

export function EffectHero() {
  const [progress] = useState(() => ({ value: 0 }));
  function choreography(timeline: gsap.core.Timeline): void {
    timeline.to(progress, { value: 1, ease: "none" }, 0);
  }
  return (
    <ScrollScene choreography={choreography} length="medium">
      <EffectStage
        fit="cover"
        progress={progress}
        posterAspect={poster.width / poster.height}
        poster={
          <Image
            src={poster}
            alt="<what the first frame shows>"
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
          />
        }
      />
    </ScrollScene>
  );
}
```

The page owns the progress object (`useState` keeps it stable) and tweens it beside its copy reveals; the scene reads it every frame. Under reduced motion the choreography never runs and the poster stays. `posterAspect` comes from the static import's intrinsic size.
