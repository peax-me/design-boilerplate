export type Material = "maple" | "lacquer" | "paper" | "ink" | "signal";

export interface Block {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  material: Material;
  label?: string;
  /* A draft exists only during a choreography: the final drawing hides it. */
  draft?: boolean;
}

export type Point = [number, number];

interface Faces {
  top: Point[];
  left: Point[];
  right: Point[];
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ACROSS = Math.sqrt(3) / 2;
export const DOWN = 0.5;
export const DRAWING_MARGIN = 0.5;

export function project(x: number, y: number, z: number): Point {
  return [(x - y) * ACROSS, (x + y) * DOWN - z];
}

export function blockFaces({ x, y, z, width, depth, height }: Block): Faces {
  const far = { x: x + width, y: y + depth, z: z + height };
  return {
    top: [
      project(x, y, far.z),
      project(far.x, y, far.z),
      project(far.x, far.y, far.z),
      project(x, far.y, far.z),
    ],
    left: [
      project(x, far.y, z),
      project(far.x, far.y, z),
      project(far.x, far.y, far.z),
      project(x, far.y, far.z),
    ],
    right: [
      project(far.x, y, z),
      project(far.x, far.y, z),
      project(far.x, far.y, far.z),
      project(far.x, y, far.z),
    ],
  };
}

/* Two boxes that do not intersect are separated along one axis; the one nearer the origin is behind. */
function isBehind(first: Block, second: Block): boolean {
  if (first.x + first.width <= second.x) {
    return true;
  }
  if (second.x + second.width <= first.x) {
    return false;
  }
  if (first.y + first.depth <= second.y) {
    return true;
  }
  if (second.y + second.depth <= first.y) {
    return false;
  }
  return first.z + first.height <= second.z;
}

function depthKey(block: Block): number {
  return block.x + block.y + block.z;
}

export function paintOrder(blocks: readonly Block[]): Block[] {
  const remaining = blocks.toSorted((first, second) => depthKey(first) - depthKey(second));
  const ordered: Block[] = [];
  while (remaining.length > 0) {
    const free = remaining.findIndex((candidate) =>
      remaining.every((other) => other === candidate || !isBehind(other, candidate)),
    );
    ordered.push(...remaining.splice(Math.max(free, 0), 1));
  }
  return ordered;
}

export function drawingBounds(blocks: readonly Block[], margin: number): Bounds {
  const points = blocks.flatMap((block) => {
    const { top, left, right } = blockFaces(block);
    return [...top, ...left, ...right];
  });
  const across = points.map(([pointX]) => pointX);
  const down = points.map(([, pointY]) => pointY);
  const left = Math.min(...across) - margin;
  const top = Math.min(...down) - margin;
  return {
    x: left,
    y: top,
    width: Math.max(...across) + margin - left,
    height: Math.max(...down) + margin - top,
  };
}

/* A block's corner is the radius-md token measured in block modules (0.25rem over 3rem). */
const CORNER_PER_SCALE = 1 / 12;

export function cornerRadius(block: Block, cornerScale: number): number {
  const limit = Math.min(block.width, block.depth, block.height) / 2 - 0.01;
  return Math.max(0, Math.min(CORNER_PER_SCALE * cornerScale, limit));
}
