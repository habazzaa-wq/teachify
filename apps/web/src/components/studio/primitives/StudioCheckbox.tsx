"use client";

import { forwardRef, useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StudioCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const StudioCheckbox = forwardRef<HTMLInputElement, StudioCheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center">
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                "h-5 w-5 rounded-md border-2 transition-all duration-150",
                "group-hover:border-studio-accent-border",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-studio-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-studio-bg",
                "peer-checked:bg-studio-accent peer-checked:border-studio-accent",
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
                error ? "border-studio-danger" : "border-studio-border",
                className,
              )}
            >
              <Check className="h-full w-full p-0.5 text-studio-accent-fg opacity-0 peer-checked:opacity-100 transition-opacity duration-150" />
            </div>
          </div>
          {label && (
            <span className="text-sm text-studio-fg select-none">{label}</span>
          )}
        </label>
        {error && (
          <p role="alert" className="text-xs text-studio-danger mr-8">
            {error}
          </p>
        )}
      </div>
    );
  },
);
StudioCheckbox.displayName = "StudioCheckbox";

export { StudioCheckbox };
