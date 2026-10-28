import { Container } from "@repo/ui/layout/container";
import { Grid } from "@repo/ui/layout/grid";
import { Section } from "@repo/ui/layout/section";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";

import { AssemblySteps } from "./assembly-steps";
import { CodeSample } from "./code-sample";
import { quickStart } from "./code-samples";
import { ForkButton } from "./fork-button";

export function InstructionsSection() {
  return (
    <Section spacing="md">
      <Container>
        <Stack gap="3xl">
          <Grid columns="2" from="lg" gap="3xl" align="center">
            <Stack gap="lg">
              <Heading level={2} size="title-lg">
                From brief to shipped page
              </Heading>
              <Text size="lg" tone="muted" measure="prose">
                The same four stages for every project, with your approval at each one.
              </Text>
              <Stack align="start">
                <ForkButton />
              </Stack>
            </Stack>
            <CodeSample title="terminal" lines={quickStart} />
          </Grid>
          <AssemblySteps />
        </Stack>
      </Container>
    </Section>
  );
}
