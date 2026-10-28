"use client";

import { IsoBlocks } from "@repo/ui/components/iso-blocks";
import { Container } from "@repo/ui/layout/container";
import { Stack } from "@repo/ui/layout/stack";
import { ScrollScene } from "@repo/ui/motion/scroll-scene";
import { Heading } from "@repo/ui/typography/heading";

import { renegadeBlocks } from "./blocks";
import { grain } from "./grain";
import { RenegadeCaptions } from "./renegade-captions";
import { snapRenegades } from "./renegade-choreography";
import { RenegadeStills } from "./renegade-stills";

export function DriftScene() {
  return (
    <ScrollScene choreography={snapRenegades} length="long" still={<RenegadeStills />}>
      <Container size="narrow">
        <Stack gap="2xl" align="center">
          <Heading level={2} size="title-lg" align="center">
            Create freely. Every piece stays on scale.
          </Heading>
          <IsoBlocks
            grain={grain}
            blocks={renegadeBlocks}
            label="A page of blocks where a 13px gap, a hex colour and a 7px corner were replaced by the gap-3, accent and rounded-md tokens"
          />
          <RenegadeCaptions />
        </Stack>
      </Container>
    </ScrollScene>
  );
}
