"use client";

import { create } from "zustand";
import type { MediaType, MediaStatus, MediaVisibility, AssetGroupBy } from "../types";

export type AssetViewMode = "grid" | "list" | "compact" | "large";
export type SelectionMode = "single" | "multi";
export type SortField = "created_at" | "title" | "updated_at" | "size_bytes" | "type" | "duration";
export type SortDirection = "asc" | "desc";

export interface MediaWorkspaceFilters {
  search: string;
  type: MediaType | "all";
  status: MediaStatus | "all" | "archived";
  visibility: MediaVisibility | "all";
  extension: string;
  favorites: boolean;
  pinned: boolean;
  dateFrom: string;
  dateTo: string;
  sizeMin: number;
  sizeMax: number;
  durationMin: number;
  durationMax: number;
  uploaderId: number | null;
  unusedOnly: boolean;
  recentlyUploaded: boolean;
}

export interface MediaWorkspaceState {
  selectedFolderId: number | "root" | null;
  viewMode: AssetViewMode;
  groupBy: AssetGroupBy;
  sortField: SortField;
  sortDirection: SortDirection;
  selectionMode: SelectionMode;
  selectedIds: Set<number>;
  lastSelectedIndex: number | null;
  inspectorAssetId: number | null;
  inspectorOpen: boolean;
  leftPanelOpen: boolean;
  leftPanelWidth: number;
  rightPanelOpen: boolean;
  rightPanelWidth: number;
  filters: MediaWorkspaceFilters;
  hasActiveFilters: boolean;

  setSelectedFolderId: (id: number | "root" | null) => void;
  setViewMode: (mode: AssetViewMode) => void;
  setGroupBy: (group: AssetGroupBy) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  toggleSortDirection: () => void;
  setSelectionMode: (mode: SelectionMode) => void;
  selectAsset: (id: number, index: number, shift: boolean, ctrl: boolean, assetIds: number[]) => void;
  clearSelection: () => void;
  selectAll: (ids: number[]) => void;
  setInspectorAssetId: (id: number | null) => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  toggleLeftPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  setLeftPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelWidth: (width: number) => void;
  setRightPanelOpen: (open: boolean) => void;
  setSearch: (search: string) => void;
  setTypeFilter: (type: MediaType | "all") => void;
  setStatusFilter: (status: MediaStatus | "all" | "archived") => void;
  setVisibilityFilter: (visibility: MediaVisibility | "all") => void;
  setExtensionFilter: (ext: string) => void;
  setFavoritesFilter: (favorites: boolean) => void;
  setPinnedFilter: (pinned: boolean) => void;
  setDateRange: (from: string, to: string) => void;
  setSizeRange: (min: number, max: number) => void;
  setDurationRange: (min: number, max: number) => void;
  setUploaderFilter: (id: number | null) => void;
  setUnusedOnly: (unused: boolean) => void;
  setRecentlyUploaded: (recent: boolean) => void;
  resetFilters: () => void;
}

const defaultFilters: MediaWorkspaceFilters = {
  search: "",
  type: "all",
  status: "all",
  visibility: "all",
  extension: "",
  favorites: false,
  pinned: false,
  dateFrom: "",
  dateTo: "",
  sizeMin: 0,
  sizeMax: 0,
  durationMin: 0,
  durationMax: 0,
  uploaderId: null,
  unusedOnly: false,
  recentlyUploaded: false,
};

export const useMediaWorkspaceStore = create<MediaWorkspaceState>((set) => ({
  selectedFolderId: "root",
  viewMode: "grid",
  groupBy: "none",
  sortField: "created_at",
  sortDirection: "desc",
  selectionMode: "multi",
  selectedIds: new Set<number>(),
  lastSelectedIndex: null,
  inspectorAssetId: null,
  inspectorOpen: false,
  leftPanelOpen: true,
  leftPanelWidth: 260,
  rightPanelOpen: false,
  rightPanelWidth: 340,
  filters: { ...defaultFilters },
  hasActiveFilters: false,

  setSelectedFolderId: (id) => set({ selectedFolderId: id, selectedIds: new Set(), lastSelectedIndex: null }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setGroupBy: (group) => set({ groupBy: group }),
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (dir) => set({ sortDirection: dir }),
  toggleSortDirection: () => set((s) => ({ sortDirection: s.sortDirection === "asc" ? "desc" : "asc" })),
  setSelectionMode: (mode) => set({ selectionMode: mode }),

  selectAsset: (id, index, shift, ctrl, assetIds) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (shift && s.lastSelectedIndex !== null) {
        const lo = Math.min(s.lastSelectedIndex, index);
        const hi = Math.max(s.lastSelectedIndex, index);
        for (let i = lo; i <= hi; i++) {
          const assetId = assetIds[i];
          if (assetId !== undefined) next.add(assetId);
        }
      } else if (ctrl) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        if (next.has(id) && next.size === 1) next.delete(id);
        else {
          next.clear();
          next.add(id);
        }
      }
      return { selectedIds: next, lastSelectedIndex: index };
    }),

  clearSelection: () => set({ selectedIds: new Set(), lastSelectedIndex: null }),

  selectAll: (ids) => set({ selectedIds: new Set(ids), lastSelectedIndex: null }),

  setInspectorAssetId: (id) => set({ inspectorAssetId: id, rightPanelOpen: id !== null }),
  toggleInspector: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setInspectorOpen: (open) => set({ rightPanelOpen: open }),

  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),

  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  setSearch: (search) => set((s) => ({ filters: { ...s.filters, search } })),
  setTypeFilter: (type) =>
    set((s) => ({
      filters: { ...s.filters, type },
      hasActiveFilters: type !== "all" || computeHasActiveFilters({ ...s.filters, type }),
    })),
  setStatusFilter: (status) =>
    set((s) => ({
      filters: { ...s.filters, status },
      hasActiveFilters: status !== "all" && status !== "archived" || computeHasActiveFilters({ ...s.filters, status }),
    })),
  setVisibilityFilter: (visibility) =>
    set((s) => ({
      filters: { ...s.filters, visibility },
      hasActiveFilters: visibility !== "all" || computeHasActiveFilters({ ...s.filters, visibility }),
    })),
  setExtensionFilter: (ext) =>
    set((s) => ({
      filters: { ...s.filters, extension: ext },
      hasActiveFilters: !!ext || computeHasActiveFilters({ ...s.filters, extension: ext }),
    })),
  setFavoritesFilter: (favorites) =>
    set((s) => ({
      filters: { ...s.filters, favorites },
      hasActiveFilters: favorites || computeHasActiveFilters({ ...s.filters, favorites }),
    })),
  setPinnedFilter: (pinned) =>
    set((s) => ({
      filters: { ...s.filters, pinned },
      hasActiveFilters: pinned || computeHasActiveFilters({ ...s.filters, pinned }),
    })),
  setDateRange: (from, to) =>
    set((s) => ({
      filters: { ...s.filters, dateFrom: from, dateTo: to },
      hasActiveFilters: !!(from || to) || computeHasActiveFilters({ ...s.filters, dateFrom: from, dateTo: to }),
    })),
  setSizeRange: (min, max) =>
    set((s) => ({
      filters: { ...s.filters, sizeMin: min, sizeMax: max },
      hasActiveFilters: !!(min || max) || computeHasActiveFilters({ ...s.filters, sizeMin: min, sizeMax: max }),
    })),
  setDurationRange: (min, max) =>
    set((s) => ({
      filters: { ...s.filters, durationMin: min, durationMax: max },
      hasActiveFilters: !!(min || max) || computeHasActiveFilters({ ...s.filters, durationMin: min, durationMax: max }),
    })),
  setUploaderFilter: (id) =>
    set((s) => ({
      filters: { ...s.filters, uploaderId: id },
      hasActiveFilters: id !== null || computeHasActiveFilters({ ...s.filters, uploaderId: id }),
    })),
  setUnusedOnly: (unused) =>
    set((s) => ({
      filters: { ...s.filters, unusedOnly: unused },
      hasActiveFilters: unused || computeHasActiveFilters({ ...s.filters, unusedOnly: unused }),
    })),
  setRecentlyUploaded: (recent) =>
    set((s) => ({
      filters: { ...s.filters, recentlyUploaded: recent },
      hasActiveFilters: recent || computeHasActiveFilters({ ...s.filters, recentlyUploaded: recent }),
    })),
  resetFilters: () => set({ filters: { ...defaultFilters }, hasActiveFilters: false }),
}));

function computeHasActiveFilters(f: MediaWorkspaceFilters): boolean {
  return (
    f.type !== "all" ||
    f.status !== "all" ||
    f.visibility !== "all" ||
    f.extension !== "" ||
    f.favorites ||
    f.pinned ||
    f.dateFrom !== "" ||
    f.dateTo !== "" ||
    f.sizeMin > 0 ||
    f.sizeMax > 0 ||
    f.durationMin > 0 ||
    f.durationMax > 0 ||
    f.uploaderId !== null ||
    f.unusedOnly ||
    f.recentlyUploaded
  );
}
