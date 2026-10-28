import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Heading } from "../src/typography/heading.tsx";
import { Highlight } from "../src/typography/highlight.tsx";

const meta = {
  title: "Typography/Highlight",
  component: Highlight,
  args: { children: "one box" },
  render: (args) => (
    <Heading level={2} size="display">
      Every page, built from <Highlight {...args} /> of blocks.
    </Heading>
  ),
} satisfies Meta<typeof Highlight>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InHeading: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("one box")).toBeVisible();
  },
};
