// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=20-54
// source=packages/ui/src/components/code-block.tsx
// component=CodeBlock
import figma from "figma";

const instance = figma.selectedInstance;

const title = instance.getBoolean("Show title") ? instance.getString("Title") : undefined;
const lines = instance.getSlot("Lines");

export default {
  example:
    title === undefined
      ? figma.code`<CodeBlock>${lines}</CodeBlock>`
      : figma.code`<CodeBlock title="${title}">
  ${lines}
</CodeBlock>`,
  imports: ['import { CodeBlock } from "@repo/ui/components/code-block"'],
  id: "code-block",
  metadata: { nestable: true },
};
