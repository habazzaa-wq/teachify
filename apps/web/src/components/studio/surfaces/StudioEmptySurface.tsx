"use client";

import { cn } from "@/lib/cn";

interface StudioEmptySurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  message?: string;
  action?: React.ReactNode;
}

export function StudioEmptySurface({
  className,
  icon,
  message = "لا توجد عناصر",
  action,
  ...props
}: StudioEmptySurfaceProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-studio-border bg-studio-muted/30 p-12 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 text-studio-fg-subtle">{icon}</div>
      )}
      <p className="text-sm text-studio-fg-muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
