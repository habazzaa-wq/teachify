"use client";

import { cn } from "@/lib/cn";

interface StudioActionSurfaceProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  description?: string;
}

export function StudioActionSurface({
  className,
  children,
  icon,
  description,
  ...props
}: StudioActionSurfaceProps) {
  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-4 rounded-xl border border-studio-border bg-studio-surface p-4 text-right",
        "transition-all duration-150 hover:border-studio-accent-border hover:bg-studio-soft/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="rounded-lg bg-studio-soft p-2.5 text-studio-fg-muted group-hover:text-studio-accent transition-colors duration-150">
          {icon}
        </div>
      )}
      <div className="flex-1 text-right">
        <div className="text-sm font-medium text-studio-fg">{children}</div>
        {description && (
          <p className="text-xs text-studio-fg-muted mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );
}
