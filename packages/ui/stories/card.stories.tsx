import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../src/components/button.tsx";
import { Card } from "../src/components/card.tsx";
import { Grid } from "../src/layout/grid.tsx";
import { Heading } from "../src/typography/heading.tsx";
import { Text } from "../src/typography/text.tsx";

function CardContent() {
  return (
    <>
      <Heading level={3} size="title-sm">
        Design tokens
      </Heading>
      <Text tone="muted">Every colour, size and duration comes from a single source.</Text>
      <Button variant="outline" size="sm">
        Read more
      </Button>
    </>
  );
}

const meta = {
  title: "Components/Card",
  component: Card,
  args: { children: <CardContent /> },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Surface: Story = {};

export const Variants: Story = {
  render: (args) => (
    <Grid columns="3">
      <Card {...args} variant="surface" />
      <Card {...args} variant="muted" />
      <Card {...args} variant="outline" />
    </Grid>
  ),
};

export const LargePadding: Story = { args: { padding: "lg" } };
