// url=https://www.figma.com/design/0WtO809qZsF4yAmfPoIPGW/Boilerplate---Alex?node-id=42-134
// source=packages/ui/src/components/brand-mark.tsx
// component=BrandMark
import figma from "figma";

const instance = figma.selectedInstance;

const icon = instance.getEnum("Brand", {
  "Next.js": "siNextdotjs",
  React: "siReact",
  TypeScript: "siTypescript",
  "Tailwind CSS": "siTailwindcss",
  GSAP: "siGsap",
  "Three.js": "siThreedotjs",
});
const size = instance.getEnum("Size", { SM: "sm", MD: "md" });

export default {
  example: figma.code`<BrandMark icon={${icon}} size="${size}" />`,
  imports: [
    'import { BrandMark } from "@repo/ui/components/brand-mark"',
    `import { ${icon} } from "simple-icons"`,
  ],
  id: "brand-mark",
  metadata: { nestable: true },
};
