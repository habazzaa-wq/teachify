"use client";

import { ChevronEndIcon, ChevronStartIcon } from "./icons";
import { AppButton } from "./AppButton";
import { cn } from "@/lib/cn";

interface AppPaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Simple RTL-aware pager (prev / page indicator / next). In RTL, "previous"
 * advances visually to the left and uses the start chevron, "next" to the
 * right uses the end chevron.
 */
function AppPagination({
  currentPage,
  lastPage,
  total,
  onPageChange,
  className,
}: AppPaginationProps) {
  const canPrev = currentPage > 1;
  const canNext = currentPage < lastPage;

  if (total === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 text-sm text-muted-foreground",
        className,
      )}
      dir="rtl"
    >
      <AppButton
        variant="outline"
        size="sm"
        disabled={!canPrev}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronStartIcon className="h-4 w-4" />
        السابق
      </AppButton>

      <span>
        صفحة {currentPage} من {Math.max(lastPage, 1)} • {total} نتيجة
      </span>

      <AppButton
        variant="outline"
        size="sm"
        disabled={!canNext}
        onClick={() => onPageChange(currentPage + 1)}
      >
        التالي
        <ChevronEndIcon className="h-4 w-4" />
      </AppButton>
    </div>
  );
}

export { AppPagination };
