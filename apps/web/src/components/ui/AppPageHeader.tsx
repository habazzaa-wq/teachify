"use client";

import * as React from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("mb-8", className)}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <AppBreadcrumb items={breadcrumb} className="mb-3" />
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="section-title-accent">
            <Heading className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </Heading>
          </div>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export { AppPageHeader, type AppPageHeaderProps };
