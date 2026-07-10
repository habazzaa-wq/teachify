"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface AppSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  as?: "section" | "div";
}

function AppSection({
  children,
  title,
  description,
  actions,
  className,
  contentClassName,
  as: Tag = "section",
}: AppSectionProps) {
  return (
    <Tag className={cn("mb-8", className)}>
      {(title || description || actions) && (
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h2 className="section-title-accent text-lg font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </Tag>
  );
}

export { AppSection, type AppSectionProps };
