# Particle scene

Three modules that typecheck, lint and format as written in this repository, and were run in a browser (Vitest browser mode, the package's own set-up) on two sampled shapes: the first shape draws on the first frame, `progress.value = 1` morphs it into the second, a mouse over the centre parts the cloud (lit pixels in the centre fell from 2,592 to 113), and the shape heals once a finger lifts. The vanilla equivalent stayed stable for 30 frames at the 0.1 s delta cap.

Split this way because the lint caps a file at 250 lines and 10 imports: shaders, simulation, then the scene. Rename `particle` to the effect's name.

## `packages/ui/src/scene/<effect>-shaders.ts`

```ts
/* PCG hash (Jarzynski and Olano, JCGT 2020) and 3D value noise, as in the shader-craft recipes. */
const NOISE = `
  uint pcg(uint value) {
    uint state = value * 747796405u + 2891336453u;
    uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
  }
  float hash(ivec3 cell) {
    return float(pcg(uint(cell.x) + pcg(uint(cell.y) + pcg(uint(cell.z))))) / 4294967295.0;
  }
  float valueNoise(vec3 p) {
    ivec3 cell = ivec3(floor(p));
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float x00 = mix(hash(cell), hash(cell + ivec3(1, 0, 0)), u.x);
    float x10 = mix(hash(cell + ivec3(0, 1, 0)), hash(cell + ivec3(1, 1, 0)), u.x);
    float x01 = mix(hash(cell + ivec3(0, 0, 1)), hash(cell + ivec3(1, 0, 1)), u.x);
    float x11 = mix(hash(cell + ivec3(0, 1, 1)), hash(cell + ivec3(1, 1, 1)), u.x);
    return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z) * 2.0 - 1.0;
  }
  vec3 potential(vec3 p) {
    return vec3(valueNoise(p), valueNoise(p + vec3(31.4, 17.1, 5.9)), valueNoise(p + vec3(-11.3, 43.7, 23.2)));
  }
  vec3 curlNoise(vec3 p) {
    const float e = 0.05;
    vec3 px = potential(p + vec3(e, 0.0, 0.0)) - potential(p - vec3(e, 0.0, 0.0));
    vec3 py = potential(p + vec3(0.0, e, 0.0)) - potential(p - vec3(0.0, e, 0.0));
    vec3 pz = potential(p + vec3(0.0, 0.0, e)) - potential(p - vec3(0.0, 0.0, e));
    return vec3(py.z - pz.y, pz.x - px.z, px.y - py.x) / (2.0 * e);
  }
`;
export const VELOCITY = `
  uniform sampler2DArray uShapes;
  uniform float uMorph;
  uniform float uTime;
  uniform float uDelta;
  uniform vec3 uPointer;
  uniform vec3 uCamera;
  uniform float uPointerStrength;
  uniform float uStiffness;
  uniform float uDamping;
  uniform float uCurl;
  ${NOISE}
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 current = texture(texturePosition, uv);
    vec3 velocity = texture(textureVelocity, uv).xyz;
    float stage = clamp(uMorph * (1.0 + STAGGER) - current.w * STAGGER, 0.0, 1.0) * float(SHAPES - 1);
    float layer = min(floor(stage), float(SHAPES - 2));
    float blend = smoothstep(0.0, 1.0, stage - layer);
    vec3 goal = mix(texture(uShapes, vec3(uv, layer)).xyz, texture(uShapes, vec3(uv, layer + 1.0)).xyz, blend);
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
export const GRID: Record<QualityTier, [width: number, height: number]> = {
  light: [256, 128],
  full: [512, 256],
};
/* Point size in CSS pixels at one world unit from the camera. Fewer, larger points on light devices keep the same coverage: size grows with √(131,072 / 32,768). */
export const POINT_SIZE: Record<QualityTier, number> = { light: 16, full: 8 };

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

export function createSimulation(
  gl: WebGLRenderer,
  layers: DataArrayTexture,
  grid: [number, number],
) {
  /* Typed objects shared with the velocity material, so the pointer hook can tween them. */
  const pointer = {
    uPointer: { value: new Vector3() },
    uCamera: { value: new Vector3(0, 0, 1) },
    uPointerStrength: { value: 0 },
  };
  const compute = new GPUComputationRenderer(grid[0], grid[1], gl);
  if (!gl.extensions.has("EXT_color_buffer_float")) {
    compute.setDataType(HalfFloatType);
  }
  const velocity = compute.addVariable("textureVelocity", VELOCITY, compute.createTexture());
  const position = compute.addVariable("texturePosition", POSITION, startTexture(compute, layers));
  compute.setVariableDependencies(velocity, [velocity, position]);
  compute.setVariableDependencies(position, [velocity, position]);
  Object.assign(velocity.material.uniforms, {
    uShapes: { value: layers },
    uMorph: { value: 0 },
    uTime: { value: 0 },
    uDelta: { value: 0 },
    ...pointer,
    uStiffness: { value: 14 },
    uDamping: { value: 6 },
    uCurl: { value: 1.2 },
  });
  Object.assign(velocity.material.defines, { SHAPES: layers.image.depth, STAGGER: "0.35" });
  Object.assign(position.material.uniforms, { uDelta: { value: 0 } });
  /* An error throws during render: SceneBoundary catches it and the poster stays. */
  const error = compute.init();
  if (error !== null) {
    throw new Error(error);
  }
  return { compute, velocity, position, pointer };
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

/* Mutations live outside the component: the React Compiler lint rejects writing to hook values in useFrame. */
export function step(
  simulation: Simulation,
  points: PointUniforms,
  frame: { delta: number; morph: number },
): void {
  const { compute, velocity, position } = simulation;
  const { uMorph, uTime, uDelta } = velocity.material.uniforms;
  const { uDelta: positionDelta } = position.material.uniforms;
  if (
    uMorph === undefined ||
    uTime === undefined ||
    uDelta === undefined ||
    positionDelta === undefined
  ) {
    throw new Error("Simulation uniforms are missing.");
  }
  uMorph.value = frame.morph;
  uTime.value = Number(uTime.value) + frame.delta;
  uDelta.value = frame.delta;
  positionDelta.value = frame.delta;
  compute.compute();
  const { uPositions } = points;
  uPositions.value = compute.getCurrentRenderTarget(position).texture;
}
```

## `packages/ui/src/scene/<effect>-scene.tsx`

```tsx
"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect, useState } from "react";
import { FileLoader, Plane, Raycaster, Vector2, Vector3 } from "three";

import type { QualityTier } from "../lib/quality-tier.ts";
import type { SceneProps } from "../motion/stage.tsx";
import { duration, ease } from "../motion/tokens.ts";
import {
  createPoints,
  createSimulation,
  GRID,
  shapeLayers,
  type Simulation,
  step,
} from "./particle-simulation.ts";
import { StageCanvas } from "./stage-canvas.tsx";
import { useFirstFrame } from "./use-first-frame.ts";

interface ParticleSceneProps extends SceneProps {
  /* Public URLs of every shape for each tier, in morph order, built by the app with NEXT_PUBLIC_BASE_PATH. */
  shapes: Record<QualityTier, string[]>;
  /* Tweened from 0 to 1 by the page's ScrollScene choreography. */
  progress: { value: number };
}

const POINTER_PLANE = new Plane(new Vector3(0, 0, 1), 0);
const POINTER_FORCE = 30;

/* The pointer projected on the plane z = 0, in world units, smoothed by GSAP; the shader repels particles from the ray
   between the camera and that point, so the pointer parts a volume as the viewer sees it. A mouse repels while it moves
   over the canvas; a finger repels only at its contact point, until it lifts or the browser takes the gesture for a scroll. */
function usePointerForce({ uPointer, uCamera, uPointerStrength }: Simulation["pointer"]): void {
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => {
    const smooth = { duration: duration.slow, ease: ease.standard };
    const toX = gsap.quickTo(uPointer.value, "x", smooth);
    const toY = gsap.quickTo(uPointer.value, "y", smooth);
    const toStrength = gsap.quickTo(uPointerStrength, "value", smooth);
    const raycaster = new Raycaster();
    const hit = new Vector3();
    const listening = new AbortController();
    function press(event: PointerEvent): void {
      const box = canvas.getBoundingClientRect();
      const inside = new Vector2(
        ((event.clientX - box.left) / box.width) * 2 - 1,
        1 - ((event.clientY - box.top) / box.height) * 2,
      );
      raycaster.setFromCamera(inside, camera);
      uCamera.value.copy(camera.position);
      const onPlane = Math.abs(inside.x) <= 1 && Math.abs(inside.y) <= 1;
      if (!onPlane || raycaster.ray.intersectPlane(POINTER_PLANE, hit) === null) {
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
    const options = { passive: true, signal: listening.signal };
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
    for (const type of ["pointerup", "pointercancel"]) {
      window.addEventListener(type, release, options);
    }
    return () => {
      listening.abort();
      gsap.killTweensOf([uPointer.value, uPointerStrength]);
    };
  }, [camera, canvas, uPointer, uCamera, uPointerStrength]);
}

function Particles({ tier, onReady, shapes, progress }: ParticleSceneProps) {
  const gl = useThree((state) => state.gl);
  const grid = GRID[tier];
  const buffers = useLoader(FileLoader, shapes[tier], (loader) => {
    loader.setResponseType("arraybuffer");
  });
  const [simulation] = useState(() =>
    createSimulation(
      gl,
      shapeLayers(
        buffers.filter((buffer) => buffer instanceof ArrayBuffer),
        grid,
      ),
      grid,
    ),
  );
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const [points] = useState(() => createPoints(grid, tier, pixelRatio));
  useEffect(
    () => () => {
      simulation.compute.dispose();
      points.geometry.dispose();
      points.material.dispose();
    },
    [simulation, points],
  );
  usePointerForce(simulation.pointer);
  useFirstFrame(onReady);
  useFrame((_, delta) => {
    step(simulation, points.uniforms, { delta, morph: progress.value });
  });
  return <points geometry={points.geometry} material={points.material} frustumCulled={false} />;
}

export function ParticleScene(props: ParticleSceneProps) {
  return (
    <StageCanvas tier={props.tier} flat camera={{ position: new Vector3(0, 0, 4.5), fov: 35 }}>
      <Particles {...props} />
    </StageCanvas>
  );
}
```

Why it is shaped this way:

- Materials are built imperatively (`new ShaderMaterial({ uniforms })`): React Three Fiber 9 copies a `uniforms` prop into new objects, so writes to yours would never reach the GPU. The same holds for the typed `pointer` uniforms shared with the velocity material.
- Uniform writes happen in module-level functions (`step`): the React Compiler lint rejects writing to hook values inside `useFrame`.
- `createSimulation` runs during render: a missing float extension or a failed `init()` throws there, `SceneBoundary` catches it and the poster stays.
- `useLoader(FileLoader, …)` suspends until the shapes arrive; the stage keeps its poster meanwhile.
- The effect component composes `Stage` like any effect (`shader-craft` `references/effect-skeleton.md`) and passes `shapes` (URLs per tier, built by the app with `process.env.NEXT_PUBLIC_BASE_PATH`) and `progress` to this scene.
