"use client";

import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { AppPagination } from "@/components/ui/AppPagination";
import { useUiStore } from "@/stores/ui.store";
import { formatNumber } from "@/lib/format";
import type { CatalogCourse } from "../types";
import { PRIMARY } from "../constants";
import { CatalogCourseCard } from "./CatalogCourseCard";

interface CatalogCourseGridProps {
  courses?: CatalogCourse[];
  isLoading: boolean;
  total: number;
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

function SkeletonCard() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  return (
    <div
      className="overflow-hidden rounded-3xl"
      style={{
        background: isDark ? "#16141e" : "#fff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
      }}
    >
      <div className="aspect-video w-full animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
      <div className="space-y-3 p-5">
        <div className="h-3 w-2/5 animate-pulse rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
        <div className="h-5 w-full animate-pulse rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
        <div className="h-3 w-3/4 animate-pulse rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
        <div className="h-9 w-full animate-pulse rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
      </div>
    </div>
  );
}

export function CatalogCourseGrid({
  courses,
  isLoading,
  total,
  currentPage,
  lastPage,
  onPageChange,
}: CatalogCourseGridProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  if (isLoading && !courses?.length) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!isLoading && courses && courses.length === 0) {
    return (
      <AppEmptyState
        icon={SearchX}
        title="لا توجد دورات مطابقة"
        description="جرّب تعديل الفلاتر أو البحث بكلمات أخرى للعثور على دورات."
        action={
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:opacity-90"
            style={{ background: `linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))` }}
          >
            <Home className="h-4 w-4" />
            عرض كل الدورات
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* results header */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
            <span className="font-extrabold" style={{ color: PRIMARY }}>
              {formatNumber(total)}
            </span>{" "}
            دورة متاحة
          </p>
          <p className="text-xs" style={{ color: isDark ? "#8a8290" : "#9CA3AF" }}>
            الصفحة {formatNumber(currentPage)} من {formatNumber(Math.max(lastPage, 1))}
          </p>
        </div>
      )}

      {/* grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {(courses ?? []).map((course, i) => (
          <CatalogCourseCard key={course.id} course={course} index={i} />
        ))}
      </div>

      {lastPage > 1 && (
        <AppPagination
          currentPage={currentPage}
          lastPage={lastPage}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
