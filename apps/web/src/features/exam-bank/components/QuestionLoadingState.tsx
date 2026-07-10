"use client";

import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

interface QuestionLoadingGridProps {
  count?: number;
  viewMode?: "grid" | "list";
  className?: string;
}

export function QuestionLoadingGrid({
  count = 12,
  viewMode = "grid",
  className,
}: QuestionLoadingGridProps) {
  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "flex flex-col gap-3",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface p-4"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="mt-3">
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { QuestionLoadingGrid as QuestionLoadingState };
