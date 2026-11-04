# Shape sampling script

The offline sampler of `SKILL.md` §3. It typechecks, lints and formats as written in this repository, and was run on a textured, nested, two-mesh GLB: it wrote 32,768 and 131,072 points per shape (384 KiB and 1.5 MiB), centred, longest half-extent 1, sorted by height.

Install it once per project, in `@repo/ui` because `three` lives there (ADR-0025):

- Save it as `packages/ui/scripts/sample-shapes.ts`.
- Add `"sample-shapes": "node scripts/sample-shapes.ts"` to the `scripts` of `packages/ui/package.json`: knip then counts it as an entry.
- Add `"scripts"` to the `include` of `packages/ui/tsconfig.json`, so `pnpm typecheck` covers it.

Run it on the source models, never the optimised ones (`exec` runs in `packages/ui` and passes every argument through):

```bash
mkdir -p apps/web/public/media/<feature>
pnpm --filter @repo/ui exec node scripts/sample-shapes.ts --out ../../apps/web/public/media/<feature> \
  ../../assets/3d/source/<first-shape>.glb ../../assets/3d/source/<second-shape>.glb
```

Sampling is random: after a re-run, re-capture the poster (`shader-craft` §7).

```ts
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";

import { BufferAttribute, BufferGeometry, Mesh, type Object3D, Texture, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/* The two particle counts of the quality tiers (256×128 and 512×256 textures). */
const COUNTS = [32_768, 131_072];
/* Node has no image decoder, and only the surface matters: every texture is an empty placeholder. */
function skipTextures() {
  return { name: "skip-textures", loadTexture: () => Promise.resolve(new Texture()) };
}

function isMesh(object: Object3D): object is Mesh {
  return object instanceof Mesh;
}

/* World-space float positions, whatever the source layout (interleaved, quantised, nested transforms). */
function worldGeometry(mesh: Mesh): BufferGeometry {
  const source = mesh.geometry.getAttribute("position");
  const positions = new Float32Array(source.count * 3);
  const point = new Vector3();
  for (let index = 0; index < source.count; index += 1) {
    point
      .fromBufferAttribute(source, index)
      .applyMatrix4(mesh.matrixWorld)
      .toArray(positions, index * 3);
  }
  const geometry = new BufferGeometry().setAttribute("position", new BufferAttribute(positions, 3));
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

async function readSurface(path: string): Promise<Mesh> {
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
      parts.push(worldGeometry(object));
    }
  });
  return normalise(mergeGeometries(parts));
}

/* Every shape is sorted by height: particle i keeps its rank across shapes, so a morph flows instead of swarming. */
function samplePoints(surface: Mesh, count: number): Float32Array {
  const sampler = new MeshSurfaceSampler(surface).build();
  const points = Array.from({ length: count }, () => {
    const point = new Vector3();
    sampler.sample(point);
    return point;
  });
  points.sort((first, second) => first.y - second.y);
  const data = new Float32Array(count * 3);
  for (const [index, point] of points.entries()) {
    point.toArray(data, index * 3);
  }
  return data;
}

async function sampleShapes(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: { out: { type: "string" } },
    allowPositionals: true,
  });
  if (values.out === undefined || positionals.length === 0) {
    throw new Error("Usage: sample-shapes --out <apps/web/public/media/feature> <model.glb>…");
  }
  const outDirectory = values.out;
  await Promise.all(
    positionals.map(async (model) => {
      const surface = await readSurface(model);
      const name = basename(model, ".glb");
      await Promise.all(
        COUNTS.map(async (count) => {
          const points = samplePoints(surface, count);
          await writeFile(join(outDirectory, `${name}-${count}.bin`), points);
        }),
      );
    }),
  );
}

await sampleShapes();
```

Why it is shaped this way:

- Node has no image decoder: without the `skip-textures` plugin, `GLTFLoader` fails on any textured model (`self is not defined`). The plugin hands back empty textures; only the surface is sampled.
- Positions are read through `fromBufferAttribute` and the world matrix, so interleaved, quantised and nested meshes all land in one frame, and every mesh of the model is merged before sampling (area-weighted across meshes).
- Each count is sampled on its own, so the light file is a uniform sample, not the first quarter of a sorted list.
