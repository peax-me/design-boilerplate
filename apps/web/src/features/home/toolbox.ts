import type { Block } from "@repo/ui/lib/isometric";

import { toolBlocks } from "./blocks";
import { facts } from "./facts";

export interface Tool {
  name: string;
  skills: string[];
  description: string;
  here: string;
  href?: `#${string}`;
  piece: Block[];
}

export const tools: Tool[] = [
  {
    name: "Directions",
    skills: ["design-inspiration", "impeccable"],
    description:
      "References become principles, principles become two or three directions you choose from on a decision page.",
    here: "Three worlds were dealt for this page, and the box of blocks was picked.",
    piece: toolBlocks.directions,
  },
  {
    name: "Design system",
    skills: ["design-system", "Storybook"],
    description:
      "Tokens, variants and components in packages/ui, each with a story that runs as an accessibility test, and presets you can swap live.",
    here: "The palette, the three display faces and every piece in the tray at the top.",
    href: "#tray",
    piece: toolBlocks.system,
  },
  {
    name: "Figma",
    skills: ["figma-sync", "figma-prototype", "Code Connect"],
    description:
      "Variables, components and clickable prototypes pushed from code; frames read back into code built from your components.",
    here: "The library shown below, resynced from this page's theme.",
    href: "#figma",
    piece: toolBlocks.figma,
  },
  {
    name: "Assets",
    skills: ["asset-production", "Magnific"],
    description:
      "Stock, images, 3D models, background removal, icons and upscales, quoted before any credit is spent, each file with its provenance.",
    here: "The maple grain on every block: four variants for 260 credits.",
    href: "#generate",
    piece: toolBlocks.assets,
  },
  {
    name: "Motion and 3D",
    skills: ["scroll-storytelling", "scene-3d", "GSAP"],
    description:
      "Scroll scenes from one primitive and three.js stages that fall back to vector drawings.",
    here: "The blocks at the top and the renegades further down.",
    href: "#renegades",
    piece: toolBlocks.motion,
  },
  {
    name: "Copy and conversion",
    skills: ["landing-page", "copywriting", "cro"],
    description: "Message hierarchy, section plan and storyboard, approved before any page code.",
    here: "The order of this page and every line on it.",
    piece: toolBlocks.copy,
  },
  {
    name: "Review and QA",
    skills: ["design-reviewer", "browser audit", "Lighthouse"],
    description:
      "A reviewer agent reads every viewport; the browser audit checks tokens, contrast, padding and overlaps.",
    here: "Every viewport of this page, by day and by night.",
    piece: toolBlocks.review,
  },
  {
    name: "Decisions",
    skills: ["adr"],
    description:
      "Every technical choice is a record with its alternatives. Agents propose, a person accepts.",
    here: `${facts.decisions} records, from the stack to the logos in the hero.`,
    href: "#counts",
    piece: toolBlocks.decisions,
  },
];
