import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Media } from "../src/components/media.tsx";

const meta = {
  title: "Components/Media",
  component: Media,
  parameters: {
    docs: {
      description: {
        component:
          'Frames an image with an optional caption. Apps pass `image={<Image src={…} alt="…" sizes="…" />}` from next/image; the frame sizes it to its column.',
      },
    },
  },
  args: {
    image: (
      <img
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23ecd2a0'/%3E%3C/svg%3E"
        alt="A maple panel"
      />
    ),
    caption: "Generated for this page.",
    className: "max-w-xl",
  },
} satisfies Meta<typeof Media>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithCaption: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "A maple panel" })).toBeVisible();
  },
};
