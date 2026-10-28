import { Separator } from "@repo/ui/components/separator";
import { Grid } from "@repo/ui/layout/grid";
import { Stack } from "@repo/ui/layout/stack";
import { Text } from "@repo/ui/typography/text";

import { BadgeList } from "./badge-list";
import { ToolName } from "./tool-name";
import { ToolProof } from "./tool-proof";
import type { Tool } from "./toolbox";

export function ToolRow({ tool }: { tool: Tool }) {
  return (
    <Stack as="li" gap="lg">
      <Separator />
      <Grid columns="2" gap="md" align="start">
        <Stack gap="sm">
          <ToolName tool={tool} />
          <BadgeList items={tool.skills} label={`${tool.name} skills`} variant="outline" />
        </Stack>
        <Stack gap="xs">
          <Text tone="muted" measure="prose">
            {tool.description}
          </Text>
          <ToolProof tool={tool} />
        </Stack>
      </Grid>
    </Stack>
  );
}
