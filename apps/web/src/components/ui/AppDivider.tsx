import * as React from "react";
import { cn } from "@/lib/cn";

interface AppDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: string;
}

function AppDivider({ className, orientation = "horizontal", label, ...props }: AppDividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        className={cn("mx-2 h-full w-px bg-border", className)}
        role="separator"
        aria-orientation="vertical"
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)} role="separator" {...props}>
        <div className="flex-1 border-t" />
        <span className="text-[11px] font-medium text-muted-foreground/60 whitespace-nowrap">{label}</span>
        <div className="flex-1 border-t" />
      </div>
    );
  }

  return (
    <div
      className={cn("my-4 h-px w-full bg-border/60", className)}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    />
  );
}

export { AppDivider, type AppDividerProps };
