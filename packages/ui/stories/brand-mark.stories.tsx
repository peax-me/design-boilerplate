import type { Meta, StoryObj } from "@storybook/react-vite";
import { siNextdotjs, siReact, siThreedotjs } from "simple-icons";
import { expect } from "storybook/test";

import { BrandMark } from "../src/components/brand-mark.tsx";
import { Inline } from "../src/layout/inline.tsx";
import { Text } from "../src/typography/text.tsx";

const meta = {
  title: "Components/BrandMark",
  component: BrandMark,
  parameters: {
    docs: {
      description: {
        component:
          "A technology or brand logo from Simple Icons, drawn in the current text colour. Decorative: always pair it with the name in text.",
      },
    },
  },
  args: { icon: siNextdotjs },
  render: (args) => (
    <Inline as="ul" gap="md">
      {[args.icon, siReact, siThreedotjs].map((icon) => (
        <Inline as="li" key={icon.slug} gap="xs">
          <BrandMark {...args} icon={icon} />
          <Text as="span" size="sm">
            {icon.title}
          </Text>
        </Inline>
      ))}
    </Inline>
  ),
} satisfies Meta<typeof BrandMark>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithNames: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Next.js")).toBeVisible();
  },
};
