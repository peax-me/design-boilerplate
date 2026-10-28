import type { Meta, StoryObj } from "@storybook/react-vite";

import { Grid } from "../src/layout/grid.tsx";
import { Stack } from "../src/layout/stack.tsx";
import { Text } from "../src/typography/text.tsx";
import { readTokens, type Token } from "./support/read-tokens.ts";

function TokenLabel({ token }: { token: Token }) {
  return (
    <Stack gap="none">
      <Text size="sm" weight="medium">
        {token.name}
      </Text>
      <Text size="xs" tone="muted">
        {token.value}
      </Text>
    </Stack>
  );
}

function Colors() {
  return (
    <Grid columns="4">
      {readTokens("--color-").map((token) => (
        <Stack key={token.name} gap="xs">
          <div
            className="h-16 rounded-lg border border-border"
            style={{ background: `var(${token.name})` }}
          />
          <TokenLabel token={token} />
        </Stack>
      ))}
    </Grid>
  );
}

function TypeScale() {
  return (
    <Stack gap="lg">
      {readTokens("--text-").map((token) => (
        <Stack key={token.name} gap="2xs">
          <TokenLabel token={token} />
          <p
            style={{
              fontSize: `var(${token.name})`,
              lineHeight: `var(${token.name}--line-height)`,
            }}
          >
            Design systems make the right choice the easy one.
          </p>
        </Stack>
      ))}
    </Stack>
  );
}

function Spacing() {
  return (
    <Stack gap="sm">
      {readTokens("--spacing-").map((token) => (
        <div key={token.name} className="grid grid-cols-4 items-center gap-4">
          <TokenLabel token={token} />
          <div className="h-4 bg-accent" style={{ width: `var(${token.name})` }} />
        </div>
      ))}
    </Stack>
  );
}

function Radii() {
  return (
    <Grid columns="4">
      {readTokens("--radius-").map((token) => (
        <Stack key={token.name} gap="xs">
          <div
            className="size-20 border border-border bg-muted"
            style={{ borderRadius: `var(${token.name})` }}
          />
          <TokenLabel token={token} />
        </Stack>
      ))}
    </Grid>
  );
}

function Shadows() {
  return (
    <Grid columns="4">
      {readTokens("--shadow-").map((token) => (
        <Stack key={token.name} gap="sm">
          <div className="h-20 rounded-lg bg-surface" style={{ boxShadow: `var(${token.name})` }} />
          <TokenLabel token={token} />
        </Stack>
      ))}
    </Grid>
  );
}

const meta = {
  title: "Foundations/Tokens",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Color: Story = { render: Colors };
export const Typography: Story = { render: TypeScale };
export const Space: Story = { render: Spacing };
export const Radius: Story = { render: Radii };
export const Elevation: Story = { render: Shadows };
