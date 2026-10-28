import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";

const headingVariants = cva("font-display font-semibold", {
  variants: {
    size: {
      "display-xl": "text-6xl",
      display: "text-5xl",
      "title-lg": "text-4xl",
      title: "text-3xl",
      "title-sm": "text-2xl",
      subtitle: "text-xl font-medium",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
    },
    align: {
      start: "text-start",
      center: "text-center",
      end: "text-end",
    },
  },
  defaultVariants: { tone: "default", align: "start" },
});

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingSize = NonNullable<VariantProps<typeof headingVariants>["size"]>;

const defaultSizeByLevel: Record<HeadingLevel, HeadingSize> = {
  1: "display",
  2: "title-lg",
  3: "title",
  4: "title-sm",
  5: "subtitle",
  6: "subtitle",
};

interface HeadingProps
  extends HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {
  level: HeadingLevel;
}

export function Heading({ level, size, tone, align, className, ...props }: HeadingProps) {
  const Element = `h${level}` as const;
  return (
    <Element
      data-slot="heading"
      className={cn(
        headingVariants({ size: size ?? defaultSizeByLevel[level], tone, align }),
        className,
      )}
      {...props}
    />
  );
}
