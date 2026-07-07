"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface AppSidebarSectionProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
}

function AppSidebarSection({ label, children, className, collapsed }: AppSidebarSectionProps) {
  return (
    <div className={cn("mb-4", className)}>
      {label && !collapsed && (
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

export { AppSidebarSection, type AppSidebarSectionProps };
