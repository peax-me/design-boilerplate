import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      container: ["prose", "narrow", "default", "wide"],
      ease: ["standard", "emphasized"],
      font: ["sans", "mono", "display"],
      "font-weight": ["regular", "medium", "semibold"],
      shadow: ["plank"],
      tracking: ["normal", "wide"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
