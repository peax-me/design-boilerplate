import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { IsoBlocks } from "../src/components/iso-blocks.tsx";
import { Grid } from "../src/layout/grid.tsx";
import { Part } from "../src/typography/part.tsx";

function Piece() {
  return (
    <IsoBlocks
      label="One piece"
      blocks={[{ id: "piece", x: 0, y: 0, z: 0, width: 1, depth: 1, height: 1, material: "maple" }]}
    />
  );
}

const meta = {
  title: "Typography/Part",
  component: Part,
  args: { count: 96, label: "design tokens", piece: <Piece /> },
  render: (args) => (
    <Grid as="dl" columns="2">
      <Part {...args} />
      <Part count={20} label="components" piece={<Piece />} />
    </Grid>
  ),
} satisfies Meta<typeof Part>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PartsList: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("term")).toHaveLength(2);
  },
};
