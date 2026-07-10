"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

export interface StudioTabsProps {
  tabs: { value: string; label: string; badge?: number }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  variant?: "underline" | "pills" | "segmented";
}

export function StudioTabs({
  tabs,
  value,
  onChange,
  className,
  variant = "underline",
}: StudioTabsProps) {
  if (variant === "segmented") {
    return (
      <div className={cn("inline-flex rounded-lg bg-studio-soft p-1", className)} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={value === tab.value}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              "relative rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring",
              value === tab.value
                ? "bg-studio-surface text-studio-fg shadow-sm"
                : "text-studio-fg-muted hover:text-studio-fg",
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="mr-1.5 rounded-full bg-studio-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-studio-accent">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex border-b border-studio-border gap-0", className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange?.(tab.value)}
          className={cn(
            "relative px-4 py-3 text-sm font-medium transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring",
            value === tab.value
              ? "text-studio-fg"
              : "text-studio-fg-muted hover:text-studio-fg",
          )}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className="mr-1.5 rounded-full bg-studio-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-studio-accent">
              {tab.badge}
            </span>
          )}
          {value === tab.value && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-studio-accent"
              transition={{ duration: 0.2 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
