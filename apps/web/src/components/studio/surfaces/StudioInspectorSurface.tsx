"use client";

import { cn } from "@/lib/cn";

interface StudioInspectorSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function StudioInspectorSurface({
  className,
  title,
  children,
  ...props
}: StudioInspectorSurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-studio-border bg-studio-surface",
        className,
      )}
      {...props}
    >
      {title && (
        <div className="border-b border-studio-border px-4 py-3">
          <h3 className="text-sm font-semibold text-studio-fg">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
