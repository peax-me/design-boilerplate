// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=10-66
// source=packages/ui/src/components/card.tsx
// component=Card
import figma from "figma";

const instance = figma.selectedInstance;

const variant = instance.getEnum("Variant", {
  Surface: "surface",
  Muted: "muted",
  Outline: "outline",
});
const padding = instance.getEnum("Padding", { MD: "md", LG: "lg" });
const content = instance.getSlot("Content");

export default {
  example: figma.code`<Card variant="${variant}" padding="${padding}">
  ${content}
</Card>`,
  imports: ['import { Card } from "@repo/ui/components/card"'],
  id: "card",
  metadata: { nestable: true },
};
