import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { IsoBlocks } from "../src/components/iso-blocks.tsx";
import type { Block } from "../src/lib/isometric.ts";

const page: Block[] = [
  { id: "header", x: 0, y: 0, z: 0, width: 12, depth: 2, height: 1, material: "maple" },
  { id: "hero", x: 0, y: 3, z: 0, width: 7, depth: 4, height: 2, material: "paper" },
  { id: "visual", x: 8, y: 3, z: 0, width: 4, depth: 4, height: 4, material: "lacquer" },
  { id: "card-1", x: 0, y: 8, z: 0, width: 3, depth: 3, height: 3, material: "maple" },
  { id: "card-2", x: 4.5, y: 8, z: 0, width: 3, depth: 3, height: 3, material: "maple" },
  { id: "card-3", x: 9, y: 8, z: 0, width: 3, depth: 3, height: 3, material: "ink" },
];

const meta = {
  title: "Components/IsoBlocks",
  component: IsoBlocks,
  parameters: {
    docs: {
      description: {
        component:
          "Isometric drawing of blocks painted with design tokens. Each block is a group marked with `data-scene-item`; GSAP offsets on it are in block modules. It is the poster and fallback of `BlockStage`.",
      },
    },
  },
  args: { blocks: page, label: "A page built from blocks" },
} satisfies Meta<typeof IsoBlocks>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Page: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "A page built from blocks" })).toBeVisible();
  },
};

export const Labelled: Story = {
  args: {
    label: "A piece that is not in the box",
    blocks: [
      {
        id: "odd",
        x: 0,
        y: 0,
        z: 0,
        width: 3,
        depth: 1,
        height: 1,
        material: "signal",
        label: "gap: 13px",
      },
    ],
  },
};
