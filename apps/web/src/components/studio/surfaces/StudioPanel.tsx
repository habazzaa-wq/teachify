"use client";

import { cn } from "@/lib/cn";

interface StudioPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "glass";
}

export function StudioPanel({
  className,
  header,
  footer,
  variant = "default",
  children,
  ...props
}: StudioPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl overflow-hidden",
        variant === "default" && "border border-studio-border bg-studio-surface",
        variant === "glass" && "studio-glass",
        className,
      )}
      {...props}
    >
      {header && (
        <div className="border-b border-studio-border px-4 py-3">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">{children}</div>
      {footer && (
        <div className="border-t border-studio-border px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
