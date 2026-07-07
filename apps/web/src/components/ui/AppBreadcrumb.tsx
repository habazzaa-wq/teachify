"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface AppBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

function AppBreadcrumb({ items, className }: AppBreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center gap-1.5">
              {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              )}
            </div>
            {!isLast && (
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/40 rtl:rotate-180" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

type AppBreadcrumbItem = BreadcrumbItem;

export { AppBreadcrumb, type AppBreadcrumbItem, type AppBreadcrumbProps };
