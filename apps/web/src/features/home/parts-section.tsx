import { Container } from "@repo/ui/layout/container";
import { Section } from "@repo/ui/layout/section";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";

import { facts } from "./facts";
import { GuardList } from "./guard-list";
import { PartsList } from "./parts-list";

export function PartsSection() {
  return (
    <Section spacing="lg" id="counts">
      <Container>
        <Stack gap="2xl">
          <Stack gap="sm">
            <Heading level={2} size="title-lg">
              Counted, not claimed.
            </Heading>
            <Text size="lg" tone="muted" measure="prose">
              Every figure is read from the repository when the page is built, and four guards keep
              every piece on scale.
            </Text>
          </Stack>
          <PartsList />
          <GuardList />
          <Text tone="muted" measure="prose">
            {`Every pull request also holds a Lighthouse budget: performance at ${facts.performanceBudget} or more, accessibility, best practices and SEO at 100.`}
          </Text>
        </Stack>
      </Container>
    </Section>
  );
}
