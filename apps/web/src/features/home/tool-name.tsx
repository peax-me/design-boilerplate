import { IsoBlocks } from "@repo/ui/components/iso-blocks";
import { Inline } from "@repo/ui/layout/inline";
import { Heading } from "@repo/ui/typography/heading";

import { grain } from "./grain";
import type { Tool } from "./toolbox";

export function ToolName({ tool }: { tool: Tool }) {
  return (
    <Inline gap="sm" wrap={false}>
      <IsoBlocks grain={grain} blocks={tool.piece} label="" size="icon" aria-hidden />
      <Heading level={3} size="subtitle">
        {tool.name}
      </Heading>
    </Inline>
  );
}
