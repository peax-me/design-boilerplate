import type { Meta, StoryObj } from "@storybook/react-vite";

import { Container } from "../src/layout/container.tsx";
import { Section } from "../src/layout/section.tsx";
import { Stack } from "../src/layout/stack.tsx";
import { Heading } from "../src/typography/heading.tsx";
import { Text } from "../src/typography/text.tsx";

function SectionContent() {
  return (
    <Container>
      <Stack gap="sm">
        <Heading level={2}>Sections set the vertical rhythm</Heading>
        <Text tone="muted">Spacing, tone and colour scheme are the only choices.</Text>
      </Stack>
    </Container>
  );
}

const meta = {
  title: "Layout/Section",
  component: Section,
  parameters: { layout: "fullscreen" },
  args: { children: <SectionContent /> },
} satisfies Meta<typeof Section>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Muted: Story = { args: { tone: "muted" } };
export const DarkScheme: Story = { args: { scheme: "dark" } };
export const ExtraLarge: Story = { args: { spacing: "xl" } };
export const Sheet: Story = { args: { tone: "sheet" } };
