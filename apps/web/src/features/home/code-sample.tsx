import { CodeBlock } from "@repo/ui/components/code-block";
import { CodeLine } from "@repo/ui/components/code-line";
import type { ComponentProps } from "react";

export interface SampleLine {
  text: string;
  tone?: NonNullable<ComponentProps<typeof CodeLine>["tone"]>;
}

interface CodeSampleProps {
  title: string;
  lines: SampleLine[];
  "data-scene-item"?: string;
}

export function CodeSample({ title, lines, ...props }: CodeSampleProps) {
  return (
    <CodeBlock title={title} {...props}>
      {lines.map((line) => (
        <CodeLine key={line.text} tone={line.tone ?? "default"}>
          {line.text}
        </CodeLine>
      ))}
    </CodeBlock>
  );
}
