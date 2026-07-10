"use client";

import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

interface ExamLoadingGridProps {
  count?: number;
  viewMode?: "grid" | "list";
}

export function ExamLoadingGrid({ count = 8, viewMode = "grid" }: ExamLoadingGridProps) {
  const gridClass =
    viewMode === "list"
      ? "grid grid-cols-1 gap-3"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={cn(gridClass)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface"
        >
          <div className="flex items-center justify-between gap-2 border-b border-studio-border bg-studio-soft/50 px-4 py-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center justify-between border-t border-studio-border/60 pt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ExamLoadingGrid;
