import { IsoBlocks } from "@repo/ui/components/iso-blocks";
import { Grid } from "@repo/ui/layout/grid";
import { Part } from "@repo/ui/typography/part";

import { partBlocks } from "./blocks";
import { facts } from "./facts";
import { grain } from "./grain";

const parts = [
  { key: "tokens", count: facts.tokens, label: "design tokens", blocks: partBlocks.tokens },
  {
    key: "components",
    count: facts.components,
    label: "components and primitives",
    blocks: partBlocks.components,
  },
  { key: "skills", count: facts.skills, label: "agent skills", blocks: partBlocks.skills },
  {
    key: "decisions",
    count: facts.decisions,
    label: "decision records",
    blocks: partBlocks.decisions,
  },
];

export function PartsList() {
  return (
    <Grid as="dl" columns="4" gap="xl">
      {parts.map((part) => (
        <Part
          key={part.key}
          count={part.count}
          label={part.label}
          piece={<IsoBlocks grain={grain} blocks={part.blocks} label="" aria-hidden />}
        />
      ))}
    </Grid>
  );
}
