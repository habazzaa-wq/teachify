"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

export interface StudioSegmentedControlProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function StudioSegmentedControl({
  options,
  value,
  onChange,
  className,
}: StudioSegmentedControlProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg bg-studio-soft p-1 gap-0",
        className,
      )}
      role="radiogroup"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange?.(opt.value)}
          className={cn(
            "relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring",
            value === opt.value
              ? "text-studio-fg"
              : "text-studio-fg-muted hover:text-studio-fg",
          )}
        >
          {value === opt.value && (
            <motion.div
              layoutId="segmented-bg"
              className="absolute inset-0 rounded-md bg-studio-surface shadow-sm"
              transition={{ duration: 0.2 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
