import type { Preview } from "@storybook/react-vite";

import "./preview.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
  },
};

export default preview;
