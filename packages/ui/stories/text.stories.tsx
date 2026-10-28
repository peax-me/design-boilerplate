import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "../src/layout/stack.tsx";
import { Text } from "../src/typography/text.tsx";

const meta = {
  title: "Typography/Text",
  component: Text,
  args: { children: "Every value on this page comes from a design token." },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Body: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <Stack gap="sm">
      <Text {...args} size="lg" />
      <Text {...args} size="md" />
      <Text {...args} size="sm" />
      <Text {...args} size="xs" />
    </Stack>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <Stack gap="sm">
      <Text {...args} tone="default" />
      <Text {...args} tone="muted" />
      <Text {...args} tone="accent" />
      <Text {...args} tone="destructive" />
    </Stack>
  ),
};

export const Weights: Story = {
  render: (args) => (
    <Stack gap="sm">
      <Text {...args} weight="regular" />
      <Text {...args} weight="medium" />
      <Text {...args} weight="semibold" />
    </Stack>
  ),
};

export const Measure: Story = {
  args: {
    measure: "prose",
    children:
      "A paragraph set to the prose measure stops at a comfortable line length, however wide its container is, so long copy stays easy to read on tablets and wide screens.",
  },
};
