"use client";

import { cn } from "@/lib/cn";

export interface StudioSidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  collapsed?: boolean;
}

export function StudioSidebarSection({
  className,
  label,
  collapsed,
  children,
  ...props
}: StudioSidebarSectionProps) {
  return (
    <div className={cn("", className)} {...props}>
      {label && !collapsed && (
        <div className="px-3 pb-1 pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-studio-fg-subtle">
            {label}
          </span>
        </div>
      )}
      <div className="space-y-0.5 px-2">{children}</div>
    </div>
  );
}
