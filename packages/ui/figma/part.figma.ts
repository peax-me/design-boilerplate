// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=41-100
// source=packages/ui/src/typography/part.tsx
// component=Part
import figma from "figma";

const instance = figma.selectedInstance;

const count = instance.getString("Count").replace("×", "");
const label = instance.getString("Label");

export default {
  example: figma.code`<Part
  count={${count}}
  label="${label}"
  piece={<IsoBlocks blocks={blocks} label="" aria-hidden />}
/>`,
  imports: [
    'import { Part } from "@repo/ui/typography/part"',
    'import { IsoBlocks } from "@repo/ui/components/iso-blocks"',
  ],
  id: "part",
  metadata: { nestable: true },
};
