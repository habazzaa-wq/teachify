"use client";

import { create } from "zustand";

export type ExamStudioView = "overview" | "question" | "settings";
export type ExamStudioSelectionType = "question" | "exam" | null;

interface ExamStudioState {
  navigatorOpen: boolean;
  inspectorOpen: boolean;
  studioStatus: "loading" | "empty" | "ready";
  view: ExamStudioView;
  selectionType: ExamStudioSelectionType;
  selectedQuestionId: string | null;
  search: string;
  sectionFilter: string;
  bulkMode: boolean;
  selectedQuestionIds: Set<string>;
  createQuestionOpen: boolean;
  editQuestionId: string | null;
  questionPickerOpen: boolean;
  importQuestionOpen: boolean;
  examSettingsOpen: boolean;

  setNavigatorOpen: (open: boolean) => void;
  toggleNavigator: () => void;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  setStudioStatus: (status: "loading" | "empty" | "ready") => void;
  setView: (view: ExamStudioView) => void;
  selectQuestion: (id: string | null) => void;
  clearSelection: () => void;
  setSearch: (value: string) => void;
  setSectionFilter: (value: string) => void;
  setBulkMode: (value: boolean) => void;
  toggleQuestionSelected: (id: string) => void;
  clearQuestionSelection: () => void;
  openCreateQuestion: () => void;
  closeCreateQuestion: () => void;
  openEditQuestion: (id: string) => void;
  closeEditQuestion: () => void;
  openQuestionPicker: () => void;
  closeQuestionPicker: () => void;
  openImportQuestion: () => void;
  closeImportQuestion: () => void;
  openExamSettings: () => void;
  closeExamSettings: () => void;
  reset: () => void;
}

export const useExamStudioStore = create<ExamStudioState>()((set) => ({
  navigatorOpen: true,
  inspectorOpen: true,
  studioStatus: "empty",
  view: "overview",
  selectionType: null,
  selectedQuestionId: null,
  search: "",
  sectionFilter: "all",
  bulkMode: false,
  selectedQuestionIds: new Set<string>(),
  createQuestionOpen: false,
  editQuestionId: null,
  questionPickerOpen: false,
  importQuestionOpen: false,
  examSettingsOpen: false,

  setNavigatorOpen: (navigatorOpen) => set({ navigatorOpen }),
  toggleNavigator: () => set((s) => ({ navigatorOpen: !s.navigatorOpen })),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  setStudioStatus: (studioStatus) => set({ studioStatus }),
  setView: (view) => set({ view, selectionType: view === "question" ? "question" : "exam" }),
  selectQuestion: (id) =>
    set({ selectedQuestionId: id, view: id ? "question" : "overview", selectionType: id ? "question" : "exam" }),
  clearSelection: () => set({ selectedQuestionId: null, view: "overview", selectionType: "exam" }),
  setSearch: (search) => set({ search }),
  setSectionFilter: (sectionFilter) => set({ sectionFilter }),
  setBulkMode: (bulkMode) => set({ bulkMode, selectedQuestionIds: new Set<string>() }),
  toggleQuestionSelected: (id) =>
    set((s) => {
      const next = new Set(s.selectedQuestionIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedQuestionIds: next };
    }),
  clearQuestionSelection: () => set({ selectedQuestionIds: new Set<string>() }),
  openCreateQuestion: () => set({ createQuestionOpen: true }),
  closeCreateQuestion: () => set({ createQuestionOpen: false }),
  openEditQuestion: (id) => set({ editQuestionId: id }),
  closeEditQuestion: () => set({ editQuestionId: null }),
  openQuestionPicker: () => set({ questionPickerOpen: true }),
  closeQuestionPicker: () => set({ questionPickerOpen: false }),
  openImportQuestion: () => set({ importQuestionOpen: true }),
  closeImportQuestion: () => set({ importQuestionOpen: false }),
  openExamSettings: () => set({ examSettingsOpen: true }),
  closeExamSettings: () => set({ examSettingsOpen: false }),
  reset: () =>
    set({
      navigatorOpen: true,
      inspectorOpen: true,
      studioStatus: "empty",
      view: "overview",
      selectionType: null,
      selectedQuestionId: null,
      search: "",
      sectionFilter: "all",
      bulkMode: false,
      selectedQuestionIds: new Set<string>(),
      createQuestionOpen: false,
      editQuestionId: null,
      questionPickerOpen: false,
      importQuestionOpen: false,
      examSettingsOpen: false,
    }),
}));
