import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import type { Block } from "../src/lib/isometric.ts";
import { BlockStage } from "../src/motion/block-stage.tsx";

const page: Block[] = [
  { id: "header", x: 0, y: 0, z: 0, width: 12, depth: 2, height: 1, material: "maple" },
  { id: "hero", x: 0, y: 3, z: 0, width: 7, depth: 4, height: 2, material: "paper" },
  { id: "visual", x: 8, y: 3, z: 0, width: 4, depth: 4, height: 4, material: "lacquer" },
  { id: "card-1", x: 0, y: 8, z: 0, width: 3, depth: 3, height: 3, material: "maple" },
  { id: "card-2", x: 4.5, y: 8, z: 0, width: 3, depth: 3, height: 3, material: "maple" },
  { id: "card-3", x: 9, y: 8, z: 0, width: 3, depth: 3, height: 3, material: "ink" },
];

const meta = {
  title: "Motion/BlockStage",
  component: BlockStage,
  parameters: {
    docs: {
      description: {
        component:
          "Blocks drop into place as an isometric drawing, then, from the md breakpoint with motion allowed, a lit three.js scene replaces it once the page is idle. The drawing stays the accessible image and the fallback.",
      },
    },
  },
  args: { blocks: page, label: "A page assembled from blocks", className: "max-w-xl" },
} satisfies Meta<typeof BlockStage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Page: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "A page assembled from blocks" }),
    ).toBeInTheDocument();
  },
};
