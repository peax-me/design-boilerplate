import { TextLink } from "@repo/ui/components/text-link";
import { Text } from "@repo/ui/typography/text";

import type { Tool } from "./toolbox";

export function ToolProof({ tool }: { tool: Tool }) {
  return (
    <Text measure="prose">
      {"On this page: "}
      {tool.href === undefined ? tool.here : <TextLink href={tool.href}>{tool.here}</TextLink>}
    </Text>
  );
}
