import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Grid } from "../src/layout/grid.tsx";
import { Stat } from "../src/typography/stat.tsx";

const meta = {
  title: "Typography/Stat",
  component: Stat,
  args: { value: "95+", label: "Lighthouse performance on mobile" },
  render: (args) => (
    <Grid as="dl" columns="4">
      <Stat {...args} />
      <Stat value="100" label="Accessibility, best practices and SEO" />
      <Stat value="0" label="Arbitrary values that reach main" />
      <Stat value="18" label="Browser checks on every route" />
    </Grid>
  ),
} satisfies Meta<typeof Stat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Budgets: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("definition")).toHaveLength(4);
    await expect(canvas.getAllByRole("term")[0]).toHaveTextContent(
      "Lighthouse performance on mobile",
    );
  },
};
