"use client";

import { cn } from "@/lib/cn";

export interface StudioInspectorRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  editable?: boolean;
  icon?: React.ReactNode;
}

export function StudioInspectorRow({
  className,
  label,
  value,
  editable,
  icon,
  ...props
}: StudioInspectorRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        editable && "hover:bg-studio-soft cursor-pointer",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="shrink-0 text-studio-fg-muted">{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-studio-fg-muted uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-studio-fg mt-0.5 truncate">{value}</p>
      </div>
      {editable && (
        <span className="shrink-0 text-[10px] text-studio-accent opacity-0 group-hover:opacity-100 transition-opacity">
          تعديل
        </span>
      )}
    </div>
  );
}
