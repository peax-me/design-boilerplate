import { Container } from "@repo/ui/layout/container";
import { Grid } from "@repo/ui/layout/grid";
import { Section } from "@repo/ui/layout/section";
import { Stack } from "@repo/ui/layout/stack";
import { BlockStage } from "@repo/ui/motion/block-stage";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";

import { BadgeList } from "./badge-list";
import { showcaseBlocks } from "./blocks";
import { grain } from "./grain";

const capabilities = [
  "Images",
  "3D models",
  "Background removal",
  "Vector icons",
  "Upscales",
  "Video loops",
];

export function GenerateSection() {
  return (
    <Section spacing="lg" tone="muted" id="generate">
      <Container>
        <Grid columns="2" from="lg" gap="3xl" align="center">
          <Stack gap="lg">
            <Heading level={2} size="title-lg">
              Generate the pieces you are missing
            </Heading>
            <Text size="lg" tone="muted" measure="prose">
              The Magnific MCP finds stock or generates what the page needs, after a quote you
              approve. Every file lands with its prompt, licence and cost on record.
            </Text>
            <BadgeList items={capabilities} label="What the agent can generate" />
          </Stack>
          <Stack gap="md">
            <BlockStage
              blocks={showcaseBlocks}
              label="Maple and lacquered blocks showing the generated wood grain"
              grain={grain}
            />
            <Text size="sm" tone="muted">
              Generated for this page: the maple grain on every block. Four variants, 260 credits.
            </Text>
          </Stack>
        </Grid>
      </Container>
    </Section>
  );
}
