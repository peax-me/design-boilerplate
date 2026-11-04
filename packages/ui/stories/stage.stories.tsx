import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { IsoBlocks } from "../src/components/iso-blocks.tsx";
import type { Block } from "../src/lib/isometric.ts";
import { Stage } from "../src/motion/stage.tsx";
import { plainScene } from "./support/plain-scene.tsx";

const box: Block[] = [
  { id: "box", x: 0, y: 0, z: 0, width: 2, depth: 2, height: 2, material: "paper" },
];

const meta = {
  title: "Motion/Stage",
  component: Stage,
  parameters: {
    docs: {
      description: {
        component:
          "Hosts a WebGL scene over its poster. The poster is the complete still image and carries the accessible name. The scene loads once the page is idle, the device runs WebGL2 without reduced motion and the stage comes within half a window of the viewport; on phones it also waits for a first interaction. It fades in once its first frame is drawn, and a lost context or reduced motion brings the poster back. renderScene returns a lazy component holding a StageCanvas.",
      },
    },
  },
  args: {
    poster: <IsoBlocks blocks={box} label="A plain box" />,
    renderScene: plainScene,
    className: "max-w-xl",
  },
} satisfies Meta<typeof Stage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlainBox: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "A plain box" })).toBeInTheDocument();
  },
};
