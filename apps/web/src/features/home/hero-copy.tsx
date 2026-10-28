import { BrandMark } from "@repo/ui/components/brand-mark";
import { ButtonLink } from "@repo/ui/components/button-link";
import { Inline } from "@repo/ui/layout/inline";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Highlight } from "@repo/ui/typography/highlight";
import { Text } from "@repo/ui/typography/text";
import { ArrowDown } from "lucide-react";
import {
  siGsap,
  siNextdotjs,
  siReact,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
} from "simple-icons";

import { ForkButton } from "./fork-button";

const technologies = [
  { name: "Next.js 16", icon: siNextdotjs },
  { name: "React 19", icon: siReact },
  { name: "TypeScript 7", icon: siTypescript },
  { name: "Tailwind CSS 4", icon: siTailwindcss },
  { name: "GSAP", icon: siGsap },
  { name: "three.js", icon: siThreedotjs },
];

export function HeroCopy() {
  return (
    <Stack gap="2xl">
      <Stack gap="lg">
        <Heading level={1} size="display-xl">
          Every tool to design with your agent, in <Highlight>one box</Highlight>.
        </Heading>
        <Text size="lg" tone="muted" measure="prose">
          A Next.js monorepo that gives your agent a studio: visual directions, a design system
          synced with Figma, generated images and 3D, scroll choreography and copy that converts.
          Every piece stays on scale.
        </Text>
      </Stack>
      <Stack gap="md">
        <Inline gap="sm">
          <ForkButton />
          <ButtonLink href="#toolbox" size="lg" variant="outline">
            Open the toolbox
            <ArrowDown />
          </ButtonLink>
        </Inline>
        <Inline as="ul" gap="sm" aria-label="Technologies">
          {technologies.map((technology) => (
            <Inline as="li" key={technology.name} gap="xs">
              <BrandMark icon={technology.icon} />
              <Text as="span" size="sm" tone="muted">
                {technology.name}
              </Text>
            </Inline>
          ))}
        </Inline>
      </Stack>
    </Stack>
  );
}
