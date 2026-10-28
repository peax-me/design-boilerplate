import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { TokenTray } from "../src/components/token-tray.tsx";

const meta = {
  title: "Components/TokenTray",
  component: TokenTray,
  parameters: {
    docs: {
      description: {
        component:
          "Swaps token presets declared in theme.css (paint, display face, spacing module, corners, table) on the whole page, inside a view transition. Every option is a preset; there is no free value.",
      },
    },
  },
} satisfies Meta<typeof TokenTray>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tray: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("radiogroup")).toHaveLength(5);
    await expect(canvas.getByRole("radio", { name: "Yellow paint" })).toBeChecked();
  },
};
