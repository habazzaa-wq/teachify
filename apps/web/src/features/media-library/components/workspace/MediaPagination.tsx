"use client";

import { memo, useMemo } from "react";
import { ChevronStartIcon, ChevronEndIcon } from "@/components/ui/icons";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/cn";

interface MediaPaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  isLoading?: boolean;
  className?: string;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZES = [12, 24, 36, 48, 96];

/**
 * Build a compact list of page numbers with ellipsis separators, e.g.
 * [1, "…", 4, 5, 6, "…", 20]. Keeps the current page centered with a
 * small window around it so huge result sets stay navigable.
 */
function buildPageItems(current: number, last: number): (number | "…")[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const items: (number | "…")[] = [1];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(last - 1, current + 1);

  if (windowStart > 2) items.push("…");
  for (let p = windowStart; p <= windowEnd; p++) items.push(p);
  if (windowEnd < last - 1) items.push("…");

  items.push(last);
  return items;
}

function MediaPaginationBase({
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  isLoading,
  className,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: MediaPaginationProps) {
  const safeLast = Math.max(1, lastPage);
  const safeCurrent = Math.min(Math.max(1, currentPage), safeLast);

  const pageItems = useMemo(() => buildPageItems(safeCurrent, safeLast), [safeCurrent, safeLast]);

  const from = total === 0 ? 0 : (safeCurrent - 1) * perPage + 1;
  const to = Math.min(safeCurrent * perPage, total);

  if (total <= 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4",
        className,
      )}
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Result range summary */}
        <p className="order-2 text-xs text-muted-foreground sm:order-1">
          عرض <span className="font-medium text-foreground">{from.toLocaleString("ar-EG")}</span> إلى{" "}
          <span className="font-medium text-foreground">{to.toLocaleString("ar-EG")}</span> من أصل{" "}
          <span className="font-medium text-foreground">{total.toLocaleString("ar-EG")}</span> ملف
        </p>

        {/* Page size selector */}
        <div className="order-1 flex items-center gap-2 sm:order-2">
          <span className="text-xs text-muted-foreground">لكل صفحة</span>
          <select
            value={perPage}
            disabled={isLoading}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="h-8 rounded-lg border bg-background px-2 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="عدد العناصر في كل صفحة"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {/* First */}
        <AppButton
          variant="outline"
          size="sm"
          className="hidden h-8 w-8 p-0 sm:flex"
          disabled={isLoading || safeCurrent <= 1}
          onClick={() => onPageChange(1)}
          title="الصفحة الأولى"
          aria-label="الصفحة الأولى"
        >
          <ChevronsLeft className="h-4 w-4" />
        </AppButton>

        {/* Previous */}
        <AppButton
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2.5"
          disabled={isLoading || safeCurrent <= 1}
          onClick={() => onPageChange(safeCurrent - 1)}
          title="السابق"
        >
          <ChevronStartIcon className="h-4 w-4" />
          <span className="hidden sm:inline">السابق</span>
        </AppButton>

        {/* Numbered pages (always LTR so numbers read 1 → N) */}
        <div className="flex items-center gap-1" dir="ltr">
          {pageItems.map((item, idx) =>
            item === "…" ? (
              <span
                key={`gap-${idx}`}
                className="flex h-8 min-w-8 items-center justify-center px-1 text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                disabled={isLoading}
                onClick={() => onPageChange(item)}
                className={cn(
                  "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors",
                  item === safeCurrent
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-transparent bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                aria-current={item === safeCurrent ? "page" : undefined}
              >
                {item}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <AppButton
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2.5"
          disabled={isLoading || safeCurrent >= safeLast}
          onClick={() => onPageChange(safeCurrent + 1)}
          title="التالي"
        >
          <span className="hidden sm:inline">التالي</span>
          <ChevronEndIcon className="h-4 w-4" />
        </AppButton>

        {/* Last */}
        <AppButton
          variant="outline"
          size="sm"
          className="hidden h-8 w-8 p-0 sm:flex"
          disabled={isLoading || safeCurrent >= safeLast}
          onClick={() => onPageChange(safeLast)}
          title="الصفحة الأخيرة"
          aria-label="الصفحة الأخيرة"
        >
          <ChevronsRight className="h-4 w-4" />
        </AppButton>
      </div>
    </div>
  );
}

export const MediaPagination = memo(MediaPaginationBase);
