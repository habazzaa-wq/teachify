"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { AppBreadcrumb, type AppBreadcrumbItem } from "./AppBreadcrumb";

interface AppPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: AppBreadcrumbItem[];
  className?: string;
  as?: "h1" | "h2" | "h3";
}

function AppPageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
  as: Heading = "h1",
}: AppPageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <AppBreadcrumb items={breadcrumb} className="mb-3" />
      )}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <Heading className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </Heading>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="mt-4 flex shrink-0 items-center gap-2 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export { AppPageHeader, type AppPageHeaderProps };
