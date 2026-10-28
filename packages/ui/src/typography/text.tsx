import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";

const textVariants = cva("", {
  variants: {
    size: {
      lg: "text-lg",
      md: "text-md",
      sm: "text-sm",
      xs: "text-xs",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      accent: "text-accent",
      destructive: "text-destructive",
    },
    weight: {
      regular: "font-regular",
      medium: "font-medium",
      semibold: "font-semibold",
    },
    align: {
      start: "text-start",
      center: "text-center",
      end: "text-end",
    },
    measure: {
      full: "",
      prose: "max-w-prose",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
    weight: "regular",
    align: "start",
    measure: "full",
  },
});

type TextElement =
  | "p"
  | "span"
  | "div"
  | "li"
  | "strong"
  | "em"
  | "small"
  | "figcaption"
  | "blockquote";

interface TextProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  as?: TextElement;
}

export function Text({
  as: Element = "p",
  size,
  tone,
  weight,
  align,
  measure,
  className,
  ...props
}: TextProps) {
  return (
    <Element
      data-slot="text"
      className={cn(textVariants({ size, tone, weight, align, measure }), className)}
      {...props}
    />
  );
}
