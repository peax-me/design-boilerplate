import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.ts";

const sectionVariants = cva("text-foreground", {
  variants: {
    spacing: {
      xs: "py-4",
      sm: "py-12 md:py-16",
      md: "py-16 md:py-24",
      lg: "py-24 md:py-32",
      xl: "py-32 md:py-48",
    },
    tone: {
      default: "",
      muted: "bg-muted",
      sheet: "bg-background surface-sheet",
    },
    scheme: {
      inherit: "",
      light: "bg-background table-grid scheme-light",
      dark: "bg-background table-grid scheme-dark",
    },
  },
  defaultVariants: { spacing: "md", tone: "default", scheme: "inherit" },
});

type SectionElement = "section" | "header" | "footer" | "aside";
type SectionVariants = VariantProps<typeof sectionVariants>;

/* The colour scheme a section shows, whatever the page's: islands set it, the paper sheet is always light. */
function shownScheme({ scheme, tone }: SectionVariants): "light" | "dark" | undefined {
  if (scheme === "light" || scheme === "dark") {
    return scheme;
  }
  return tone === "sheet" ? "light" : undefined;
}

interface SectionProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {
  as?: SectionElement;
}

export function Section({
  as: Element = "section",
  spacing,
  tone,
  scheme,
  className,
  ...props
}: SectionProps) {
  return (
    <Element
      data-slot="section"
      data-scheme={shownScheme({ scheme, tone })}
      className={cn(sectionVariants({ spacing, tone, scheme }), className)}
      {...props}
    />
  );
}
