import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../src/components/badge.tsx";
import { Inline } from "../src/layout/inline.tsx";

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "New" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Variants: Story = {
  render: (args) => (
    <Inline gap="xs">
      <Badge {...args} variant="neutral" />
      <Badge {...args} variant="accent" />
      <Badge {...args} variant="outline" />
    </Inline>
  ),
};
