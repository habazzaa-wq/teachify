"use client";

import { cn } from "@/lib/cn";
import { Command } from "lucide-react";

export interface StudioCommandBarProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder?: string;
  shortcut?: string;
}

export function StudioCommandBar({
  className,
  placeholder = "اكتب أمر أو ابحث...",
  shortcut = "⌘K",
  ...props
}: StudioCommandBarProps) {
  return (
    <div
      className={cn(
        "flex h-12 items-center gap-3 rounded-xl border border-studio-border bg-studio-surface px-4 shadow-sm",
        "transition-all duration-150 hover:border-studio-accent-border",
        "focus-within:border-studio-accent focus-within:ring-2 focus-within:ring-studio-ring/20",
        className,
      )}
      {...props}
    >
      <Command className="h-4 w-4 text-studio-fg-muted" />
      <span className="flex-1 text-sm text-studio-fg-subtle">{placeholder}</span>
      <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] font-medium text-studio-fg-muted">
        {shortcut}
      </kbd>
    </div>
  );
}
