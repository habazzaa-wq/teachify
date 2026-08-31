"use client";

import { ChevronEndIcon, ChevronStartIcon } from "./icons";
import { cn } from "@/lib/cn";

interface AppPaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

type PageItem = number | "ellipsis";

/**
 * Builds the list of page buttons around a window of ±1 around the current
 * page, always keeping the first and last page visible, with ellipsis for
 * the gaps. e.g. [1, …, 4, 5, 6, …, 10]
 */
function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: PageItem[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) {
    items.push("ellipsis");
  }
  for (let p = start; p <= end; p += 1) {
    items.push(p);
  }
  if (end < total - 1) {
    items.push("ellipsis");
  }
  items.push(total);

  return items;
}

const pageNavClass =
  "bg-tenant-surface text-tenant-fg-muted/70 hover:bg-tenant-soft hover:text-tenant-fg border-tenant-border/40";

const pageItemClass = cn(
  "inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-all duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-ring focus-visible:ring-offset-2 focus-visible:ring-offset-tenant-bg",
  "disabled:pointer-events-none disabled:opacity-35",
);

/**
 * RTL-aware pager with numbered page buttons (with ellipsis for large ranges),
 * previous/next chevrons and a subtle summary line. Renders nothing when the
 * dataset is empty.
 */
function AppPagination({
  currentPage,
  lastPage,
  total,
  onPageChange,
  className,
}: AppPaginationProps) {
  const pageCount = Math.max(lastPage, 1);
  const canPrev = currentPage > 1;
  const canNext = currentPage < pageCount;
  const items = getPageItems(currentPage, pageCount);

  if (total === 0) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className={cn("flex flex-col items-center gap-3", className)}
    >
      <nav
        aria-label="التنقل بين الصفحات"
        className="flex flex-wrap items-center justify-center gap-1.5"
      >
        <button
          type="button"
          aria-label="الصفحة السابقة"
          disabled={!canPrev}
          onClick={() => onPageChange(currentPage - 1)}
          className={cn(pageItemClass, "w-9 px-0", pageNavClass)}
        >
          <ChevronStartIcon className="h-4 w-4" />
        </button>

        {items.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-9 min-w-6 items-center justify-center px-1 text-sm font-medium text-tenant-fg-muted/40"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === currentPage ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                pageItemClass,
                item === currentPage
                  ? "border-tenant-accent bg-tenant-accent text-tenant-accent-fg shadow-sm shadow-tenant-accent/25"
                  : pageNavClass,
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="الصفحة التالية"
          disabled={!canNext}
          onClick={() => onPageChange(currentPage + 1)}
          className={cn(pageItemClass, "w-9 px-0", pageNavClass)}
        >
          <ChevronEndIcon className="h-4 w-4" />
        </button>
      </nav>

      <p className="text-[11px] font-medium text-tenant-fg-muted/50">
        صفحة{" "}
        <span className="font-bold text-tenant-fg">{currentPage}</span> من{" "}
        <span className="font-bold text-tenant-fg">{pageCount}</span>
      </p>
    </div>
  );
}

export { AppPagination };