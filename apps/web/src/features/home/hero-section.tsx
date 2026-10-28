import { TokenTray } from "@repo/ui/components/token-tray";
import { Container } from "@repo/ui/layout/container";
import { Grid } from "@repo/ui/layout/grid";
import { Section } from "@repo/ui/layout/section";
import { Stack } from "@repo/ui/layout/stack";
import { BlockStage } from "@repo/ui/motion/block-stage";

import { pageBlocks } from "./blocks";
import { grain } from "./grain";
import { HeroCopy } from "./hero-copy";

export function HeroSection() {
  return (
    <Section spacing="md">
      <Container>
        <Grid columns="2" from="lg" gap="3xl" align="center">
          <HeroCopy />
          <Stack gap="xl">
            <BlockStage
              blocks={pageBlocks}
              label="Wooden blocks assembled into a miniature of this page"
              grain={grain}
            />
            <TokenTray id="tray" />
          </Stack>
        </Grid>
      </Container>
    </Section>
  );
}
