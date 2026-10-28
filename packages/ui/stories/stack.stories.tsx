import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card } from "../src/components/card.tsx";
import { Stack } from "../src/layout/stack.tsx";
import { Text } from "../src/typography/text.tsx";

function Items() {
  return (
    <>
      <Card variant="muted">
        <Text>First</Text>
      </Card>
      <Card variant="muted">
        <Text>Second</Text>
      </Card>
      <Card variant="muted">
        <Text>Third</Text>
      </Card>
    </>
  );
}

const meta = {
  title: "Layout/Stack",
  component: Stack,
  args: { children: <Items /> },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Gaps: Story = {
  render: (args) => (
    <Stack gap="2xl">
      <Stack {...args} gap="xs" />
      <Stack {...args} gap="lg" />
      <Stack {...args} gap="2xl" />
    </Stack>
  ),
};

export const Centered: Story = { args: { align: "center" } };
