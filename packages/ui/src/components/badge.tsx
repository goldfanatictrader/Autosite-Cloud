import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

export const badgeVariants = cva(
  "inline-flex min-h-6 items-center rounded-sm px-2 py-1 text-label-sm font-medium leading-label-sm",
  {
    variants: {
      variant: {
        default: "bg-primary-light text-blue-800 dark:text-blue-200",
        secondary: "bg-secondary-light text-violet-800 dark:text-violet-200",
        draft: "bg-draft/10 text-draft",
        building: "bg-warning/10 text-warning",
        live: "bg-success/10 text-success",
        error: "bg-error/10 text-error",
        success: "bg-success text-white",
        warning: "bg-warning text-gray-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
