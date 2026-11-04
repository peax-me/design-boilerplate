# Shape sampling script

The offline sampler of `SKILL.md` §3. It typechecks, lints and formats as written in this repository, and was run on test models:

- A textured, nested, multi-mesh GLB loads (Node has no image decoder: the `skip-textures` plugin hands back empty textures).
- A model whose floor slab dwarfs a machine put 4.9 % of the points on the machine; `--weight floor=0.1` raised it to 32.7 %.
- The 32,768-point file is exactly the first 32,768 points of the 131,072-point file, with the same distribution (machine share and radius quantiles identical to three decimals).
- An unknown `--sort` key stops with the usage line.

Install it once per project, in `@repo/ui` because `three` lives there (ADR-0025):

- Save it as `packages/ui/scripts/sample-shapes.ts`.
- Add `"sample-shapes": "node scripts/sample-shapes.ts"` to the `scripts` of `packages/ui/package.json`: knip then counts it as an entry.
- Add `"scripts"` to the `include` of `packages/ui/tsconfig.json`, so `pnpm typecheck` covers it.

Run it on the source models of one stage together, never on optimised GLBs (`exec` runs in `packages/ui` and passes every argument through):

```bash
mkdir -p apps/web/public/media/<feature>
pnpm --filter @repo/ui exec node scripts/sample-shapes.ts --out ../../apps/web/public/media/<feature> \
  --sort height --weight <mesh>=0.2 \
  ../../assets/3d/source/<first-shape>.glb ../../assets/3d/source/<second-shape>.glb ../../assets/3d/source/<third-shape>.glb
```

- `--sort` is shared by every shape of the stage: `height` by default; `radius` (distance from the centre) as soon as one shape is flat along the vertical axis, where heights tie; `angle` (around the vertical axis) for rings and wheels.
- `--weight <mesh>=<factor>` multiplies the area of the named mesh (the glTF node name): below 1 for a slab or a backdrop that would swallow the points, above 1 for a small part the story is about. Repeat it per mesh.
- Sampling is random: after a re-run, re-capture the poster (`shader-craft` §7).

```ts
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";

import { BufferAttribute, BufferGeometry, Mesh, type Object3D, Texture, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/* 131,072 points (2^17) for the full tier; the light tier draws the first 32,768 (2^15) of the same order. */
const FULL_BITS = 17;
const LIGHT_COUNT = 32_768;

/* One key for every shape of a stage, so particle i keeps its rank from shape to shape. */
const SORT_KEYS = {
  height: (point: Vector3) => point.y,
  radius: (point: Vector3) => point.length(),
  angle: (point: Vector3) => Math.atan2(point.z, point.x),
} as const;

type SortKey = keyof typeof SORT_KEYS;

/* Node has no image decoder, and only the surface matters: every texture is an empty placeholder. */
function skipTextures() {
  return { name: "skip-textures", loadTexture: () => Promise.resolve(new Texture()) };
}

function isMesh(object: Object3D): object is Mesh {
  return object instanceof Mesh;
}

function isSortKey(value: string): value is SortKey {
  return Object.hasOwn(SORT_KEYS, value);
}

/* World-space float positions, whatever the source layout (interleaved, quantised, nested transforms),
   and a weight per vertex: the sampler multiplies each face's area by it. */
function worldGeometry(mesh: Mesh, weight: number): BufferGeometry {
  const source = mesh.geometry.getAttribute("position");
  const positions = new Float32Array(source.count * 3);
  const point = new Vector3();
  for (let index = 0; index < source.count; index += 1) {
    point
      .fromBufferAttribute(source, index)
      .applyMatrix4(mesh.matrixWorld)
      .toArray(positions, index * 3);
  }
  const geometry = new BufferGeometry()
    .setAttribute("position", new BufferAttribute(positions, 3))
    .setAttribute("weight", new BufferAttribute(new Float32Array(source.count).fill(weight), 1));
  geometry.setIndex(mesh.geometry.getIndex());
  return geometry.index === null ? geometry : geometry.toNonIndexed();
}

/* Every shape shares one frame: centred, its longest half-extent equal to 1, so morphs never jump. */
function normalise(geometry: BufferGeometry): Mesh {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box === null) {
    throw new Error("The model has no geometry.");
  }
  const size = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  const scale = 2 / Math.max(size.x, size.y, size.z);
  geometry.translate(-centre.x, -centre.y, -centre.z).scale(scale, scale, scale);
  return new Mesh(geometry);
}

async function readSurface(path: string, weights: Map<string, number>): Promise<Mesh> {
  const file = await readFile(path);
  const loader = new GLTFLoader().register(skipTextures);
  const gltf = await loader.parseAsync(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    "",
  );
  gltf.scene.updateMatrixWorld(true);
  const parts: BufferGeometry[] = [];
  gltf.scene.traverse((object) => {
    if (isMesh(object)) {
      parts.push(worldGeometry(object, weights.get(object.name) ?? 1));
    }
  });
  return normalise(mergeGeometries(parts));
}

function bitReverse(value: number, bits: number): number {
  let reversed = 0;
  for (let bit = 0; bit < bits; bit += 1) {
    reversed = (reversed << 1) | ((value >> bit) & 1);
  }
  return reversed;
}

/* Sorted by the shared key, then stored in bit-reversed rank order: any power-of-two prefix (the light tier's
   32,768) is an even sample of the whole shape, and particle i has the same rank in every shape. */
function samplePoints(surface: Mesh, sortKey: SortKey): Float32Array {
  const count = 2 ** FULL_BITS;
  const sampler = new MeshSurfaceSampler(surface).setWeightAttribute("weight").build();
  const points = Array.from({ length: count }, () => {
    const point = new Vector3();
    sampler.sample(point);
    return point;
  });
  const key = SORT_KEYS[sortKey];
  points.sort((first, second) => key(first) - key(second));
  const data = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    points[bitReverse(index, FULL_BITS)]?.toArray(data, index * 3);
  }
  return data;
}

function readWeights(entries: string[]): Map<string, number> {
  return new Map(
    entries.map((entry) => {
      const [name = "", factor = "1"] = entry.split("=");
      return [name, Number(factor)];
    }),
  );
}

async function sampleShapes(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      out: { type: "string" },
      sort: { type: "string", default: "height" },
      weight: { type: "string", multiple: true, default: [] },
    },
    allowPositionals: true,
  });
  const { out, sort } = values;
  if (out === undefined || !isSortKey(sort) || positionals.length === 0) {
    throw new Error(
      "Usage: sample-shapes --out <dir> [--sort height|radius|angle] [--weight <mesh>=<factor>]… <model.glb>…",
    );
  }
  const weights = readWeights(values.weight);
  await Promise.all(
    positionals.map(async (model) => {
      const points = samplePoints(await readSurface(model, weights), sort);
      const name = basename(model, ".glb");
      await writeFile(join(out, `${name}-131072.bin`), points);
      await writeFile(join(out, `${name}-32768.bin`), points.subarray(0, LIGHT_COUNT * 3));
    }),
  );
}

await sampleShapes();
```

Why it is shaped this way:

- Every mesh is moved into world space through `fromBufferAttribute` and its world matrix, so interleaved, quantised and nested meshes land in one frame, then merged so the sample is area-weighted across meshes.
- The points are sorted by the shared key, then stored in bit-reversed rank order: index `i` has the same rank in every shape (morphs flow), and any power-of-two prefix is an even sample of the whole shape, so the `light` tier draws the first 32,768 points of the same set the `full` tier draws.
- `setRandomGenerator` exists at runtime but not in `@types/three` 0.186, so sampling is not seeded; the committed `.bin` files are the stable artefact.
