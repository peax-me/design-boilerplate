import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card } from "../src/components/card.tsx";
import { Grid } from "../src/layout/grid.tsx";
import { Text } from "../src/typography/text.tsx";

const items = ["Tokens", "Layout", "Typography", "Motion", "Copy", "Checks"];

const meta = {
  title: "Layout/Grid",
  component: Grid,
  args: {
    children: items.map((item) => (
      <Card key={item}>
        <Text weight="medium">{item}</Text>
      </Card>
    )),
  },
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ThreeColumns: Story = {};
export const TwoColumns: Story = { args: { columns: "2" } };
export const FourColumns: Story = { args: { columns: "4" } };
export const TwoColumnsFromLarge: Story = { args: { columns: "2", from: "lg" } };
