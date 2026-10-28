import { IsoBlocks } from "@repo/ui/components/iso-blocks";
import { Container } from "@repo/ui/layout/container";
import { Grid } from "@repo/ui/layout/grid";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";

import { renegadeStills } from "./blocks";
import { grain } from "./grain";
import { renegadeSteps } from "./renegade-steps";

const stills = [renegadeStills.draft, renegadeStills.detect, renegadeStills.snap];

export function RenegadeStills() {
  return (
    <Container size="narrow">
      <Stack gap="2xl" align="center">
        <Heading level={2} size="title-lg" align="center">
          Create freely. Every piece stays on scale.
        </Heading>
        <Grid as="ol" columns="3" gap="lg">
          {renegadeSteps.map((step, index) => (
            <Stack as="li" key={step} gap="md">
              <IsoBlocks
                grain={grain}
                blocks={stills[index] ?? []}
                label=""
                size="frame"
                aria-hidden
              />
              <Text>{step}</Text>
            </Stack>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}
