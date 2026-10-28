import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";
import { gapScale } from "../lib/gap.ts";

const gridVariants = cva("grid", {
  variants: {
    gap: gapScale,
    columns: {
      "1": "grid-cols-1",
      "2": "grid-cols-1",
      "3": "grid-cols-1",
      "4": "grid-cols-1",
    },
    from: {
      md: "",
      lg: "",
    },
    align: {
      start: "items-start",
      center: "items-center",
      stretch: "items-stretch",
    },
  },
  compoundVariants: [
    { columns: "2", from: "md", className: "md:grid-cols-2" },
    { columns: "2", from: "lg", className: "lg:grid-cols-2" },
    { columns: "3", from: "md", className: "md:grid-cols-2 lg:grid-cols-3" },
    { columns: "3", from: "lg", className: "lg:grid-cols-3" },
    { columns: "4", from: "md", className: "sm:grid-cols-2 lg:grid-cols-4" },
    { columns: "4", from: "lg", className: "lg:grid-cols-4" },
  ],
  defaultVariants: { gap: "lg", columns: "3", from: "md", align: "stretch" },
});

type GridElement = "div" | "section" | "ul" | "ol" | "dl";

interface GridProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof gridVariants> {
  as?: GridElement;
}

export function Grid({
  as: Element = "div",
  gap,
  columns,
  from,
  align,
  className,
  ...props
}: GridProps) {
  return (
    <Element
      data-slot="grid"
      className={cn(gridVariants({ gap, columns, from, align }), className)}
      {...props}
    />
  );
}
