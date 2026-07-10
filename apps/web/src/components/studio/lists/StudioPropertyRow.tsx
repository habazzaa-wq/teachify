"use client";

import { cn } from "@/lib/cn";

export interface StudioPropertyRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  inline?: boolean;
}

export function StudioPropertyRow({
  className,
  label,
  value,
  inline = true,
  ...props
}: StudioPropertyRowProps) {
  if (inline) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 py-2",
          className,
        )}
        {...props}
      >
        <span className="text-xs text-studio-fg-muted font-medium">{label}</span>
        <span className="text-sm text-studio-fg">{value}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1 py-2", className)} {...props}>
      <span className="text-xs text-studio-fg-muted font-medium">{label}</span>
      <div className="text-sm text-studio-fg">{value}</div>
    </div>
  );
}
