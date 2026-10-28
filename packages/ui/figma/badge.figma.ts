// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=10-23
// source=packages/ui/src/components/badge.tsx
// component=Badge
import figma from "figma";

const instance = figma.selectedInstance;

const label = instance.getString("Label");
const variant = instance.getEnum("Variant", {
  Neutral: "neutral",
  Accent: "accent",
  Outline: "outline",
});
const icon = instance.getBoolean("Show icon") ? instance.getInstanceSwap("Icon") : null;
const iconCode = icon?.type === "INSTANCE" ? icon.executeTemplate().example : undefined;

export default {
  example: figma.code`<Badge variant="${variant}">
  ${iconCode}
  ${label}
</Badge>`,
  imports: ['import { Badge } from "@repo/ui/components/badge"'],
  id: "badge",
  metadata: { nestable: true },
};
