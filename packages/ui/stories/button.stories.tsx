import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight } from "lucide-react";
import { expect, fn } from "storybook/test";

import { Button } from "../src/components/button.tsx";
import { Inline } from "../src/layout/inline.tsx";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Get started", onClick: fn<() => void>() },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Get started" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Variants: Story = {
  render: (args) => (
    <Inline gap="sm">
      <Button {...args} variant="primary" />
      <Button {...args} variant="secondary" />
      <Button {...args} variant="accent" />
      <Button {...args} variant="outline" />
      <Button {...args} variant="ghost" />
    </Inline>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <Inline gap="sm">
      <Button {...args} size="sm" />
      <Button {...args} size="md" />
      <Button {...args} size="lg" />
      <Button {...args} size="icon" aria-label="Continue">
        <ArrowRight />
      </Button>
    </Inline>
  ),
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        Get started
        <ArrowRight />
      </>
    ),
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Get started" });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
