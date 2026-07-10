"use client";

import { cn } from "@/lib/cn";

export interface StudioWorkspaceFooterProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "glass";
}

export function StudioWorkspaceFooter({
  className,
  variant = "default",
  children,
  ...props
}: StudioWorkspaceFooterProps) {
  return (
    <footer
      className={cn(
        "flex h-12 items-center justify-between px-4 text-xs text-studio-fg-muted",
        variant === "default" && "border-t border-studio-border bg-studio-surface",
        variant === "glass" && "studio-glass-toolbar",
        className,
      )}
      {...props}
    >
      {children}
    </footer>
  );
}
