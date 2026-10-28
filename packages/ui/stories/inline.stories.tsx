import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../src/components/badge.tsx";
import { Button } from "../src/components/button.tsx";
import { Inline } from "../src/layout/inline.tsx";

const meta = {
  title: "Layout/Inline",
  component: Inline,
  args: {
    children: (
      <>
        <Badge>Design</Badge>
        <Badge>Motion</Badge>
        <Badge>Copy</Badge>
      </>
    ),
  },
} satisfies Meta<typeof Inline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SpaceBetween: Story = {
  args: {
    justify: "between",
    children: (
      <>
        <Button variant="ghost">Back</Button>
        <Button>Continue</Button>
      </>
    ),
  },
};
