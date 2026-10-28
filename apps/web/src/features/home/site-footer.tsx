import { TextLink } from "@repo/ui/components/text-link";
import { Container } from "@repo/ui/layout/container";
import { Inline } from "@repo/ui/layout/inline";
import { Section } from "@repo/ui/layout/section";
import { Text } from "@repo/ui/typography/text";

import { links } from "./links";

export function SiteFooter() {
  return (
    <Section as="footer" spacing="sm">
      <Container>
        <Inline justify="between">
          <Text size="sm" tone="muted">
            Built with the design system it describes.
          </Text>
          <TextLink href={links.repository}>GitHub</TextLink>
        </Inline>
      </Container>
    </Section>
  );
}
