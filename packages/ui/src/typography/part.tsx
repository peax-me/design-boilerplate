import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn.ts";

interface PartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  count: number;
  label: ReactNode;
  piece: ReactNode;
}

export function Part({ count, label, piece, className, ...props }: PartProps) {
  return (
    <div data-slot="part" className={cn("flex flex-col-reverse gap-2", className)} {...props}>
      <dt className="text-md text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-3">
        <span aria-hidden className="w-12 shrink-0">
          {piece}
        </span>
        <span className="font-display text-4xl font-semibold text-foreground tabular-nums">
          <span aria-hidden>×</span>
          {count}
        </span>
      </dd>
    </div>
  );
}
