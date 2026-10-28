// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=41-109
// source=packages/ui/src/components/media.tsx
// component=Media
import figma from "figma";

const instance = figma.selectedInstance;

const caption = instance.getBoolean("Show caption")
  ? ` caption="${instance.getString("Caption")}"`
  : "";

export default {
  example: figma.code`<Media image={<Image src={image} alt="…" sizes="…" />}${caption} />`,
  imports: ['import { Media } from "@repo/ui/components/media"', 'import Image from "next/image"'],
  id: "media",
  metadata: { nestable: true },
};
