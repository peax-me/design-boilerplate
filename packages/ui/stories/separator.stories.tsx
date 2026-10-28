import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Separator } from "../src/components/separator.tsx";
import { Inline } from "../src/layout/inline.tsx";
import { Stack } from "../src/layout/stack.tsx";
import { Text } from "../src/typography/text.tsx";

const meta = {
  title: "Components/Separator",
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <Stack gap="sm">
      <Text>Above</Text>
      <Separator {...args} />
      <Text>Below</Text>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  },
};

export const Vertical: Story = {
  render: (args) => (
    <Inline gap="sm" wrap={false}>
      <Text>Left</Text>
      <Separator {...args} orientation="vertical" />
      <Text>Right</Text>
    </Inline>
  ),
};
