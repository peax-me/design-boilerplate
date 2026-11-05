# Particle scene

Four modules and their tests, checked as written in this repository (typecheck, `oxlint --type-aware`, `oxfmt`) and run in Vitest browser mode, the package's own set-up:

- `tests/<effect>-morph.test.tsx`: at progress 0, 0.5 and 1, the farthest of 32,768 particles is within 1e-6 of shapes 1, 2 and 3 (measured 0), whatever its seed, both for the seed-order stagger and for the `SWEEP` stagger; after the simulation holds at 0.5 for 10 s (curl off), the farthest particle is 1.1e-6 from the middle shape. With the former whole-range stagger, the first case fails at 0.397.
- `tests/<effect>-scene.test.tsx`: under StrictMode, the first frame draws the first shape (more than 300 lit pixels on a 64×36 grid). With the simulation created during render and disposed in a cleanup, the same test fails at 52: the particles restart from the origin.
- The mounted scene morphs through three shapes, parts under a mouse at the centre (lit pixels there fell from 2,592 to 121) and heals once the pointer leaves the document.

Shared code comes from `shader-craft` (`references/shader-chunks.md` for the GLSL, `references/effect-skeleton.md` for `useSceneResource` and the test support): these modules import it, never copy it. Split this way because the lint caps a file at 250 lines and 10 imports, and a function at 60 lines. Rename `particle` to the effect's name.

## `packages/ui/src/scene/<effect>-shaders.ts`

```ts
import { CURL_NOISE, HASH } from "./shader-chunks.ts";

/* Where a particle heads at a scroll progress. The stagger is local to each segment between two shapes,
   so at progress k / (SHAPES - 1) every particle sits exactly on shape k: each shape can be held and read.
   Particles leave in seed order (a dissolve), or by height on the target shape when SWEEP is defined (from the
   bottom up). blend reports how far the particle has gone, from 0 to 1. */
export const MORPH_GOAL = `
  vec3 morphGoal(vec2 uv, float progress, float seed, out float blend) {
    float segment = clamp(progress, 0.0, 1.0) * float(SHAPES - 1);
    float layer = min(floor(segment), float(SHAPES - 2));
    vec3 from = texture(uShapes, vec3(uv, layer)).xyz;
    vec3 to = texture(uShapes, vec3(uv, layer + 1.0)).xyz;
  #ifdef SWEEP
    float order = clamp(to.y * 0.5 + 0.5, 0.0, 1.0);
  #else
    float order = seed;
  #endif
    blend = smoothstep(0.0, 1.0, clamp((segment - layer) * (1.0 + STAGGER) - order * STAGGER, 0.0, 1.0));
    return mix(from, to, blend);
  }
`;

/* texturePosition, textureVelocity and resolution are injected by GPUComputationRenderer. */
export const VELOCITY = `
  uniform sampler2DArray uShapes;
  uniform float uProgress;
  uniform float uTime;
  uniform float uDelta;
  uniform vec3 uPointer;
  uniform vec3 uCamera;
  uniform float uPointerStrength;
  uniform float uStiffness;
  uniform float uDamping;
  uniform float uCurl;
  ${HASH}
  ${CURL_NOISE}
  ${MORPH_GOAL}
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 current = texture(texturePosition, uv);
    vec3 velocity = texture(textureVelocity, uv).xyz;
    float blend;
    vec3 goal = morphGoal(uv, uProgress, current.w, blend);
    float transit = 1.0 - abs(blend * 2.0 - 1.0);
    vec3 force = (goal - current.xyz) * uStiffness;
    force += curlNoise(current.xyz * 1.4 + vec3(0.0, 0.0, uTime * 0.15)) * uCurl * (0.15 + transit);
    vec3 ray = normalize(uPointer - uCamera);
    vec3 fromEye = current.xyz - uCamera;
    vec3 away = fromEye - ray * dot(fromEye, ray);
    force += normalize(away + vec3(1e-4)) * uPointerStrength * exp(-dot(away, away) * 12.0);
    velocity = (velocity + force * uDelta) * exp(-uDamping * uDelta);
    gl_FragColor = vec4(velocity, 1.0);
  }
`;

export const POSITION = `
  uniform float uDelta;
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 current = texture(texturePosition, uv);
    gl_FragColor = vec4(current.xyz + texture(textureVelocity, uv).xyz * uDelta, current.w);
  }
`;

export const POINTS_VERTEX = `
  uniform sampler2D uPositions;
  uniform float uPointSize;
  void main() {
    ivec2 texel = ivec2(gl_VertexID % WIDTH, gl_VertexID / WIDTH);
    vec4 viewPosition = modelViewMatrix * vec4(texelFetch(uPositions, texel, 0).xyz, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uPointSize / -viewPosition.z;
  }
`;

export const POINTS_FRAGMENT = `
  void main() {
    float alpha = smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5));
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0), alpha);
    #include <colorspace_fragment>
  }
`;
```

## `packages/ui/src/scene/<effect>-simulation.ts`

```ts
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DataArrayTexture,
  FloatType,
  HalfFloatType,
  ShaderMaterial,
  type Texture,
  Vector3,
  type WebGLRenderer,
} from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";

import type { QualityTier } from "../lib/quality-tier.ts";
import { POINTS_FRAGMENT, POINTS_VERTEX, POSITION, VELOCITY } from "./particle-shaders.ts";

/* 32,768 particles on light devices, 131,072 on full ones: one texel each. */
const GRID: Record<QualityTier, [width: number, height: number]> = {
  light: [256, 128],
  full: [512, 256],
};
/* Point size in CSS pixels at one world unit from the camera. Fewer, larger points on light devices keep the same coverage: size grows with √(131,072 / 32,768). */
const POINT_SIZE: Record<QualityTier, number> = { light: 16, full: 8 };

/* One layer per shape, one texel per particle, in the order the sampling script wrote them. */
export function shapeLayers(
  buffers: ArrayBuffer[],
  [width, height]: [number, number],
): DataArrayTexture {
  const count = width * height;
  const data = new Float32Array(count * 4 * buffers.length);
  for (const [layer, buffer] of buffers.entries()) {
    const points = new Float32Array(buffer);
    for (let index = 0; index < count; index += 1) {
      data.set(points.subarray(index * 3, index * 3 + 3), (layer * count + index) * 4);
    }
  }
  const layers = new DataArrayTexture(data, width, height, buffers.length);
  layers.type = FloatType;
  layers.needsUpdate = true;
  return layers;
}

/* Each particle starts on the first shape, its seed derived from its index: the first frame is the same on every load. */
function startTexture(compute: GPUComputationRenderer, layers: DataArrayTexture): Texture {
  const start = compute.createTexture();
  const target = start.image.data;
  const source = layers.image.data;
  if (!(target instanceof Float32Array) || !(source instanceof Float32Array)) {
    throw new TypeError("Particle textures must hold floats.");
  }
  for (let index = 0; index < target.length / 4; index += 1) {
    target.set(source.subarray(index * 4, index * 4 + 3), index * 4);
    target[index * 4 + 3] = (Math.imul(index, 2_654_435_761) >>> 0) / 4_294_967_296;
  }
  return start;
}

/* Starting values, checked stable at the 0.1 s delta cap: damping between 1.5 and 2 times √stiffness. */
function createForces() {
  return {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uDelta: { value: 0 },
    uPointer: { value: new Vector3() },
    uCamera: { value: new Vector3() },
    uPointerStrength: { value: 0 },
    uStiffness: { value: 14 },
    uDamping: { value: 6 },
    uCurl: { value: 1.2 },
  };
}

export function createSimulation(
  gl: WebGLRenderer,
  layers: DataArrayTexture,
  grid: [number, number],
) {
  const compute = new GPUComputationRenderer(grid[0], grid[1], gl);
  if (!gl.extensions.has("EXT_color_buffer_float")) {
    compute.setDataType(HalfFloatType);
  }
  const velocity = compute.addVariable("textureVelocity", VELOCITY, compute.createTexture());
  const position = compute.addVariable("texturePosition", POSITION, startTexture(compute, layers));
  compute.setVariableDependencies(velocity, [velocity, position]);
  compute.setVariableDependencies(position, [velocity, position]);
  /* Typed objects the materials keep: step and the pointer hook write to them. The position pass shares uDelta. */
  const uniforms = createForces();
  Object.assign(velocity.material.uniforms, { uShapes: { value: layers }, ...uniforms });
  Object.assign(velocity.material.defines, { SHAPES: layers.image.depth, STAGGER: "0.35" });
  Object.assign(position.material.uniforms, { uDelta: uniforms.uDelta });
  /* Thrown in the effect that creates the simulation (useSceneResource): SilentBoundary catches it and the poster stays. */
  const error = compute.init();
  if (error !== null) {
    throw new Error(error);
  }
  return { compute, position, uniforms };
}

export type Simulation = ReturnType<typeof createSimulation>;

/* Built imperatively: the material keeps this very uniforms object, while R3F's uniforms prop copies it. */
export function createPoints(grid: [number, number], tier: QualityTier, pixelRatio: number) {
  const geometry = new BufferGeometry();
  /* Positions come from the texture through gl_VertexID; this attribute only sets the draw count. */
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(grid[0] * grid[1] * 3), 3),
  );
  const uniforms = {
    uPositions: { value: null as Texture | null },
    uPointSize: { value: POINT_SIZE[tier] * pixelRatio },
  };
  const material = new ShaderMaterial({
    uniforms,
    defines: { WIDTH: grid[0] },
    vertexShader: POINTS_VERTEX,
    fragmentShader: POINTS_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  return { geometry, material, uniforms };
}

type PointUniforms = ReturnType<typeof createPoints>["uniforms"];

/* Everything the scene draws with, made and released together (see useSceneResource). */
export function createParticles(gl: WebGLRenderer, files: unknown[], tier: QualityTier) {
  const grid = GRID[tier];
  const layers = shapeLayers(
    files.filter((file) => file instanceof ArrayBuffer),
    grid,
  );
  return {
    layers,
    simulation: createSimulation(gl, layers, grid),
    points: createPoints(grid, tier, gl.getPixelRatio()),
  };
}

export type Particles = ReturnType<typeof createParticles>;

export function disposeParticles({ layers, simulation, points }: Particles): void {
  simulation.compute.dispose();
  layers.dispose();
  points.geometry.dispose();
  points.material.dispose();
}

/* Mutations live outside the component: the React Compiler lint rejects writing to hook values in useFrame.
   The camera is copied every frame, so the pointer ray stays right when the choreography moves the camera. */
export function step(
  simulation: Simulation,
  points: PointUniforms,
  frame: { delta: number; progress: number; camera: Vector3 },
): void {
  const { compute, position, uniforms } = simulation;
  const { uProgress, uTime, uDelta, uCamera } = uniforms;
  uProgress.value = frame.progress;
  uTime.value += frame.delta;
  uDelta.value = frame.delta;
  uCamera.value.copy(frame.camera);
  compute.compute();
  const { uPositions } = points;
  uPositions.value = compute.getCurrentRenderTarget(position).texture;
}
```

## `packages/ui/src/scene/<effect>-pointer.ts`

```ts
import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect } from "react";
import { type Camera, Plane, Raycaster, Vector2, Vector3 } from "three";

import { duration, ease } from "../motion/tokens.ts";
import type { Simulation } from "./particle-simulation.ts";

const POINTER_PLANE = new Plane(new Vector3(0, 0, 1), 0);
const POINTER_FORCE = 30;
/* Leaving the window or the tab sends no pointermove: these release the force too. */
const RELEASES = ["pointerup", "pointercancel", "blur"] as const;

/* Where the pointer meets the plane z = 0, or null when it is off the canvas. */
function pointerOnPlane(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  camera: Camera,
): Vector3 | null {
  const box = canvas.getBoundingClientRect();
  const inside = new Vector2(
    ((event.clientX - box.left) / box.width) * 2 - 1,
    1 - ((event.clientY - box.top) / box.height) * 2,
  );
  if (Math.abs(inside.x) > 1 || Math.abs(inside.y) > 1) {
    return null;
  }
  const raycaster = new Raycaster();
  raycaster.setFromCamera(inside, camera);
  return raycaster.ray.intersectPlane(POINTER_PLANE, new Vector3());
}

/* The pointer projected on the plane z = 0, smoothed by GSAP; the velocity shader repels particles from the ray
   between the camera and that point, so the pointer parts a volume as the viewer sees it. A mouse repels while it
   moves over the canvas; a finger only at its contact point, until it lifts or the browser takes the gesture for a scroll. */
export function usePointerForce({ uPointer, uPointerStrength }: Simulation["uniforms"]): void {
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => {
    const smooth = { duration: duration.slow, ease: ease.standard };
    const toX = gsap.quickTo(uPointer.value, "x", smooth);
    const toY = gsap.quickTo(uPointer.value, "y", smooth);
    const toStrength = gsap.quickTo(uPointerStrength, "value", smooth);
    const listening = new AbortController();
    const options = { passive: true, signal: listening.signal };
    function press(event: PointerEvent): void {
      const hit = pointerOnPlane(event, canvas, camera);
      if (hit === null) {
        toStrength(0);
        return;
      }
      toX(hit.x);
      toY(hit.y);
      toStrength(POINTER_FORCE);
    }
    function release(): void {
      toStrength(0);
    }
    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "mouse") {
          press(event);
        }
      },
      options,
    );
    window.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType !== "mouse") {
          press(event);
        }
      },
      options,
    );
    for (const type of RELEASES) {
      window.addEventListener(type, release, options);
    }
    document.documentElement.addEventListener("pointerleave", release, options);
    return () => {
      listening.abort();
      gsap.killTweensOf([uPointer.value, uPointerStrength]);
    };
  }, [camera, canvas, uPointer, uPointerStrength]);
}
```

## `packages/ui/src/scene/<effect>-scene.tsx`

```tsx
"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { FileLoader, Vector3 } from "three";

import type { QualityTier } from "../lib/quality-tier.ts";
import type { SceneProps } from "../motion/stage.tsx";
import { usePointerForce } from "./particle-pointer.ts";
import { createParticles, disposeParticles, type Particles, step } from "./particle-simulation.ts";
import { StageCanvas } from "./stage-canvas.tsx";
import { useFirstFrame } from "./use-first-frame.ts";
import { useSceneResource } from "./use-scene-resource.ts";

interface ParticleSceneProps extends SceneProps {
  /* Public URLs of every shape for each tier, in morph order, built by the app with NEXT_PUBLIC_BASE_PATH. */
  shapes: Record<QualityTier, string[]>;
  /* Tweened from 0 to 1 by the page's ScrollScene choreography. */
  progress: { value: number };
}

/* Rendered once the simulation exists, so the first frame it reports is a drawn one. */
function ParticleFrame({
  particles,
  onReady,
  progress,
}: { particles: Particles } & Pick<ParticleSceneProps, "onReady" | "progress">) {
  const { simulation, points } = particles;
  usePointerForce(simulation.uniforms);
  useFirstFrame(onReady);
  useFrame((state, delta) => {
    step(simulation, points.uniforms, {
      delta,
      progress: progress.value,
      camera: state.camera.position,
    });
  });
  return <points geometry={points.geometry} material={points.material} frustumCulled={false} />;
}

function ParticleField({ tier, onReady, shapes, progress }: ParticleSceneProps) {
  const gl = useThree((state) => state.gl);
  const files = useLoader(FileLoader, shapes[tier], (loader) => {
    loader.setResponseType("arraybuffer");
  });
  const particles = useSceneResource(createParticles, disposeParticles, gl, files, tier);
  return particles === null ? null : (
    <ParticleFrame particles={particles} onReady={onReady} progress={progress} />
  );
}

export function ParticleScene(props: ParticleSceneProps) {
  return (
    <StageCanvas tier={props.tier} flat camera={{ position: new Vector3(0, 0, 4.5), fov: 35 }}>
      <ParticleField {...props} />
    </StageCanvas>
  );
}
```

## `packages/ui/tests/<effect>-morph.test.tsx`

Write it before `MORPH_GOAL`: the first case renders the goal of every particle into a float target with `GPUComputationRenderer`'s own helpers and compares it with each shape, for both stagger orders; the second runs the real simulation with the curl off and measures how far the particles end from the middle shape.

```tsx
import {
  ClampToEdgeWrapping,
  DataTexture,
  FloatType,
  NearestFilter,
  RGBAFormat,
  type WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import { describe, expect, it } from "vitest";

import { MORPH_GOAL } from "../src/scene/particle-shaders.ts";
import {
  createPoints,
  createSimulation,
  shapeLayers,
  step,
} from "../src/scene/particle-simulation.ts";

const GRID: [number, number] = [256, 128];
const COUNT = GRID[0] * GRID[1];
const SHAPES = 3;
const STAGGER = 0.35;
const FRAME = 1 / 60;
/* Float32 positions: a goal that sits on its shape is within rounding of it. */
const ON_SHAPE = 1e-6;
const SETTLE_FRAMES = 600;

/* Three unlike shapes in the shared frame: a sphere, a flat disc and a vertical line. */
function shapeBuffer(shape: number): ArrayBuffer {
  const points = new Float32Array(COUNT * 3);
  for (let index = 0; index < COUNT; index += 1) {
    const t = (index + 0.5) / COUNT;
    const angle = index * 2.399963;
    const ring = Math.sqrt(1 - (1 - 2 * t) ** 2);
    const shapes = [
      [Math.cos(angle) * ring, 1 - 2 * t, Math.sin(angle) * ring],
      [Math.cos(angle) * Math.sqrt(t), 0, Math.sin(angle) * Math.sqrt(t)],
      [0, 2 * t - 1, 0],
    ];
    points.set(shapes[shape] ?? [], index * 3);
  }
  return points.buffer;
}

function readTarget(renderer: WebGLRenderer, target: WebGLRenderTarget): Float32Array {
  const pixels = new Float32Array(COUNT * 4);
  renderer.readRenderTargetPixels(target, 0, 0, GRID[0], GRID[1], pixels);
  return pixels;
}

/* The largest distance between each particle and its point on one shape layer. */
function farthestFrom(layer: Float32Array, positions: Float32Array): number {
  let farthest = 0;
  for (let index = 0; index < COUNT; index += 1) {
    const dx = (positions[index * 4] ?? 0) - (layer[index * 3] ?? 0);
    const dy = (positions[index * 4 + 1] ?? 0) - (layer[index * 3 + 1] ?? 0);
    const dz = (positions[index * 4 + 2] ?? 0) - (layer[index * 3 + 2] ?? 0);
    farthest = Math.max(farthest, Math.hypot(dx, dy, dz));
  }
  return farthest;
}

const buffers = [shapeBuffer(0), shapeBuffer(1), shapeBuffer(2)];
const [sphere, disc, line] = [
  new Float32Array(shapeBuffer(0)),
  new Float32Array(shapeBuffer(1)),
  new Float32Array(shapeBuffer(2)),
];

describe("three-shape morph", () => {
  it.each([
    ["seed order (a dissolve)", {}],
    ["height on the target shape (a sweep)", { SWEEP: "" }],
  ])("puts every particle on shape k at progress k / 2, leaving in %s", (_order, sweep) => {
    const renderer = new WebGLRenderer();
    const compute = new GPUComputationRenderer(GRID[0], GRID[1], renderer);
    const seeds = new DataTexture(
      new Float32Array(COUNT * 4),
      GRID[0],
      GRID[1],
      RGBAFormat,
      FloatType,
    );
    for (let index = 0; index < COUNT; index += 1) {
      seeds.image.data?.set([0, 0, 0, index / (COUNT - 1)], index * 4);
    }
    seeds.needsUpdate = true;
    const material = compute.createShaderMaterial(
      `uniform sampler2DArray uShapes; uniform sampler2D uSeeds; uniform float uProgress; ${MORPH_GOAL}
       void main() {
         vec2 uv = gl_FragCoord.xy / resolution.xy;
         float blend;
         gl_FragColor = vec4(morphGoal(uv, uProgress, texture(uSeeds, uv).w, blend), 1.0);
       }`,
      {
        uShapes: { value: shapeLayers(buffers, GRID) },
        uSeeds: { value: seeds },
        uProgress: { value: 0 },
      },
    );
    Object.assign(material.defines, { SHAPES, STAGGER: String(STAGGER), ...sweep });
    const target = compute.createRenderTarget(
      GRID[0],
      GRID[1],
      ClampToEdgeWrapping,
      ClampToEdgeWrapping,
      NearestFilter,
      NearestFilter,
    );
    const holds: Array<[number, Float32Array]> = [
      [0, sphere],
      [0.5, disc],
      [1, line],
    ];
    const misses = holds.map(([progress, layer]) => {
      material.uniforms["uProgress"] = { value: progress };
      compute.doRenderTarget(material, target);
      return farthestFrom(layer, readTarget(renderer, target));
    });

    expect(Math.max(...misses)).toBeLessThan(ON_SHAPE);
  });

  it("settles every particle on the middle shape when the scroll holds at 0.5", () => {
    const renderer = new WebGLRenderer();
    const simulation = createSimulation(renderer, shapeLayers(buffers, GRID), GRID);
    simulation.uniforms.uCurl.value = 0;
    const points = createPoints(GRID, "light", 1);
    const camera = simulation.uniforms.uCamera.value.set(0, 0, 4.5).clone();
    for (let frame = 0; frame < SETTLE_FRAMES; frame += 1) {
      step(simulation, points.uniforms, { delta: FRAME, progress: 0.5, camera });
    }
    const settled = farthestFrom(
      disc,
      readTarget(renderer, simulation.compute.getCurrentRenderTarget(simulation.position)),
    );

    expect(settled).toBeLessThan(1e-3);
  });
});
```

## `packages/ui/tests/<effect>-scene.test.tsx`

The shape is generated in the test and served from memory, so the test needs no fixture file.

```tsx
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { ParticleScene } from "../src/scene/particle-scene.tsx";
import { canvasIn, canvasPixels, countPixels } from "./support/canvas-pixels.ts";

const COUNT = 32_768;

/* A unit sphere sampled evenly, served from memory like a sampled shape file. */
function sphereUrl(): string {
  const points = new Float32Array(COUNT * 3);
  for (let index = 0; index < COUNT; index += 1) {
    const height = 1 - ((index + 0.5) / COUNT) * 2;
    const ring = Math.sqrt(1 - height * height);
    const angle = index * 2.399_963;
    points.set([Math.cos(angle) * ring, height, Math.sin(angle) * ring], index * 3);
  }
  return URL.createObjectURL(new Blob([points.buffer]));
}

describe("particle scene under StrictMode", () => {
  it("draws the first shape on its first frame after the double mount of development", async () => {
    const sphere = sphereUrl();
    const ready = vi.fn<() => void>();
    const screen = await render(
      <StrictMode>
        <div style={{ width: 320, height: 180, position: "relative", background: "black" }}>
          <ParticleScene
            tier="light"
            onReady={ready}
            progress={{ value: 0 }}
            shapes={{ light: [sphere, sphere], full: [sphere, sphere] }}
          />
        </div>
      </StrictMode>,
    );
    await expect.poll(() => ready.mock.calls.length, { timeout: 15_000 }).toBe(1);

    const lit = countPixels(await canvasPixels(canvasIn(screen.container)), (red, green, blue) => {
      return red + green + blue > 120;
    });

    expect(lit).toBeGreaterThan(300);
  });
});
```

Why it is shaped this way:

- The layers, the simulation and the points are made in the effect that disposes them (`useSceneResource`): under StrictMode in development, a `GPUComputationRenderer` created during render and disposed by the first cleanup loses its positions, and the particles restart from the origin. `ParticleFrame` renders once they exist, so `useFirstFrame` reports a drawn frame.
- Materials are built imperatively (`new ShaderMaterial({ uniforms })`), and the simulation's uniforms are typed objects the materials keep: React Three Fiber 9 copies a `uniforms` prop into new objects, so writes to yours would never reach the GPU.
- Uniform writes happen in module-level functions (`step`): the React Compiler lint rejects writing to hook values inside `useFrame`. `step` copies the camera position every frame, so the pointer ray stays right when the choreography moves the camera.
- `createSimulation` throws when the float extension is missing and `init()` fails: the error reaches `SilentBoundary` and the poster stays.
- `useLoader(FileLoader, …)` suspends until the shapes arrive; the stage keeps its poster meanwhile. Its result is cached, so it is a stable input of `useSceneResource`.
- The effect component composes `Stage` like any effect (`shader-craft` `references/effect-skeleton.md`, `ambient` because the shape breathes at rest) and passes `shapes` (URLs per tier, built by the app with `process.env.NEXT_PUBLIC_BASE_PATH`) and `progress` to this scene.
