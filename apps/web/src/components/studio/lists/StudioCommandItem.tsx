"use client";

import { cn } from "@/lib/cn";

export interface StudioCommandItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  selected?: boolean;
  disabled?: boolean;
}

export function StudioCommandItem({
  className,
  label,
  description,
  icon,
  shortcut,
  selected,
  disabled,
  ...props
}: StudioCommandItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring",
        selected
          ? "bg-studio-accent-soft text-studio-accent"
          : "text-studio-fg hover:bg-studio-soft",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="flex-1 text-right">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-xs text-studio-fg-muted">{description}</div>
        )}
      </div>
      {shortcut && (
        <kbd className="shrink-0 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
