import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { CodeBlock } from "../src/components/code-block.tsx";
import { CodeLine } from "../src/components/code-line.tsx";

const meta = {
  title: "Components/CodeBlock",
  component: CodeBlock,
  args: {
    title: "terminal",
    children: (
      <>
        <CodeLine tone="muted">$ pnpm lint</CodeLine>
        <CodeLine tone="destructive">
          ✗ Arbitrary values invent design: add a token to theme.css instead.
        </CodeLine>
        <CodeLine tone="accent">✓ 0 problems after the fix</CodeLine>
      </>
    ),
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Terminal: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("figure", { name: "terminal" })).toBeVisible();
  },
};

export const Untitled: Story = {
  render: ({ children }) => <CodeBlock>{children}</CodeBlock>,
};

export const Tones: Story = {
  args: {
    title: "tones",
    children: (
      <>
        <CodeLine>default</CodeLine>
        <CodeLine tone="muted">muted</CodeLine>
        <CodeLine tone="accent">accent</CodeLine>
        <CodeLine tone="destructive">destructive</CodeLine>
      </>
    ),
  },
};
