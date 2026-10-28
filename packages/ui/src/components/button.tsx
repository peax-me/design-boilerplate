import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn.ts";

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition select-none data-disabled:cursor-not-allowed data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-plank hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        accent: "bg-accent text-accent-foreground hover:bg-accent/85",
        outline: "border-2 border-foreground/70 bg-transparent text-foreground hover:bg-muted",
        ghost: "bg-transparent text-foreground hover:bg-muted",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-md",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

interface ButtonProps extends BaseButton.Props, VariantProps<typeof buttonVariants> {
  className?: string;
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <BaseButton
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
