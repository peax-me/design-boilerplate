// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=10-69
// source=packages/ui/src/components/separator.tsx
// component=Separator
import figma from "figma";

const instance = figma.selectedInstance;

const orientation = instance.getEnum("Orientation", {
  Horizontal: "horizontal",
  Vertical: "vertical",
});

export default {
  example: figma.code`<Separator orientation="${orientation}" />`,
  imports: ['import { Separator } from "@repo/ui/components/separator"'],
  id: "separator",
  metadata: { nestable: true },
};
