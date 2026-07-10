"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface StudioTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const StudioTextarea = forwardRef<HTMLTextAreaElement, StudioTextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-studio-fg">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border bg-studio-surface px-3 py-2 text-sm text-studio-fg",
            "placeholder:text-studio-fg-subtle",
            "transition-all duration-150 resize-y",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error
              ? "border-studio-danger focus-visible:ring-studio-danger"
              : "border-studio-border hover:border-studio-accent-border",
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p role="alert" className="text-xs text-studio-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
StudioTextarea.displayName = "StudioTextarea";

export { StudioTextarea };
