// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=41-97
// source=packages/ui/src/typography/stat.tsx
// component=Stat
import figma from "figma";

const instance = figma.selectedInstance;

const value = instance.getString("Value");
const label = instance.getString("Label");

export default {
  example: figma.code`<Stat value="${value}" label="${label}" />`,
  imports: ['import { Stat } from "@repo/ui/typography/stat"'],
  id: "stat",
  metadata: { nestable: true },
};
