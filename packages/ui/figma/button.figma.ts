// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=9-124
// source=packages/ui/src/components/button.tsx
// component=Button
import figma from "figma";

const instance = figma.selectedInstance;

const label = instance.getString("Label");
const variant = instance.getEnum("Variant", {
  Primary: "primary",
  Secondary: "secondary",
  Accent: "accent",
  Outline: "outline",
  Ghost: "ghost",
});
const size = instance.getEnum("Size", { SM: "sm", MD: "md", LG: "lg", Icon: "icon" });
const showIcon = size === "icon" || instance.getBoolean("Show icon");
const icon = showIcon ? instance.getInstanceSwap("Icon") : null;
const iconCode = icon?.type === "INSTANCE" ? icon.executeTemplate().example : undefined;
const leadingIcon = instance.getBoolean("Show leading icon")
  ? instance.getInstanceSwap("Leading icon")
  : null;
const leadingIconCode =
  leadingIcon?.type === "INSTANCE" ? leadingIcon.executeTemplate().example : undefined;

export default {
  example:
    size === "icon"
      ? figma.code`<Button variant="${variant}" size="icon" aria-label="${label}">${iconCode}</Button>`
      : figma.code`<Button variant="${variant}" size="${size}">
  ${leadingIconCode}
  ${label}
  ${iconCode}
</Button>`,
  imports: ['import { Button } from "@repo/ui/components/button"'],
  id: "button",
  metadata: { nestable: true },
};
