"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "../lib/cn.ts";

interface TextLinkProps extends useRender.ComponentProps<"a"> {
  className?: string;
}

export function TextLink({ render, className, ...props }: TextLinkProps) {
  const ownProps = {
    "data-slot": "text-link",
    className: cn(
      "font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground",
      className,
    ),
  };
  return useRender({ defaultTagName: "a", render, props: mergeProps<"a">(ownProps, props) });
}
