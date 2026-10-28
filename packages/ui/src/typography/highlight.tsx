import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";

export function Highlight({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <em data-slot="highlight" className={cn("text-accent not-italic", className)} {...props} />
  );
}
