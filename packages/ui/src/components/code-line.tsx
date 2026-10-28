import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";

const codeLineVariants = cva("whitespace-pre", {
  variants: {
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      accent: "text-accent",
      destructive: "text-destructive",
    },
  },
  defaultVariants: { tone: "default" },
});

interface CodeLineProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof codeLineVariants> {}

export function CodeLine({ tone, className, ...props }: CodeLineProps) {
  return (
    <span data-slot="code-line" className={cn(codeLineVariants({ tone }), className)} {...props} />
  );
}
