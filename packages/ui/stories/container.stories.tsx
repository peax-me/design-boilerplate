import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card } from "../src/components/card.tsx";
import { Container } from "../src/layout/container.tsx";
import { Stack } from "../src/layout/stack.tsx";
import { Text } from "../src/typography/text.tsx";

const meta = {
  title: "Layout/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Container>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: () => (
    <Stack gap="md">
      {(["prose", "narrow", "default", "wide"] as const).map((size) => (
        <Container key={size} size={size}>
          <Card variant="muted">
            <Text weight="medium">{size}</Text>
          </Card>
        </Container>
      ))}
    </Stack>
  ),
};
