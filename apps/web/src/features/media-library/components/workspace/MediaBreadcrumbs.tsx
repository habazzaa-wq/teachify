"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

interface BreadcrumbItem {
  id: number | "root";
  name: string;
}

interface MediaBreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (id: number | "root" | null) => void;
  className?: string;
}

function MediaBreadcrumbsBase({ items, onNavigate, className }: MediaBreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center gap-0.5 overflow-x-auto text-sm scrollbar-none", className)} aria-label="مسار المجلدات">
      <button
        onClick={() => onNavigate("root")}
        className="shrink-0 rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        المكتبة
      </button>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <motion.span
            key={item.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15, delay: i * 0.05 }}
            className="flex shrink-0 items-center gap-0.5"
          >
            <ChevronLeft className="h-3 w-3 text-muted-foreground/40" />
            <button
              onClick={() => !isLast && onNavigate(item.id)}
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 transition-colors",
                isLast
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              aria-current={isLast ? "page" : undefined}
            >
              {item.name}
            </button>
          </motion.span>
        );
      })}
    </nav>
  );
}

export const MediaBreadcrumbs = memo(MediaBreadcrumbsBase);
