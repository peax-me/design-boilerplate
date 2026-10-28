import { Grid } from "@repo/ui/layout/grid";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";

import { BadgeList } from "./badge-list";

const directions = [
  {
    title: "Code to Figma",
    description:
      "Tokens become variables in day, night and sheet modes, components become component sets, and flows become clickable prototypes.",
    skills: ["figma-sync", "figma-prototype"],
  },
  {
    title: "Figma to code",
    description:
      "Point your agent at a frame. It rebuilds it from your components and tokens, and proposes a new token when nothing fits.",
    skills: ["figma-design-to-code"],
  },
];

export function FigmaDirections() {
  return (
    <Grid columns="2" gap="2xl">
      {directions.map((direction) => (
        <Stack key={direction.title} gap="sm">
          <Heading level={3} size="title-sm">
            {direction.title}
          </Heading>
          <Text tone="muted" measure="prose">
            {direction.description}
          </Text>
          <BadgeList
            items={direction.skills}
            label={`${direction.title} skills`}
            variant="outline"
          />
        </Stack>
      ))}
    </Grid>
  );
}
