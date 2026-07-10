"use client";

import { cn } from "@/lib/cn";

interface StudioGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "toolbar" | "sidebar" | "dialog" | "floating";
  padding?: "none" | "sm" | "md" | "lg";
}

const glassStyles = {
  default: "studio-glass",
  toolbar: "studio-glass-toolbar",
  sidebar: "studio-glass-sidebar",
  dialog: "studio-glass-dialog",
  floating: "studio-glass-floating",
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export function StudioGlassCard({
  className,
  variant = "default",
  padding = "md",
  children,
  ...props
}: StudioGlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        glassStyles[variant],
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
