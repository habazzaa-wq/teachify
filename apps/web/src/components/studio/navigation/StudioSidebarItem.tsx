"use client";

import { cn } from "@/lib/cn";

export interface StudioSidebarItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  label: string;
  badge?: string | number;
  collapsed?: boolean;
}

export function StudioSidebarItem({
  className,
  active,
  icon,
  label,
  badge,
  collapsed,
  ...props
}: StudioSidebarItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring",
        active
          ? "bg-studio-accent-soft text-studio-accent"
          : "text-studio-fg-muted hover:text-studio-accent hover:bg-studio-secondary-soft active:scale-[0.98] active:bg-studio-secondary-soft/80",
        collapsed && "justify-center px-2",
        className,
      )}
      {...props}
      onClick={(e) => {
        if (props.onClick) {
          props.onClick(e);
        }
      }}
    >
      {active && (
        <>
          <span
            className="absolute inset-y-1.5 start-1 w-1 rounded-full bg-studio-accent z-20 pointer-events-none"
          />
          <div
            className="absolute inset-0 rounded-lg bg-studio-accent-soft z-0 pointer-events-none"
          />
        </>
      )}
      {icon && (
        <span className="relative z-10 shrink-0 pointer-events-none">{icon}</span>
      )}
      {!collapsed && (
        <>
          <span className="relative z-10 flex-1 text-right pointer-events-none">{label}</span>
          {badge !== undefined && (
            <span className="relative z-10 rounded-full bg-studio-accent-soft px-2 py-0.5 text-[10px] font-semibold text-studio-accent pointer-events-none">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}
