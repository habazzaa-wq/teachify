"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Layout } from "lucide-react";
import { cn } from "@/lib/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CourseStudioBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const breadcrumbMotion = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
};

function CourseStudioBreadcrumb({ items, className }: CourseStudioBreadcrumbProps) {
  return (
    <nav
      aria-label="مسار التنقل"
      className={cn("flex items-center gap-1.5", className)}
    >
      <Layout className="h-3.5 w-3.5 text-studio-fg-subtle" aria-hidden="true" />
      {items.map((item, index) => (
        <motion.div
          key={index}
          {...breadcrumbMotion}
          transition={{ ...breadcrumbMotion.transition, delay: index * 0.05 }}
          className="flex items-center gap-1.5"
        >
          {index > 0 && (
            <ChevronLeft className="h-3 w-3 text-studio-fg-subtle" aria-hidden="true" />
          )}
          {item.href ? (
            <a
              href={item.href}
              className="text-xs text-studio-fg-muted transition-colors hover:text-studio-fg"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-xs font-medium text-studio-fg">
              {item.label}
            </span>
          )}
        </motion.div>
      ))}
    </nav>
  );
}

export { CourseStudioBreadcrumb };
