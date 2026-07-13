"use client";

import { create } from "zustand";
import type { CourseModule } from "@/features/course-modules/types";
import type { CourseSection } from "@/features/course-sections/types";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";

export type StudioStatus = "loading" | "empty" | "ready";

export type StudioSelectionType = "lecture" | "section" | "content" | null;

interface CourseStudioState {
  navigatorOpen: boolean;
  inspectorOpen: boolean;
  studioStatus: StudioStatus;
  selectedLectureId: string | null;
  selectedSectionId: string | null;
  selectedContentId: string | null;
  selectionType: StudioSelectionType;
  contentPickerOpen: boolean;
  activeExtensionType: ContentItemType | null;
  examPickerOpen: boolean;
  mediaPickerOpen: boolean;
  mediaPickerContentType: ContentItemType | null;
  createDialogOpen: boolean;
  editLecture: CourseModule | null;
  deleteConfirmLectureId: string | null;
  createSectionDialogOpen: boolean;
  createSectionLectureId: string | null;
  editSection: CourseSection | null;
  deleteConfirmSectionId: string | null;
  expandedLectures: string[];

  setNavigatorOpen: (open: boolean) => void;
  toggleNavigator: () => void;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  setStudioStatus: (status: StudioStatus) => void;
  selectLecture: (id: string | null) => void;
  selectSection: (id: string | null) => void;
  selectContent: (id: string | null) => void;
  clearSelection: () => void;
  openContentPicker: () => void;
  closeContentPicker: () => void;
  openExamPicker: () => void;
  closeExamPicker: () => void;
  openMediaPicker: (type: ContentItemType) => void;
  closeMediaPicker: () => void;
  triggerExtension: (type: ContentItemType) => void;
  clearExtension: () => void;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openEditDialog: (lecture: CourseModule) => void;
  closeEditDialog: () => void;
  openDeleteConfirm: (id: string) => void;
  closeDeleteConfirm: () => void;
  openCreateSectionDialog: (lectureId: string) => void;
  closeCreateSectionDialog: () => void;
  openEditSectionDialog: (section: CourseSection) => void;
  closeEditSectionDialog: () => void;
  openDeleteSectionConfirm: (id: string) => void;
  closeDeleteSectionConfirm: () => void;
  toggleLectureExpanded: (id: string) => void;
  expandLecture: (id: string) => void;
}

export const useCourseStudioStore = create<CourseStudioState>()((set) => ({
  navigatorOpen: true,
  inspectorOpen: false,
  studioStatus: "empty",
  selectedLectureId: null,
  selectedSectionId: null,
  selectedContentId: null,
  selectionType: null,
  contentPickerOpen: false,
  activeExtensionType: null,
  examPickerOpen: false,
  mediaPickerOpen: false,
  mediaPickerContentType: null,
  createDialogOpen: false,
  editLecture: null,
  deleteConfirmLectureId: null,
  createSectionDialogOpen: false,
  createSectionLectureId: null,
  editSection: null,
  deleteConfirmSectionId: null,
  expandedLectures: [],

  setNavigatorOpen: (navigatorOpen) => set({ navigatorOpen }),
  toggleNavigator: () => set((s) => ({ navigatorOpen: !s.navigatorOpen })),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  setStudioStatus: (studioStatus) => set({ studioStatus }),
  selectLecture: (id) => set({ selectedLectureId: id, selectedSectionId: null, selectedContentId: null, selectionType: id ? "lecture" : null }),
  selectSection: (id) => set({ selectedSectionId: id, selectedContentId: null, selectionType: id ? "section" : null }),
  selectContent: (id) => set({ selectedContentId: id, selectionType: id ? "content" : null }),
  clearSelection: () => set({ selectedLectureId: null, selectedSectionId: null, selectedContentId: null, selectionType: null }),
  openContentPicker: () => set({ contentPickerOpen: true }),
  closeContentPicker: () => set({ contentPickerOpen: false }),
  openExamPicker: () => set({ contentPickerOpen: false, examPickerOpen: true }),
  closeExamPicker: () => set({ examPickerOpen: false }),
  openMediaPicker: (type) => set({ contentPickerOpen: false, mediaPickerOpen: true, mediaPickerContentType: type }),
  closeMediaPicker: () => set({ mediaPickerOpen: false, mediaPickerContentType: null }),
  triggerExtension: (type) => set({ activeExtensionType: type }),
  clearExtension: () => set({ activeExtensionType: null }),
  openCreateDialog: () => set({ createDialogOpen: true }),
  closeCreateDialog: () => set({ createDialogOpen: false }),
  openEditDialog: (lecture) => set({ editLecture: lecture }),
  closeEditDialog: () => set({ editLecture: null }),
  openDeleteConfirm: (id) => set({ deleteConfirmLectureId: id }),
  closeDeleteConfirm: () => set({ deleteConfirmLectureId: null }),
  openCreateSectionDialog: (lectureId) => set({ createSectionDialogOpen: true, createSectionLectureId: lectureId }),
  closeCreateSectionDialog: () => set({ createSectionDialogOpen: false, createSectionLectureId: null }),
  openEditSectionDialog: (section) => set({ editSection: section }),
  closeEditSectionDialog: () => set({ editSection: null }),
  openDeleteSectionConfirm: (id) => set({ deleteConfirmSectionId: id }),
  closeDeleteSectionConfirm: () => set({ deleteConfirmSectionId: null }),
  toggleLectureExpanded: (id) =>
    set((s) => ({
      expandedLectures: s.expandedLectures.includes(id)
        ? s.expandedLectures.filter((eid) => eid !== id)
        : [...s.expandedLectures, id],
    })),
  expandLecture: (id) =>
    set((s) => ({
      expandedLectures: s.expandedLectures.includes(id) ? s.expandedLectures : [...s.expandedLectures, id],
    })),
}));
