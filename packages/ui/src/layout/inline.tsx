import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";
import { gapScale } from "../lib/gap.ts";

const inlineVariants = cva("flex flex-row", {
  variants: {
    gap: gapScale,
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: { gap: "sm", align: "center", justify: "start", wrap: true },
});

type InlineElement = "div" | "nav" | "ul" | "ol" | "li" | "span";

interface InlineProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof inlineVariants> {
  as?: InlineElement;
}

export function Inline({
  as: Element = "div",
  gap,
  align,
  justify,
  wrap,
  className,
  ...props
}: InlineProps) {
  return (
    <Element
      data-slot="inline"
      className={cn(inlineVariants({ gap, align, justify, wrap }), className)}
      {...props}
    />
  );
}
