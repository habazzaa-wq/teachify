"use client";

import { create } from "zustand";

export type ViewMode = "full" | "split";
export type WorkspaceStatus = "online" | "offline" | "syncing";

interface WorkspaceState {
  leftSidebarOpen: boolean;
  leftSidebarWidth: number;
  leftSidebarCollapsed: boolean;
  rightInspectorOpen: boolean;
  rightInspectorWidth: number;
  viewMode: ViewMode;
  globalSearchOpen: boolean;
  mobileMenuOpen: boolean;
  workspaceStatus: WorkspaceStatus;
  syncProgress: number;
  backgroundTaskCount: number;

  setLeftSidebarOpen: (open: boolean) => void;
  setLeftSidebarWidth: (width: number) => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  toggleLeftSidebar: () => void;
  setRightInspectorOpen: (open: boolean) => void;
  toggleRightInspector: () => void;
  setRightInspectorWidth: (width: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setWorkspaceStatus: (status: WorkspaceStatus) => void;
  setSyncProgress: (progress: number) => void;
  setBackgroundTaskCount: (count: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  leftSidebarOpen: true,
  leftSidebarWidth: 280,
  leftSidebarCollapsed: false,
  rightInspectorOpen: false,
  rightInspectorWidth: 320,
  viewMode: "full",
  globalSearchOpen: false,
  mobileMenuOpen: false,
  workspaceStatus: "online",
  syncProgress: 0,
  backgroundTaskCount: 0,

  setLeftSidebarOpen: (leftSidebarOpen) => set({ leftSidebarOpen }),
  setLeftSidebarWidth: (leftSidebarWidth) => set({ leftSidebarWidth }),
  setLeftSidebarCollapsed: (leftSidebarCollapsed) => set({ leftSidebarCollapsed }),
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  setRightInspectorOpen: (rightInspectorOpen) => set({ rightInspectorOpen }),
  toggleRightInspector: () => set((s) => ({ rightInspectorOpen: !s.rightInspectorOpen })),
  setRightInspectorWidth: (rightInspectorWidth) => set({ rightInspectorWidth }),
  setViewMode: (viewMode) => set({ viewMode }),
  setGlobalSearchOpen: (globalSearchOpen) => set({ globalSearchOpen }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
  setWorkspaceStatus: (workspaceStatus) => set({ workspaceStatus }),
  setSyncProgress: (syncProgress) => set({ syncProgress }),
  setBackgroundTaskCount: (backgroundTaskCount) => set({ backgroundTaskCount }),
}));
