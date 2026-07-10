"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StudioBreadcrumbItem {
  label: string;
  href?: string;
}

export interface StudioBreadcrumbProps {
  items: StudioBreadcrumbItem[];
  className?: string;
}

export function StudioBreadcrumb({ items, className }: StudioBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronLeft className="h-3.5 w-3.5 text-studio-fg-subtle" />
          )}
          {item.href ? (
            <a
              href={item.href}
              className="text-xs text-studio-fg-muted hover:text-studio-fg transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-xs text-studio-fg font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
