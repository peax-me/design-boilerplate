import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { TextLink } from "../src/components/text-link.tsx";

const meta = {
  title: "Components/TextLink",
  component: TextLink,
  args: { href: "#documentation", children: "Read the documentation" },
} satisfies Meta<typeof TextLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Read the documentation" })).toHaveAttribute(
      "href",
      "#documentation",
    );
  },
};
