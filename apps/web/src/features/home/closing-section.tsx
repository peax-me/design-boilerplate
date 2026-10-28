import { ButtonLink } from "@repo/ui/components/button-link";
import { Container } from "@repo/ui/layout/container";
import { Inline } from "@repo/ui/layout/inline";
import { Section } from "@repo/ui/layout/section";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";
import { BookOpen } from "lucide-react";

import { ForkButton } from "./fork-button";
import { links } from "./links";

export function ClosingSection() {
  return (
    <Section tone="sheet" spacing="xl">
      <Container size="narrow">
        <Stack gap="xl" align="center">
          <Stack gap="md" align="center">
            <Heading level={2} size="display" align="center">
              Open the box.
            </Heading>
            <Text size="lg" tone="muted" align="center">
              Fork it, brief your agent, approve each phase.
            </Text>
          </Stack>
          <Inline gap="sm" justify="center">
            <ForkButton />
            <ButtonLink href={links.documentation} size="lg" variant="ghost">
              <BookOpen />
              Read the documentation
            </ButtonLink>
          </Inline>
        </Stack>
      </Container>
    </Section>
  );
}
