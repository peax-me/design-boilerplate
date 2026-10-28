import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";
import { gapScale } from "../lib/gap.ts";

const stackVariants = cva("flex flex-col", {
  variants: {
    gap: gapScale,
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    },
  },
  defaultVariants: { gap: "md", align: "stretch", justify: "start" },
});

type StackElement =
  | "div"
  | "section"
  | "article"
  | "header"
  | "footer"
  | "nav"
  | "ul"
  | "ol"
  | "li";

interface StackProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof stackVariants> {
  as?: StackElement;
}

export function Stack({
  as: Element = "div",
  gap,
  align,
  justify,
  className,
  ...props
}: StackProps) {
  return (
    <Element
      data-slot="stack"
      className={cn(stackVariants({ gap, align, justify }), className)}
      {...props}
    />
  );
}
