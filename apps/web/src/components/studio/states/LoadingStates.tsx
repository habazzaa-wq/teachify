"use client";

import { cn } from "@/lib/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("studio-skeleton-shimmer rounded-lg", className)}
      aria-hidden="true"
    />
  );
}

interface LoadingBase {
  count?: number;
  className?: string;
}

export function StudioPageLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)} aria-label="جاري التحميل">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="h-4 w-72" />
      <div className="grid grid-cols-3 gap-4">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
      <SkeletonBlock className="h-64" />
    </div>
  );
}

export function StudioCardLoading({ count = 3, className }: LoadingBase) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-studio-border bg-studio-surface p-5 space-y-3">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonBlock className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

export function StudioTableLoading({ count = 5, className }: LoadingBase) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-4 p-3">
        <SkeletonBlock className="h-4 flex-1" />
        <SkeletonBlock className="h-4 flex-1" />
        <SkeletonBlock className="h-4 flex-1" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          <SkeletonBlock className="h-4 flex-1" />
          <SkeletonBlock className="h-4 flex-1" />
          <SkeletonBlock className="h-4 flex-1" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function StudioTreeLoading({ count = 4, className }: LoadingBase) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5">
          <SkeletonBlock className="h-3.5 w-3.5 rounded" />
          <SkeletonBlock className={cn("h-4", i % 2 === 0 ? "w-32" : "w-24")} />
        </div>
      ))}
    </div>
  );
}

export function StudioDialogLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-6", className)}>
      <SkeletonBlock className="h-6 w-48" />
      <SkeletonBlock className="h-4 w-64" />
      <SkeletonBlock className="h-10 w-full" />
      <SkeletonBlock className="h-10 w-full" />
      <SkeletonBlock className="h-24 w-full" />
      <div className="flex justify-end gap-3 pt-2">
        <SkeletonBlock className="h-10 w-20" />
        <SkeletonBlock className="h-10 w-28" />
      </div>
    </div>
  );
}

export function StudioInspectorLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      <SkeletonBlock className="h-5 w-32" />
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-8 w-full" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-8 w-full" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-20 w-full" />
      </div>
    </div>
  );
}
