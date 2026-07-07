"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ExplorerNodeType = "course" | "lecture" | "section" | "content";
export type MobilePane = "navigator" | "canvas" | "inspector";

interface WorkspaceState {
  selectedType: ExplorerNodeType | null;
  selectedId: string | null;
  leftPanelWidth: number;
  rightPanelWidth: number;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  mobilePane: MobilePane;
  expandedLectures: string[];
  expandedSections: string[];

  select: (type: ExplorerNodeType | null, id: string | null) => void;
  clearSelection: () => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setMobilePane: (pane: MobilePane) => void;
  toggleLecture: (id: string) => void;
  toggleSection: (id: string) => void;
  expandLectures: (ids: string[]) => void;
  expandSections: (ids: string[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedType: null,
      selectedId: null,
      leftPanelWidth: 300,
      rightPanelWidth: 320,
      leftPanelOpen: true,
      rightPanelOpen: true,
      mobilePane: "navigator",
      expandedLectures: [],
      expandedSections: [],

      select: (type, id) => set({ selectedType: type, selectedId: id }),

      clearSelection: () => set({ selectedType: null, selectedId: null }),

      setLeftPanelWidth: (width) => set({ leftPanelWidth: Math.max(240, Math.min(480, width)) }),

      setRightPanelWidth: (width) => set({ rightPanelWidth: Math.max(260, Math.min(480, width)) }),

      toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),

      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

      setMobilePane: (pane) => set({ mobilePane: pane }),

      toggleLecture: (id) =>
        set((s) => ({
          expandedLectures: s.expandedLectures.includes(id)
            ? s.expandedLectures.filter((eid) => eid !== id)
            : [...s.expandedLectures, id],
        })),

      toggleSection: (id) =>
        set((s) => ({
          expandedSections: s.expandedSections.includes(id)
            ? s.expandedSections.filter((eid) => eid !== id)
            : [...s.expandedSections, id],
        })),

      expandLectures: (ids) =>
        set((s) => ({
          expandedLectures: Array.from(new Set([...s.expandedLectures, ...ids])),
        })),

      expandSections: (ids) =>
        set((s) => ({
          expandedSections: Array.from(new Set([...s.expandedSections, ...ids])),
        })),
    }),
    {
      name: "course-workspace",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        leftPanelWidth: state.leftPanelWidth,
        rightPanelWidth: state.rightPanelWidth,
        leftPanelOpen: state.leftPanelOpen,
        rightPanelOpen: state.rightPanelOpen,
        expandedLectures: state.expandedLectures,
        expandedSections: state.expandedSections,
      }),
    },
  ),
);
