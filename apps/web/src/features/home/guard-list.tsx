import { Icon } from "@repo/ui/components/icon";
import { Grid } from "@repo/ui/layout/grid";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";
import { ListChecks, Lock, Scale, ScanEye } from "lucide-react";

const guards = [
  { name: "Locked theme", description: "Only tokens generate utilities.", icon: Lock },
  {
    name: "Lint on every edit",
    description: "The agent's turn waits until the file is clean.",
    icon: ListChecks,
  },
  {
    name: "Browser audit",
    description: "Tokens, WCAG 2.2 AA, padding and overlaps on three viewports.",
    icon: ScanEye,
  },
  {
    name: "Open rules",
    description: "Any rule can change through a decision record.",
    icon: Scale,
  },
];

export function GuardList() {
  return (
    <Grid as="ul" columns="4" gap="xl" aria-label="Guard rails">
      {guards.map((guard) => (
        <Stack as="li" key={guard.name} gap="xs">
          <Icon icon={guard.icon} size="lg" />
          <Heading level={3} size="subtitle">
            {guard.name}
          </Heading>
          <Text tone="muted">{guard.description}</Text>
        </Stack>
      ))}
    </Grid>
  );
}
