"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface StudioInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

const StudioInput = forwardRef<HTMLInputElement, StudioInputProps>(
  ({ className, error, label, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-studio-fg"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-studio-surface px-3 py-2 text-sm text-studio-fg",
            "placeholder:text-studio-fg-subtle",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg",
            "disabled:cursor-not-allowed disabled:opacity-40",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            error
              ? "border-studio-danger focus-visible:ring-studio-danger"
              : "border-studio-border hover:border-studio-accent-border",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-studio-danger">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-studio-fg-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
StudioInput.displayName = "StudioInput";

export { StudioInput };
