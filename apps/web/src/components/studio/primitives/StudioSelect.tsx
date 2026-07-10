"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StudioSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const StudioSelect = forwardRef<HTMLSelectElement, StudioSelectProps>(
  ({ className, error, label, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-studio-fg">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
               "flex h-10 w-full appearance-none rounded-lg border bg-studio-surface px-3 py-2 text-sm text-studio-fg",
              "transition-all duration-150",
               "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg pe-10",
              "disabled:cursor-not-allowed disabled:opacity-40",
              error
                ? "border-studio-danger focus-visible:ring-studio-danger"
                : "border-studio-border hover:border-studio-accent-border",
              className,
            )}
            aria-invalid={!!error}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-studio-fg-muted" />
        </div>
        {error && (
          <p role="alert" className="text-xs text-studio-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
StudioSelect.displayName = "StudioSelect";

export { StudioSelect };
