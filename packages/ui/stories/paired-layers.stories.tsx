import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { CodeBlock } from "../src/components/code-block.tsx";
import { CodeLine } from "../src/components/code-line.tsx";
import { PairedLayers } from "../src/layout/paired-layers.tsx";
import { Stack } from "../src/layout/stack.tsx";
import { Heading } from "../src/typography/heading.tsx";
import { Text } from "../src/typography/text.tsx";

const items = ["Tokens", "Lint", "Browser audit"].map((title) => ({
  id: title,
  aside: (
    <Stack gap="xs">
      <Heading level={3} size="subtitle">
        {title}
      </Heading>
      <Text tone="muted">What this step guarantees.</Text>
    </Stack>
  ),
  panel: (
    <CodeBlock title={title}>
      <CodeLine>{`${title} panel`}</CodeLine>
    </CodeBlock>
  ),
}));

const meta = {
  title: "Layout/PairedLayers",
  component: PairedLayers,
  parameters: {
    docs: {
      description: {
        component:
          "Each aside is followed by its panel. From the md breakpoint with motion allowed, asides stack in the first column and panels share one cell in the second, ready for a scroll-scene crossfade.",
      },
    },
  },
  args: { items },
} satisfies Meta<typeof PairedLayers>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("listitem")).toHaveLength(items.length);
  },
};
