import { Separator as BaseSeparator } from "@base-ui/react/separator";

import { cn } from "../lib/cn.ts";

interface SeparatorProps extends BaseSeparator.Props {
  className?: string;
}

export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <BaseSeparator
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
