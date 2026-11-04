import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { IsoBlocks } from "../src/components/iso-blocks.tsx";
import { Stage } from "../src/motion/stage.tsx";
import { LIVE_TIMEOUT } from "./support/live-timeout.ts";
import { plainBox, plainScene } from "./support/plain-scene.tsx";

const meta = {
  title: "Motion/Stage",
  component: Stage,
  parameters: {
    docs: {
      description: {
        component:
          "Hosts a WebGL scene over its poster. The poster is the complete still image and carries the accessible name. The scene loads once the page is idle, the device runs WebGL2 without reduced motion and the stage comes within half a window of the viewport; on phones it also waits for a first interaction. It fades in once its first frame is drawn, and a failing scene, a lost context or reduced motion brings the poster back. An ambient scene moves on its own: once live, it gets a control to pause and play it (pauseLabel, playLabel). A stage sized by its className sizes its poster layer too, so a poster can cover it. renderScene returns a lazy component holding a StageCanvas.",
      },
    },
  },
  args: {
    poster: <IsoBlocks blocks={plainBox} label="A plain box" />,
    renderScene: plainScene,
    className: "max-w-xl",
  },
} satisfies Meta<typeof Stage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlainBox: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "A plain box" })).toBeInTheDocument();
  },
};

export const Ambient: Story = {
  args: { ambient: true },
  play: async ({ canvas, userEvent }) => {
    /* A phone-sized frame loads the scene after a first interaction. */
    await userEvent.click(canvas.getByRole("img", { name: "A plain box" }));
    const pauseControl = await canvas.findByRole(
      "button",
      { name: "Pause animation" },
      LIVE_TIMEOUT,
    );

    await userEvent.click(pauseControl);

    await expect(canvas.getByRole("button", { name: "Play animation" })).toBeInTheDocument();
  },
};
