# Effect skeleton

Four files that typecheck, lint and format as written in this repository (`pnpm --filter @repo/ui typecheck`, `oxlint --type-aware`, `oxfmt`), and that were run in a browser (Vitest browser mode): writing `uProgress` from the page object changes the drawn pixels; in `cover` mode the stage fills the window and poster, image and canvas share its box; in `poster` mode the stage takes the poster's height and the canvas matches it; an ambient stage shows its pause control once live. The test file goes red on a compile error and on a blank frame. Rename `Effect` to the effect's name and replace the fragment shader with the recipe.

## `packages/ui/src/motion/<effect>-stage.tsx`

```tsx
"use client";

import { cva } from "class-variance-authority";
import { lazy, type ReactElement, type ReactNode } from "react";

import { Stage } from "./stage.tsx";

const LazyEffectScene = lazy(async () => {
  const { EffectScene } = await import("../scene/effect-scene.tsx");
  return { default: EffectScene };
});

/* cover: the stage fills the window and its poster covers it, cropped like the canvas (coverUv).
   poster: the stage takes the poster's own height, so canvas and poster share one box and aspect. */
const stageVariants = cva("col-start-1 row-start-1 w-full", {
  variants: {
    fit: {
      cover: "h-dvh [&_img]:size-full [&_img]:object-cover",
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
        renderScene={(scene) => (
          <LazyEffectScene {...scene} progress={progress} posterAspect={posterAspect} />
        )}
      />
      {children === undefined ? null : (
        <>
          <div
            aria-hidden
            className="col-start-1 row-start-1 bg-linear-to-r from-background to-transparent"
          />
          <div className="col-start-1 row-start-1 self-center">{children}</div>
        </>
      )}
    </div>
  );
}
```

- `fit="cover"`: the stage is sized by its class (`h-dvh`), the poster layer fills it, and the image covers it (`object-fit: cover`) exactly as `coverUv` crops the canvas. Pass a `next/image` with `fill`, or any image: the wrapper sizes it.
- `fit="poster"`: the stage takes the poster's own height; canvas and poster share one box, and `coverUv` is the identity.
- The veil sits on the side where the copy is: change the gradient direction in the component, never in the page. Its opacity is set by the contrast rule of `SKILL.md` §6.
- `pauseLabel` and `playLabel` of `Stage` default to English: pass the page language's words through the effect component when the site is not in English.

## `packages/ui/src/scene/<effect>-scene.tsx`

```tsx
"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect, useState } from "react";
import { ShaderMaterial, Vector2 } from "three";

import type { QualityTier } from "../lib/quality-tier.ts";
import type { SceneProps } from "../motion/stage.tsx";
import { duration, ease } from "../motion/tokens.ts";
import { COVER_UV, FULL_SCREEN } from "./shader-chunks.ts";
import { StageCanvas } from "./stage-canvas.tsx";
import { useFirstFrame } from "./use-first-frame.ts";

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

function useSmoothedPointer(): Vector2 {
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

type EffectUniforms = ReturnType<typeof createEffect>["uniforms"];

/* Mutations live outside the component: the React Compiler lint rejects writing to hook values in useFrame.
   The first frame always gets a 0.1 s delta, so it draws at uTime 0.1 on every load: the frame the poster shows. */
function advance(uniforms: EffectUniforms, frame: { delta: number; progress: number }): void {
  const { uTime, uProgress } = uniforms;
  uTime.value += frame.delta;
  uProgress.value = frame.progress;
}

function EffectPlane({ tier, onReady, progress, posterAspect }: EffectPlaneProps) {
  const pointer = useSmoothedPointer();
  const [effect] = useState(() => createEffect(pointer, tier, posterAspect));
  useEffect(
    () => () => {
      effect.material.dispose();
    },
    [effect],
  );
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
- `advance` lives outside the component because the React Compiler lint (`react(immutability)`) rejects writing to a `useState` or `useMemo` value inside a `useFrame` callback, and reading `ref.current` during render (`react(refs)`) rules out a ref-held uniforms object.
- `createEffect` is exported: the shader test builds the material with it, without mounting a stage.
- The material is disposed on unmount; the stage unmounts the scene on a lost context, reduced motion or an error. A paused stage stops advancing the canvas: `uTime` stops with it and the frame holds.
- Token colours: wrap the canvas in a host `div` (`const [host, setHost] = useState<HTMLDivElement | null>(null)`), resolve the tokens on it and write them into colour uniforms when they change (`SKILL.md` §6).

## `packages/ui/tests/<effect>-scene.test.tsx`

Tests first: write this file before the shader, watch it fail, then make it pass. `onShaderError` turns a compile or link error into a thrown error (three only logs it otherwise), and the readback catches a shader that compiles but draws nothing, with the motion audit's own blank threshold.

```tsx
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  type ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";
import { describe, expect, it } from "vitest";

import type { QualityTier } from "../src/lib/quality-tier.ts";
import { createEffect } from "../src/scene/effect-scene.tsx";

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
