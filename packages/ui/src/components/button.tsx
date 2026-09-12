import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

export const buttonVariants = cva(
  "inline-flex h-12 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md px-6 text-label-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-sm hover:bg-primary-hover",
        secondary:
          "border border-border bg-surface text-text-primary shadow-sm hover:border-primary hover:bg-muted",
        ghost: "bg-transparent text-primary hover:bg-primary-light",
        danger: "bg-error text-white shadow-sm hover:bg-red-600",
      },
      size: {
        default: "h-12 px-6",
        compact: "h-11 px-4",
        icon: "size-12 p-0",
        fab: "size-14 rounded-full p-0 shadow-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
