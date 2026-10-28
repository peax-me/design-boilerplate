import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ variant, className, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
