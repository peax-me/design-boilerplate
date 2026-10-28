import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";
import { expect } from "storybook/test";

import { Icon } from "../src/components/icon.tsx";
import { Inline } from "../src/layout/inline.tsx";

const meta = {
  title: "Components/Icon",
  component: Icon,
  args: { icon: Sparkles },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  },
};

export const Labelled: Story = {
  args: { label: "Highlights" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Highlights" })).toBeVisible();
  },
};

export const Sizes: Story = {
  render: (args) => (
    <Inline gap="sm">
      <Icon {...args} size="sm" />
      <Icon {...args} size="md" />
      <Icon {...args} size="lg" />
    </Inline>
  ),
};
