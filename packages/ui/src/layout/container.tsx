import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";

const containerVariants = cva("mx-auto w-full px-5 md:px-8 lg:px-10", {
  variants: {
    size: {
      prose: "max-w-prose",
      narrow: "max-w-narrow",
      default: "max-w-default",
      wide: "max-w-wide",
    },
  },
  defaultVariants: { size: "default" },
});

type ContainerElement = "div" | "header" | "footer" | "main" | "nav";

interface ContainerProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof containerVariants> {
  as?: ContainerElement;
}

export function Container({ as: Element = "div", size, className, ...props }: ContainerProps) {
  return (
    <Element
      data-slot="container"
      className={cn(containerVariants({ size }), className)}
      {...props}
    />
  );
}
