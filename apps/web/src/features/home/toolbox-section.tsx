import { Container } from "@repo/ui/layout/container";
import { Section } from "@repo/ui/layout/section";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";

import { ToolRow } from "./tool-row";
import { tools } from "./toolbox";

export function ToolboxSection() {
  return (
    <Section spacing="lg" tone="sheet" id="toolbox">
      <Container>
        <Stack gap="2xl">
          <Stack gap="sm">
            <Heading level={2} size="title-lg">
              Eight tools, and what each made on this page
            </Heading>
            <Text size="lg" tone="muted" measure="prose">
              Each tool is a skill your agent loads when the task calls for it. Together they built
              this page.
            </Text>
          </Stack>
          <Stack as="ul" gap="lg">
            {tools.map((tool) => (
              <ToolRow key={tool.name} tool={tool} />
            ))}
          </Stack>
        </Stack>
      </Container>
    </Section>
  );
}
