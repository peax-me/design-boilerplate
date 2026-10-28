import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Stack } from "../src/layout/stack.tsx";
import { Heading } from "../src/typography/heading.tsx";

const meta = {
  title: "Typography/Heading",
  component: Heading,
  args: { level: 1, children: "Build interfaces that never drift" },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Display: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
  },
};

export const Sizes: Story = {
  render: (args) => (
    <Stack gap="lg">
      <Heading {...args} level={1} size="display-xl" />
      <Heading {...args} level={1} size="display" />
      <Heading {...args} level={2} size="title-lg" />
      <Heading {...args} level={3} size="title" />
      <Heading {...args} level={4} size="title-sm" />
      <Heading {...args} level={5} size="subtitle" />
    </Stack>
  ),
};

export const VisualSizeIndependentFromLevel: Story = {
  args: { level: 2, size: "display" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 2 })).toBeVisible();
  },
};
