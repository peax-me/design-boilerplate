// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=10-70
// source=packages/ui/src/components/text-link.tsx
// component=TextLink
import figma from "figma";

const instance = figma.selectedInstance;

const label = instance.getString("Label");

export default {
  example: figma.code`<TextLink render={<Link href="/" />}>${label}</TextLink>`,
  imports: [
    'import { TextLink } from "@repo/ui/components/text-link"',
    'import Link from "next/link"',
  ],
  id: "text-link",
  metadata: { nestable: true },
};
