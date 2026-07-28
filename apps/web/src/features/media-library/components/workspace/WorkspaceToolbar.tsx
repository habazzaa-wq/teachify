"use client";

import { memo, useMemo } from "react";
import {
  Search,
  Upload,
  Plus,
  Grid3X3,
  List,
  LayoutGrid,
  Maximize2,
  ChevronDown,
  X,
  Filter,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import {
  StudioContextMenu,
} from "@/components/studio";
import type { StudioContextMenuItem } from "@/components/studio";
import { useMediaWorkspaceStore } from "../../store";
import {
  TYPE_OPTIONS,
  STATUS_OPTIONS,
  SORT_OPTIONS,
  VIEW_MODE_OPTIONS,
  GROUP_BY_OPTIONS,
} from "../../constants";
import type { AssetViewMode } from "../../store";
import type { AssetGroupBy } from "../../types";

const viewModeIcons: Record<AssetViewMode, React.ComponentType<{ className?: string }>> = {
  grid: Grid3X3,
  list: List,
  compact: LayoutGrid,
  large: Maximize2,
};

interface WorkspaceToolbarProps {
  totalAssets: number;
  onUpload: () => void;
  onCreateFolder: () => void;
  onRefresh: () => void;
}

function WorkspaceToolbar({ totalAssets, onUpload, onCreateFolder, onRefresh }: WorkspaceToolbarProps) {
  const {
    viewMode, setViewMode,
    groupBy, setGroupBy,
    sortField, setSortField,
    sortDirection, toggleSortDirection,
    filters,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    resetFilters,
  } = useMediaWorkspaceStore();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== "all") count++;
    if (filters.status !== "all" && filters.status !== "archived") count++;
    if (filters.visibility !== "all") count++;
    if (filters.extension) count++;
    if (filters.favorites) count++;
    if (filters.pinned) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.sizeMin || filters.sizeMax) count++;
    if (filters.durationMin || filters.durationMax) count++;
    if (filters.uploaderId) count++;
    if (filters.unusedOnly) count++;
    if (filters.recentlyUploaded) count++;
    return count;
  }, [filters]);

  const viewMenuItems: StudioContextMenuItem[] = useMemo(() => VIEW_MODE_OPTIONS.map((opt) => ({
    label: opt.label,
    onSelect: () => setViewMode(opt.value as AssetViewMode),
  })), [setViewMode]);

  const groupMenuItems: StudioContextMenuItem[] = useMemo(() => GROUP_BY_OPTIONS.map((opt) => ({
    label: opt.label,
    onSelect: () => setGroupBy(opt.value as AssetGroupBy),
  })), [setGroupBy]);

  return (
    <div className="flex flex-col gap-2 border-b bg-background px-4 py-2.5">
      {/* Top row: Search + actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، الوسوم، النوع..."
            className="w-full rounded-lg border bg-muted/30 py-2 pe-9 ps-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="بحث في الوسائط"
          />
          {filters.search && (
            <button
              onClick={() => setSearch("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <select
          value={filters.type}
          onChange={(e) => setTypeFilter(e.target.value as typeof filters.type)}
          className="h-9 rounded-lg border bg-background px-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => setStatusFilter(e.target.value as typeof filters.status)}
          className="h-9 rounded-lg border bg-background px-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-0">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as typeof sortField)}
            className="h-9 rounded-e-lg border border-e-0 bg-background px-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={toggleSortDirection}
            className="flex h-9 w-9 items-center justify-center rounded-s-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title={sortDirection === "asc" ? "تصاعدي" : "تنازلي"}
          >
            {sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* View mode */}
        <StudioContextMenu items={viewMenuItems}>
          <button
            className="flex h-9 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm text-foreground transition-colors hover:bg-accent"
            title="وضع العرض"
          >
            {(() => {
              const Icon = viewModeIcons[viewMode] ?? Grid3X3;
              return <Icon className="h-3.5 w-3.5" />;
            })()}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </StudioContextMenu>

        {/* Group by */}
        <StudioContextMenu items={groupMenuItems}>
          <button
            className="flex h-9 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm text-foreground transition-colors hover:bg-accent"
            title="تجميع"
          >
            <span className="text-xs">
              {GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label ?? "تجميع"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </StudioContextMenu>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="تحديث"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Create folder */}
        <button
          onClick={onCreateFolder}
          className="flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">مجلد</span>
        </button>

        {/* Upload */}
        <button
          onClick={onUpload}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>رفع</span>
        </button>
      </div>

      {/* Second row: Active filters + summary */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {totalAssets} {totalAssets === 1 ? "ملف" : "ملف"}
        </span>

        {activeFilterCount > 0 && (
          <>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-accent" />
              <span className="text-xs text-accent">{activeFilterCount} فلتر</span>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              مسح الفلاتر
            </button>
          </>
        )}

        {filters.search && (
          <div className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
            <span>بحث: {filters.search}</span>
            <button onClick={() => setSearch("")}>
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {filters.type !== "all" && (
          <div className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
            <span>{TYPE_OPTIONS.find((o) => o.value === filters.type)?.label}</span>
            <button onClick={() => setTypeFilter("all")}>
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {filters.favorites && (
          <div className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
            <span>المفضلة</span>
            <button onClick={() => useMediaWorkspaceStore.getState().setFavoritesFilter(false)}>
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {filters.pinned && (
          <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">
            <span>المثبتة</span>
            <button onClick={() => useMediaWorkspaceStore.getState().setPinnedFilter(false)}>
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const WorkspaceToolbarComponent = memo(WorkspaceToolbar);
export { WorkspaceToolbarComponent as WorkspaceToolbar };
