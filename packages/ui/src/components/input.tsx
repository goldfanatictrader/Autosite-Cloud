import * as React from "react";

import { cn } from "../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={ariaInvalid ?? invalid}
      className={cn(
        "flex h-12 w-full rounded-md border border-border bg-surface px-4 text-body-lg leading-body-lg text-text-primary outline-none transition placeholder:text-placeholder focus:border-primary focus:ring-3 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-error focus:border-error focus:ring-error/10",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
