"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("studio-skeleton-shimmer rounded-lg", className)}
      aria-hidden="true"
    />
  );
}

function CourseStudioLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col"
      aria-label="جاري تحميل الاستوديو"
      role="status"
    >
      <div className="flex shrink-0 items-center gap-4 border-b border-studio-border px-6 py-4">
        <SkeletonBlock className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-72 shrink-0 border-l border-studio-border p-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-3/4" />
            <SkeletonBlock className="h-3 w-5/6" />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <SkeletonBlock className="h-32 w-32 rounded-[2rem]" />
            <SkeletonBlock className="mx-auto h-6 w-56" />
            <SkeletonBlock className="mx-auto h-4 w-72" />
            <SkeletonBlock className="mx-auto h-10 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { CourseStudioLoading };
