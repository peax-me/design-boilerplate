import { Container } from "@repo/ui/layout/container";
import { Grid } from "@repo/ui/layout/grid";
import { Section } from "@repo/ui/layout/section";
import { Stack } from "@repo/ui/layout/stack";
import { Heading } from "@repo/ui/typography/heading";
import { Text } from "@repo/ui/typography/text";

const objections = [
  {
    question: "Is it too strict to build something original?",
    answer:
      "This page is the answer: a new world is tokens and variants in packages/ui. The rules apply to pages; the box stays yours to fill.",
  },
  {
    question: "Do I need Figma?",
    answer:
      "No. Code is the source of truth. When designers join, the agent pushes the system to Figma and reads their frames back into code.",
  },
  {
    question: "Which agents does it work with?",
    answer:
      "Claude Code gets the hooks, skills and design reviewer. Any agent that reads AGENTS.md follows the same rules, and CI enforces them for everyone.",
  },
  {
    question: "Can I swap part of the stack?",
    answer:
      "Yes. Every choice is an ADR with its alternatives. Write a new ADR that supersedes it, and CI waits for your approval.",
  },
];

export function ObjectionsSection() {
  return (
    <Section tone="muted" spacing="lg">
      <Container>
        <Stack gap="2xl">
          <Heading level={2} size="title-lg">
            Questions before you fork
          </Heading>
          <Grid as="ul" columns="2" gap="2xl">
            {objections.map((objection) => (
              <Stack as="li" key={objection.question} gap="xs">
                <Heading level={3} size="subtitle">
                  {objection.question}
                </Heading>
                <Text tone="muted">{objection.answer}</Text>
              </Stack>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
