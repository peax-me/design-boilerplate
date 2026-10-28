import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn.ts";

interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: ReactNode;
  label: ReactNode;
}

export function Stat({ value, label, className, ...props }: StatProps) {
  return (
    <div
      data-slot="stat"
      className={cn("flex flex-col-reverse justify-end gap-2", className)}
      {...props}
    >
      <dt className="text-md text-muted-foreground">{label}</dt>
      <dd className="text-5xl font-semibold text-foreground">{value}</dd>
    </div>
  );
}
