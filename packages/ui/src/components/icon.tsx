import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "../lib/cn.ts";

const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
  },
  defaultVariants: { size: "md" },
});

interface IconProps extends VariantProps<typeof iconVariants> {
  icon: LucideIcon;
  label?: string;
  className?: string;
}

export function Icon({ icon: Glyph, size, label, className }: IconProps) {
  return (
    <Glyph
      data-slot="icon"
      className={cn(iconVariants({ size }), className)}
      aria-hidden={label === undefined}
      aria-label={label}
      role={label === undefined ? undefined : "img"}
    />
  );
}
