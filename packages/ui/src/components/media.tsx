import type { HTMLAttributes, ReactElement, ReactNode } from "react";

import { cn } from "../lib/cn.ts";

interface MediaProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  image: ReactElement;
  caption?: ReactNode;
}

export function Media({ image, caption, className, ...props }: MediaProps) {
  return (
    <figure data-slot="media" className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="overflow-clip rounded-xl border border-border bg-surface shadow-md [&_img]:block [&_img]:h-auto [&_img]:w-full">
        {image}
      </div>
      {caption === undefined ? null : (
        <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}
