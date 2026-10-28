// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=20-53
// source=packages/ui/src/components/code-line.tsx
// component=CodeLine
import figma from "figma";

const instance = figma.selectedInstance;

const text = instance.getString("Text");
const tone = instance.getEnum("Tone", {
  Default: "default",
  Muted: "muted",
  Accent: "accent",
  Destructive: "destructive",
});

export default {
  example: figma.code`<CodeLine tone="${tone}">{${JSON.stringify(text)}}</CodeLine>`,
  imports: ['import { CodeLine } from "@repo/ui/components/code-line"'],
  id: "code-line",
  metadata: { nestable: true },
};
