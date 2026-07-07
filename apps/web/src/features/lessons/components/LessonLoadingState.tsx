"use client";

import { Skeleton } from "@/components/ui";

function LessonLoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export { LessonLoadingState };
