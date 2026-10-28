import { cva, type VariantProps } from "class-variance-authority";
import type { SVGAttributes } from "react";
import type { SimpleIcon } from "simple-icons";

import { cn } from "../lib/cn.ts";

const brandMarkVariants = cva("shrink-0 fill-current", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
    },
  },
  defaultVariants: { size: "sm" },
});

interface BrandMarkProps
  extends Omit<SVGAttributes<SVGSVGElement>, "children">, VariantProps<typeof brandMarkVariants> {
  icon: SimpleIcon;
}

export function BrandMark({ icon, size, className, ...props }: BrandMarkProps) {
  return (
    <svg
      data-slot="brand-mark"
      viewBox="0 0 24 24"
      aria-hidden
      className={cn(brandMarkVariants({ size }), className)}
      {...props}
    >
      <path d={icon.path} />
    </svg>
  );
}
