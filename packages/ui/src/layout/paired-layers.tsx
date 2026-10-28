import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn.ts";

interface PairedItem {
  id: string;
  aside: ReactNode;
  panel: ReactNode;
}

interface PairedLayersProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  items: PairedItem[];
  as?: "ol" | "ul";
}

const panelSpan: Partial<Record<number, string>> = {
  2: "md:motion-safe:row-span-2",
  3: "md:motion-safe:row-span-3",
  4: "md:motion-safe:row-span-4",
  5: "md:motion-safe:row-span-5",
  6: "md:motion-safe:row-span-6",
};

export function PairedLayers({
  items,
  as: Element = "ol",
  className,
  ...props
}: PairedLayersProps) {
  const span = panelSpan[items.length];
  return (
    <Element
      data-slot="paired-layers"
      className={cn(
        "flex flex-col gap-12 md:motion-safe:grid md:motion-safe:grid-cols-2 md:motion-safe:items-center md:motion-safe:gap-x-20 md:motion-safe:gap-y-6",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-x-20 md:motion-safe:contents"
        >
          <div className="md:motion-safe:col-start-1">{item.aside}</div>
          <div className={cn("md:motion-safe:col-start-2 md:motion-safe:row-start-1", span)}>
            {item.panel}
          </div>
        </li>
      ))}
    </Element>
  );
}
