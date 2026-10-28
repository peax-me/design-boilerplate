import { Media } from "@repo/ui/components/media";
import { Container } from "@repo/ui/layout/container";
import { Section } from "@repo/ui/layout/section";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";
import Image from "next/image";

import { FigmaDirections } from "./figma-directions";
import figmaLibrary from "./images/figma-library.webp";

export function FigmaSection() {
  return (
    <Section spacing="lg" id="figma">
      <Container>
        <Stack gap="2xl">
          <Stack gap="sm">
            <Heading level={2} size="title-lg">
              Figma, in both directions
            </Heading>
            <Text size="lg" tone="muted" measure="prose">
              Your agent keeps the design system and the Figma library speaking the same language,
              so designers and code never diverge.
            </Text>
          </Stack>
          <Media
            image={
              <Image
                src={figmaLibrary}
                alt="The Figma library: colour variables on the painted table and the button set with maple planks"
                sizes="(min-width: 80rem) 76rem, 100vw"
              />
            }
            caption="The library, resynced from this page's theme by the figma-sync skill."
          />
          <FigmaDirections />
          <Text size="sm" tone="muted" measure="prose">
            Code Connect templates ship for every component; publishing them needs a Figma
            Organization plan.
          </Text>
        </Stack>
      </Container>
    </Section>
  );
}
