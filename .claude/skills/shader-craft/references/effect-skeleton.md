# Effect skeleton

Three files that typecheck, lint and format as written in this repository (`pnpm --filter @repo/ui typecheck`, `oxlint --type-aware`, `oxfmt`), and whose uniforms were checked in a browser: writing `uProgress` from the page object changes the drawn pixels. Rename `Effect` to the effect's name, replace the fragment shader with the recipe, and keep the structure: it carries the clock, pointer and lint rules of `SKILL.md` §3.

## `packages/ui/src/motion/<effect>-stage.tsx`

```tsx
"use client";

import { lazy, type ReactElement } from "react";

import { Stage } from "./stage.tsx";

const LazyEffectScene = lazy(async () => {
  const { EffectScene } = await import("../scene/effect-scene.tsx");
  return { default: EffectScene };
});

interface EffectStageProps {
  /* A next/image element of the scene's first frame: the LCP, the reduced-motion page and the accessible name (alt). */
  poster: ReactElement;
  /* A stable { value } object the page's ScrollScene choreography tweens from 0 to 1. */
  progress: { value: number };
}

export function EffectStage({ poster, progress }: EffectStageProps) {
  return (
    <Stage
      ambient
      poster={poster}
      renderScene={(scene) => <LazyEffectScene {...scene} progress={progress} />}
    />
  );
}
```

When copy sits on the effect, the component takes it as `children` and owns the layering in one grid cell: the `Stage`, a veil (a gradient of the background token, as a `cva` variant), then the copy. Frame the poster image like the canvas: `object-fit: cover` in the same box (`[&_img]:size-full [&_img]:object-cover` on the wrapper, as `Media` does).

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
import { StageCanvas } from "./stage-canvas.tsx";
import { useFirstFrame } from "./use-first-frame.ts";

const FULL_SCREEN = `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const MARCH_STEPS: Record<QualityTier, number> = { light: 48, full: 96 };
const fragmentShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  void main() {
    gl_FragColor = vec4(gl_FragCoord.xy / uResolution, uProgress, 1.0);
    #include <colorspace_fragment>
  }
`;

interface EffectPlaneProps extends SceneProps {
  progress: { value: number };
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
function createEffect(pointer: Vector2, tier: QualityTier) {
  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPointer: { value: pointer },
    uResolution: { value: new Vector2() },
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

function EffectPlane({ tier, onReady, progress }: EffectPlaneProps) {
  const pointer = useSmoothedPointer();
  const [effect] = useState(() => createEffect(pointer, tier));
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

export function EffectScene({ tier, onReady, progress }: EffectPlaneProps) {
  return (
    <StageCanvas tier={tier} flat className="absolute inset-0">
      <EffectPlane tier={tier} onReady={onReady} progress={progress} />
    </StageCanvas>
  );
}
```

Why it is shaped this way:

- The `ShaderMaterial` is built imperatively and passed as `material`: React Three Fiber 9 copies a `uniforms` prop into the material's own uniform objects, so writes to the object you passed never reach the GPU. A material constructed with `uniforms` keeps that very object.
- `advance` lives outside the component because the React Compiler lint (`react(immutability)`) rejects writing to a `useState` or `useMemo` value inside a `useFrame` callback, and reading `ref.current` during render (`react(refs)`) rules out a ref-held uniforms object.
- The material is disposed on unmount; the stage unmounts the scene on a lost context, reduced motion or an error.
- Token colours: wrap the canvas in a host `div` (`const [host, setHost] = useState<HTMLDivElement | null>(null)`, as `block-scene.tsx` does), resolve the tokens on it and copy them into colour uniforms when they change (`SKILL.md` §6).

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
        progress={progress}
        poster={
          <Image
            src={poster}
            alt="<what the first frame shows>"
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

The page owns the progress object (`useState` keeps it stable) and tweens it beside its copy reveals; the scene reads it every frame. Under reduced motion the choreography never runs and the poster stays.
