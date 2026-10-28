import type { Block } from "@repo/ui/lib/isometric";

function piece(block: Omit<Block, "z"> & { z?: number }): Block {
  return { z: 0, ...block };
}

export const pageBlocks: Block[] = [
  piece({ id: "header", x: 0, y: 0, width: 12, depth: 1.5, height: 0.75, material: "maple" }),
  piece({ id: "copy", x: 0, y: 2.5, width: 6.5, depth: 4, height: 1.5, material: "paper" }),
  piece({ id: "stage", x: 7.5, y: 2.5, width: 4.5, depth: 4, height: 3.5, material: "lacquer" }),
  piece({ id: "tray", x: 0, y: 7.5, width: 12, depth: 1.5, height: 0.75, material: "ink" }),
  piece({ id: "card-1", x: 0, y: 10, width: 3.5, depth: 3, height: 2.5, material: "maple" }),
  piece({ id: "card-2", x: 4.25, y: 10, width: 3.5, depth: 3, height: 2.5, material: "maple" }),
  piece({ id: "card-3", x: 8.5, y: 10, width: 3.5, depth: 3, height: 2.5, material: "maple" }),
  piece({
    id: "loose-1",
    x: 13.5,
    y: -3,
    z: 5,
    width: 1.5,
    depth: 1.5,
    height: 1.5,
    material: "lacquer",
  }),
  piece({
    id: "loose-2",
    x: -3,
    y: 5,
    z: 4,
    width: 3,
    depth: 0.75,
    height: 0.75,
    material: "maple",
  }),
];

export const renegadePairs = [
  { draft: "space-draft", flag: "space-flag", token: "space" },
  { draft: "paint-draft", flag: "paint-flag", token: "paint" },
  { draft: "corner-draft", flag: "corner-flag", token: "corner" },
] as const;

const renegadeBase: Block[] = [
  piece({ id: "header", x: 0, y: 0, width: 11, depth: 1, height: 0.5, material: "maple" }),
  piece({ id: "card", x: 0, y: 2, width: 3, depth: 3, height: 2, material: "maple" }),
];

const renegadeTokens: Block[] = [
  piece({
    id: "space",
    x: 4,
    y: 2,
    width: 3,
    depth: 3,
    height: 2,
    material: "maple",
    label: "gap-3",
  }),
  piece({
    id: "paint",
    x: 8,
    y: 2,
    width: 3,
    depth: 3,
    height: 2,
    material: "lacquer",
    label: "accent",
  }),
  piece({
    id: "corner",
    x: 0,
    y: 6,
    width: 11,
    depth: 2,
    height: 1,
    material: "paper",
    label: "rounded-md",
  }),
];

const spaceDraft = piece({
  id: "space-draft",
  x: 5.3,
  y: 2.9,
  z: 1,
  width: 3,
  depth: 3,
  height: 2,
  material: "maple",
});
const paintDraft = piece({
  id: "paint-draft",
  x: 9.2,
  y: 1,
  z: 1,
  width: 3,
  depth: 3,
  height: 2,
  material: "lacquer",
});
const cornerDraft = piece({
  id: "corner-draft",
  x: 1.2,
  y: 7.4,
  z: 1,
  width: 11,
  depth: 2,
  height: 1,
  material: "paper",
});

function flag(draft: Block, id: string, label: string): Block {
  return { ...draft, id, material: "signal", label };
}

const renegadeDrafts = [spaceDraft, paintDraft, cornerDraft];
const renegadeFlags = [
  flag(spaceDraft, "space-flag", "gap: 13px"),
  flag(paintDraft, "paint-flag", "#3b82f6"),
  flag(cornerDraft, "corner-flag", "radius: 7px"),
];

function asDrafts(blocks: Block[]): Block[] {
  return blocks.map((block) => ({ ...block, draft: true }));
}

export const renegadeBlocks: Block[] = [
  ...renegadeBase,
  ...renegadeTokens,
  ...asDrafts(renegadeDrafts),
  ...asDrafts(renegadeFlags),
];

export const renegadeStills = {
  draft: [...renegadeBase, ...renegadeDrafts],
  detect: [...renegadeBase, ...renegadeFlags],
  snap: [...renegadeBase, ...renegadeTokens],
};

export const wordmarkBlocks: Block[] = [
  piece({ id: "small", x: 0, y: 0, width: 1, depth: 1, height: 1, material: "maple" }),
  piece({ id: "medium", x: 1.25, y: 0, width: 1, depth: 1, height: 2, material: "maple" }),
  piece({ id: "large", x: 2.5, y: 0, width: 1, depth: 1, height: 3, material: "lacquer" }),
];

const box = piece({ id: "box", x: 0, y: 0, width: 4, depth: 3, height: 2, material: "maple" });

export const stepBlocks: Block[][] = [
  [
    box,
    piece({ id: "lid", x: 0, y: 0, z: 2.75, width: 4, depth: 3, height: 0.5, material: "maple" }),
  ],
  [
    box,
    piece({
      id: "chosen",
      x: 5,
      y: 0.75,
      width: 1.5,
      depth: 1.5,
      height: 1.5,
      material: "lacquer",
    }),
  ],
  [
    piece({ id: "design", x: 0, y: 0, width: 4, depth: 3, height: 1, material: "maple" }),
    piece({ id: "figma", x: 0, y: 0, z: 1.25, width: 4, depth: 3, height: 1, material: "paper" }),
    piece({ id: "story", x: 0, y: 0, z: 2.5, width: 4, depth: 3, height: 1, material: "lacquer" }),
  ],
  [
    piece({ id: "top", x: 0, y: 0, width: 5, depth: 1, height: 0.5, material: "maple" }),
    piece({ id: "left", x: 0, y: 1.5, width: 2, depth: 2, height: 2, material: "lacquer" }),
    piece({ id: "right", x: 3, y: 1.5, width: 2, depth: 2, height: 1, material: "paper" }),
  ],
];

export const toolBlocks = {
  directions: [
    piece({ id: "left", x: 0, y: 0, width: 1, depth: 1, height: 1.5, material: "maple" }),
    piece({ id: "middle", x: 1.25, y: 0, width: 1, depth: 1, height: 1.5, material: "lacquer" }),
    piece({ id: "right", x: 2.5, y: 0, width: 1, depth: 1, height: 1.5, material: "maple" }),
  ],
  system: [
    piece({ id: "base", x: 0, y: 0, width: 3, depth: 2, height: 0.5, material: "maple" }),
    piece({
      id: "token",
      x: 0.5,
      y: 0.5,
      z: 0.5,
      width: 1,
      depth: 1,
      height: 1,
      material: "lacquer",
    }),
  ],
  figma: [
    piece({ id: "code", x: 0, y: 0, width: 1.5, depth: 1.5, height: 1.5, material: "maple" }),
    piece({ id: "mirror", x: 2, y: 0, width: 1.5, depth: 1.5, height: 1.5, material: "paper" }),
  ],
  assets: [
    piece({ id: "panel", x: 0, y: 0, width: 3, depth: 0.25, height: 2, material: "lacquer" }),
  ],
  motion: [
    piece({ id: "start", x: 0, y: 0, width: 1, depth: 1, height: 1, material: "maple" }),
    piece({
      id: "flight",
      x: 1.25,
      y: 0,
      z: 0.75,
      width: 1,
      depth: 1,
      height: 1,
      material: "maple",
    }),
    piece({
      id: "landing",
      x: 2.5,
      y: 0,
      z: 1.5,
      width: 1,
      depth: 1,
      height: 1,
      material: "lacquer",
    }),
  ],
  copy: [
    piece({ id: "headline", x: 0, y: 0, width: 3, depth: 1, height: 0.5, material: "paper" }),
    piece({ id: "line", x: 0, y: 1.25, width: 2, depth: 1, height: 0.5, material: "paper" }),
  ],
  review: [
    piece({ id: "built", x: 0, y: 0, width: 2, depth: 2, height: 1, material: "maple" }),
    piece({ id: "check", x: 2.25, y: 0.5, width: 1, depth: 1, height: 1, material: "lacquer" }),
  ],
  decisions: [
    piece({ id: "record", x: 0, y: 0, width: 2, depth: 2.5, height: 0.25, material: "ink" }),
    piece({
      id: "seal",
      x: 0.5,
      y: 0.75,
      z: 0.25,
      width: 1,
      depth: 1,
      height: 0.25,
      material: "lacquer",
    }),
  ],
};

export const showcaseBlocks: Block[] = [
  piece({ id: "plank", x: 0, y: 0, width: 6, depth: 1.5, height: 1.5, material: "maple" }),
  piece({ id: "cube", x: 0, y: 2.5, width: 3, depth: 3, height: 3, material: "maple" }),
  piece({ id: "lacquer", x: 4, y: 2.5, width: 2, depth: 2, height: 2, material: "lacquer" }),
  piece({ id: "paper", x: 4, y: 5, width: 2, depth: 1, height: 1, material: "paper" }),
];

export const partBlocks = {
  tokens: [piece({ id: "token", x: 0, y: 0, width: 1, depth: 1, height: 1, material: "lacquer" })],
  components: [
    piece({ id: "component", x: 0, y: 0, width: 2, depth: 1, height: 1, material: "maple" }),
  ],
  skills: [piece({ id: "skill", x: 0, y: 0, width: 1, depth: 1, height: 2, material: "paper" })],
  decisions: [
    piece({ id: "decision", x: 0, y: 0, width: 2, depth: 2, height: 0.5, material: "ink" }),
  ],
};
