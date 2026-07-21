"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppButton,
  AppPagination,
  AppSearchInput,
  AppErrorState,
  AppEmptyState,
  Skeleton,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataTableColumn<T> {
  id: string;
  label: string;
  sortable?: boolean;
  className?: string;
  headClassName?: string;
  hidden?: "md" | "lg" | "xl";
  render: (row: T) => ReactNode;
  mobileRender?: (row: T) => ReactNode;
}

export interface DataTableFilter {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  accessor?: (row: unknown) => unknown;
}

export interface DataTableSortOption {
  value: string;
  label: string;
}

export interface DataTablePagination {
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export interface AppDataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchKeys?: (keyof T & string)[];
  filters?: DataTableFilter[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (filterId: string, value: string) => void;
  sortOptions?: DataTableSortOption[];
  sortValue?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (value: string) => void;
  onSortDirectionChange?: (dir: "asc" | "desc") => void;
  pagination?: DataTablePagination;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T) => ReactNode;
  toolbar?: ReactNode;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  refreshButton?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  totalLabel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function filterData<T>(
  data: T[],
  searchValue: string,
  searchKeys: (keyof T & string)[],
  activeFilters: Record<string, string>,
  filters: DataTableFilter[],
): T[] {
  let result = data;

  if (searchValue.trim()) {
    const q = searchValue.toLowerCase();
    result = result.filter((row) =>
      searchKeys.some((key) => {
        const val = row[key];
        return val != null && String(val).toLowerCase().includes(q);
      }),
    );
  }

  for (const filter of filters) {
    const activeValue = activeFilters[filter.id];
    if (activeValue && activeValue !== "all") {
      result = result.filter((row) => {
        const val = filter.accessor
          ? filter.accessor(row)
          : getNestedValue(row, filter.id);
        return String(val) === activeValue;
      });
    }
  }

  return result;
}

function sortData<T>(
  data: T[],
  sortKey: string,
  direction: "asc" | "desc",
): T[] {
  if (!sortKey) return data;
  return [...data].sort((a, b) => {
    const aVal = getNestedValue(a, sortKey);
    const bVal = getNestedValue(b, sortKey);
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return direction === "asc" ? cmp : -cmp;
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterSelect({
  filter,
  value,
  onChange,
}: {
  filter: DataTableFilter;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <AppSelect value={value} onValueChange={onChange}>
      <AppSelectTrigger className="h-9 w-[140px]">
        <AppSelectValue placeholder={filter.label} />
      </AppSelectTrigger>
      <AppSelectContent>
        {filter.options.map((opt) => (
          <AppSelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </AppSelectItem>
        ))}
      </AppSelectContent>
    </AppSelect>
  );
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-start font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 shrink-0" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
      )}
    </button>
  );
}

function LoadingSkeleton({
  columns,
  rows = 5,
}: {
  columns: DataTableColumn<unknown>[];
  rows?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-4 py-3">
          <div className="flex gap-4">
            {columns.map((col) => (
              <Skeleton key={col.id} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3 last:border-b-0">
            <div className="flex gap-4">
              {columns.map((col) => (
                <Skeleton key={col.id} className="h-5 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function AppDataTable<T>({
  columns,
  data,
  rowKey,
  searchPlaceholder = "بحث...",
  searchValue: controlledSearch,
  onSearchChange,
  searchKeys = [],
  filters = [],
  activeFilters: controlledFilters = {},
  onFilterChange,
  sortOptions = [],
  sortValue: controlledSort,
  sortDirection = "asc",
  onSortChange,
  onSortDirectionChange,
  pagination,
  onRowClick,
  renderMobileCard,
  toolbar,
  loading = false,
  error = false,
  errorMessage,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  refreshButton = false,
  onRefresh,
  refreshing = false,
  totalLabel,
}: AppDataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState("");
  const [internalFilters, setInternalFilters] = useState<Record<string, string>>({});
  const [internalSort, setInternalSort] = useState("");
  const [internalDir, setInternalDir] = useState<"asc" | "desc">("asc");

  const search = controlledSearch ?? internalSearch;
  const filters_ = controlledFilters;
  const sort = controlledSort ?? internalSort;
  const dir = controlledSort !== undefined ? sortDirection : internalDir;

  const handleSearchChange = useCallback(
    (val: string) => {
      if (onSearchChange) onSearchChange(val);
      else setInternalSearch(val);
      if (pagination) pagination.onPageChange(1);
    },
    [onSearchChange, pagination],
  );

  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      if (onFilterChange) onFilterChange(filterId, value);
      else setInternalFilters((prev) => ({ ...prev, [filterId]: value }));
      if (pagination) pagination.onPageChange(1);
    },
    [onFilterChange, pagination],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      if (onSortChange) {
        if (sort === value && onSortDirectionChange) {
          onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");
        } else {
          onSortChange(value);
          if (onSortDirectionChange) onSortDirectionChange("asc");
        }
      } else {
        if (internalSort === value) {
          setInternalDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
          setInternalSort(value);
          setInternalDir("asc");
        }
      }
    },
    [sort, sortDirection, onSortChange, onSortDirectionChange, internalSort],
  );

  const filteredData = useMemo(() => {
    let result = filterData(data, search, searchKeys, filters_, filters);
    result = sortData(result, sort, dir);
    return result;
  }, [data, search, searchKeys, filters_, filters, sort, dir]);

  if (loading) {
    return <LoadingSkeleton columns={columns} />;
  }

  if (error) {
    return (
      <AppErrorState
        title="حدث خطأ في تحميل البيانات"
        description={errorMessage ?? "تعذّر تحميل البيانات. يرجى المحاولة مرة أخرى."}
        onRetry={onRetry}
      />
    );
  }

  if (data.length === 0 && !search && Object.values(filters_).every((v) => !v || v === "all")) {
    return (
      <AppEmptyState
        title={emptyTitle ?? "لا توجد بيانات"}
        description={emptyDescription ?? "لم يتم العثور على عناصر لعرضها."}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {searchKeys.length > 0 && (
          <div className="flex-1 min-w-[200px] max-w-sm">
            <AppSearchInput
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onClear={() => handleSearchChange("")}
              placeholder={searchPlaceholder}
              className="h-9"
            />
          </div>
        )}

        {filters.map((filter) => (
          <FilterSelect
            key={filter.id}
            filter={filter}
            value={filters_[filter.id] ?? "all"}
            onChange={(val) => handleFilterChange(filter.id, val)}
          />
        ))}

        {sortOptions.length > 0 && (
          <AppSelect value={sort || sortOptions[0]?.value} onValueChange={handleSortChange}>
            <AppSelectTrigger className="h-9 w-[140px]">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <AppSelectValue placeholder="ترتيب" />
            </AppSelectTrigger>
            <AppSelectContent>
              {sortOptions.map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        )}

        {refreshButton && onRefresh && (
          <AppButton variant="outline" size="sm" className="h-9" onClick={onRefresh} loading={refreshing}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </AppButton>
        )}

        {toolbar}
      </div>

      {/* Mobile cards */}
      {renderMobileCard && (
        <div className="md:hidden space-y-3">
          {filteredData.length === 0 ? (
            <AppEmptyState
              title={emptyTitle ?? "لا توجد نتائج"}
              description="لم يتم العثور على عناصر مطابقة."
              action={emptyAction}
              variant="compact"
            />
          ) : (
            filteredData.map((row) => (
              <div key={rowKey(row)} onClick={() => onRowClick?.(row)}>
                {renderMobileCard(row)}
              </div>
            ))
          )}
        </div>
      )}

      {/* Desktop / Tablet table */}
      <div className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", renderMobileCard && "hidden md:block")}>
        <AppTable>
          <AppTableHeader>
            <AppTableRow>
              {columns.map((col) => (
                <AppTableHead
                  key={col.id}
                  className={cn(
                    col.headClassName,
                    col.hidden === "md" && "hidden md:table-cell",
                    col.hidden === "lg" && "hidden lg:table-cell",
                    col.hidden === "xl" && "hidden xl:table-cell",
                  )}
                >
                  {col.sortable ? (
                    <SortHeader
                      label={col.label}
                      active={sort === col.id}
                      direction={dir}
                      onClick={() => handleSortChange(col.id)}
                    />
                  ) : (
                    col.label
                  )}
                </AppTableHead>
              ))}
            </AppTableRow>
          </AppTableHeader>
          <AppTableBody>
            {filteredData.length === 0 ? (
              <AppTableRow>
                <AppTableCell colSpan={columns.length} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة</p>
                </AppTableCell>
              </AppTableRow>
            ) : (
              filteredData.map((row) => (
                <AppTableRow
                  key={rowKey(row)}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <AppTableCell
                      key={col.id}
                      className={cn(
                        col.className,
                        col.hidden === "md" && "hidden md:table-cell",
                        col.hidden === "lg" && "hidden lg:table-cell",
                        col.hidden === "xl" && "hidden xl:table-cell",
                      )}
                    >
                      {col.render(row)}
                    </AppTableCell>
                  ))}
                </AppTableRow>
              ))
            )}
          </AppTableBody>
        </AppTable>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {totalLabel ?? `إجمالي ${pagination.total} نتيجة`}
          </p>
          <AppPagination
            currentPage={pagination.page}
            lastPage={pagination.lastPage}
            total={pagination.total}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export { AppDataTable };
