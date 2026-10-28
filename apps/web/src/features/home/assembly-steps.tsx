import { IsoBlocks } from "@repo/ui/components/iso-blocks";
import { Grid } from "@repo/ui/layout/grid";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";

import { stepBlocks } from "./blocks";
import { grain } from "./grain";

const steps = [
  {
    title: "Brief and direction",
    description:
      "The kickoff skill writes the product context, then deals visual directions for you to choose.",
  },
  {
    title: "System and Figma",
    description: "Tokens and components follow the direction, and the Figma library mirrors them.",
  },
  {
    title: "Story and assets",
    description: "Copy, storyboard and asset list wait for your go; generation waits for a quote.",
  },
  {
    title: "Build and verify",
    description:
      "Pages compose the system; lint, tests, the browser audit and a reviewer agent decide when it ships.",
  },
];

export function AssemblySteps() {
  return (
    <Grid as="ol" columns="4" gap="xl">
      {steps.map((step, index) => (
        <Stack as="li" key={step.title} gap="md">
          <IsoBlocks
            grain={grain}
            blocks={stepBlocks[index] ?? []}
            label=""
            size="frame"
            aria-hidden
          />
          <Stack gap="xs">
            <Heading level={3} size="subtitle">
              {`${index + 1}. ${step.title}`}
            </Heading>
            <Text tone="muted">{step.description}</Text>
          </Stack>
        </Stack>
      ))}
    </Grid>
  );
}
