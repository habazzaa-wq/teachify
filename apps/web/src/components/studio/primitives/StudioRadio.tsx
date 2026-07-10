"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export interface StudioRadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export interface StudioRadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  error?: string;
  label?: string;
  className?: string;
}

const StudioRadio = forwardRef<HTMLInputElement, StudioRadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <label
        htmlFor={inputId}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="radio"
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 rounded-full border-2 transition-all duration-150",
              "group-hover:border-studio-accent-border",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-studio-ring peer-focus-visible:ring-offset-2",
              "peer-checked:border-studio-accent peer-checked:bg-studio-accent",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
              "border-studio-border",
              className,
            )}
          >
            <div className="h-full w-full rounded-full bg-studio-accent-fg scale-0 peer-checked:scale-50 transition-transform duration-150" />
          </div>
        </div>
        {label && (
          <span className="text-sm text-studio-fg select-none">{label}</span>
        )}
      </label>
    );
  },
);
StudioRadio.displayName = "StudioRadio";

const StudioRadioGroup = forwardRef<HTMLDivElement, StudioRadioGroupProps>(
  ({ name, value, onChange, options, error, label, className }, ref) => {
    return (
      <div className="flex flex-col gap-1.5" ref={ref}>
        {label && (
          <span className="text-sm font-medium text-studio-fg">{label}</span>
        )}
        <div className={cn("flex flex-col gap-2", className)} role="radiogroup" aria-label={label}>
          {options.map((opt) => (
            <StudioRadio
              key={opt.value}
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange?.(opt.value)}
              label={opt.label}
              disabled={opt.disabled}
            />
          ))}
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
StudioRadioGroup.displayName = "StudioRadioGroup";

export { StudioRadio, StudioRadioGroup };
