"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export interface StudioSwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const StudioSwitch = forwardRef<HTMLButtonElement, StudioSwitchProps>(
  ({ checked, onCheckedChange, label, disabled, className }, ref) => {
    const generatedId = useId();

    return (
      <label
        htmlFor={generatedId}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <button
          ref={ref}
          id={generatedId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange?.(!checked)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg",
            checked
              ? "bg-studio-accent"
              : "bg-studio-soft border border-studio-border",
            disabled && "cursor-not-allowed opacity-40",
            className,
          )}
        >
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm ring-0 transition-all duration-200",
              checked ? "end-0.5" : "start-0.5",
            )}
          />
        </button>
        {label && (
          <span className="text-sm text-studio-fg select-none">{label}</span>
        )}
      </label>
    );
  },
);
StudioSwitch.displayName = "StudioSwitch";

export { StudioSwitch };
