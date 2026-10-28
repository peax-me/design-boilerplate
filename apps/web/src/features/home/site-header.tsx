import { ButtonLink } from "@repo/ui/components/button-link";
import { IsoBlocks } from "@repo/ui/components/iso-blocks";
import { Container } from "@repo/ui/layout/container";
import { Inline } from "@repo/ui/layout/inline";
import { Section } from "@repo/ui/layout/section";
import { Text } from "@repo/ui/typography/text";
import { GitFork } from "lucide-react";

import { wordmarkBlocks } from "./blocks";
import { grain } from "./grain";
import { links } from "./links";

export function SiteHeader() {
  return (
    <Section as="header" spacing="xs">
      <Container>
        <Inline justify="between" wrap={false}>
          <Inline gap="sm" wrap={false}>
            <IsoBlocks grain={grain} blocks={wordmarkBlocks} label="" size="icon" aria-hidden />
            <Text as="span" weight="semibold">
              design‑boilerplate
            </Text>
          </Inline>
          <Inline as="nav" gap="xs" wrap={false} aria-label="Main">
            <ButtonLink href={links.documentation} variant="ghost" size="sm">
              Docs
            </ButtonLink>
            <ButtonLink href={links.fork} variant="outline" size="sm">
              <GitFork />
              Fork
            </ButtonLink>
          </Inline>
        </Inline>
      </Container>
    </Section>
  );
}
