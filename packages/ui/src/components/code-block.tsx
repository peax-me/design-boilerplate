import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";

interface CodeBlockProps extends HTMLAttributes<HTMLElement> {
  title?: string;
}

export function CodeBlock({ title, children, className, ...props }: CodeBlockProps) {
  return (
    <figure
      data-slot="code-block"
      aria-label={title}
      className={cn(
        "flex flex-col overflow-clip rounded-xl border border-border bg-surface text-foreground shadow-sm",
        className,
      )}
      {...props}
    >
      {title === undefined ? null : (
        <figcaption className="border-b border-border px-5 py-3 font-mono text-xs text-muted-foreground">
          {title}
        </figcaption>
      )}
      <section
        aria-label={title ?? "Code sample"}
        tabIndex={0}
        className="overflow-x-auto p-5 focus-visible:outline-offset-0"
      >
        <pre>
          <code className="flex flex-col font-mono text-sm">{children}</code>
        </pre>
      </section>
    </figure>
  );
}
