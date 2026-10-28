import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight } from "lucide-react";
import { expect } from "storybook/test";

import { ButtonLink } from "../src/components/button-link.tsx";
import { Inline } from "../src/layout/inline.tsx";

const meta = {
  title: "Components/ButtonLink",
  component: ButtonLink,
  args: { href: "#pricing", children: "See pricing" },
} satisfies Meta<typeof ButtonLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "See pricing" })).toHaveAttribute(
      "href",
      "#pricing",
    );
  },
};

export const Variants: Story = {
  render: (args) => (
    <Inline gap="sm">
      <ButtonLink {...args} variant="primary">
        See pricing
        <ArrowRight />
      </ButtonLink>
      <ButtonLink {...args} variant="outline" />
      <ButtonLink {...args} variant="ghost" />
    </Inline>
  ),
};
