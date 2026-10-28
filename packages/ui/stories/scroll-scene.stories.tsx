import type { Meta, StoryObj } from "@storybook/react-vite";

import { Container } from "../src/layout/container.tsx";
import { Section } from "../src/layout/section.tsx";
import { Stack } from "../src/layout/stack.tsx";
import { ScrollScene } from "../src/motion/scroll-scene.tsx";
import { duration, ease, stagger } from "../src/motion/tokens.ts";
import { Heading } from "../src/typography/heading.tsx";
import { Text } from "../src/typography/text.tsx";

function revealLines(timeline: gsap.core.Timeline): void {
  timeline
    .from("[data-scene-item='title']", {
      yPercent: 40,
      opacity: 0,
      duration: duration.slow,
      ease: ease.emphasized,
    })
    .from("[data-scene-item='line']", { y: 24, opacity: 0, stagger: stagger.loose }, "<0.2");
}

const meta = {
  title: "Motion/ScrollScene",
  component: ScrollScene,
  parameters: { layout: "fullscreen" },
  args: {
    choreography: revealLines,
    length: "medium",
    children: (
      <Container size="narrow">
        <Stack gap="lg" align="center">
          <Heading level={2} size="display" align="center" data-scene-item="title">
            One idea per screen
          </Heading>
          <Text size="lg" tone="muted" align="center" data-scene-item="line">
            Scenes pin the stage while the story scrubs with the scroll.
          </Text>
          <Text size="lg" tone="muted" align="center" data-scene-item="line">
            Reduced motion shows the final state.
          </Text>
        </Stack>
      </Container>
    ),
  },
  render: (args) => (
    <>
      <Section spacing="xl">
        <Container>
          <Text tone="muted">Scroll down</Text>
        </Container>
      </Section>
      <ScrollScene {...args} />
      <Section spacing="xl" tone="muted">
        <Container>
          <Text tone="muted">After the scene</Text>
        </Container>
      </Section>
    </>
  ),
} satisfies Meta<typeof ScrollScene>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reveal: Story = {};
