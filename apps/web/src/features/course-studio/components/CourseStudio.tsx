"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { useCourseStudioStore } from "../store";
import { CourseStudioHeader } from "./CourseStudioHeader";
import { CourseStudioBreadcrumb } from "./CourseStudioBreadcrumb";
import { CourseStudioNavigator } from "./CourseStudioNavigator";
import { CourseStudioCanvas } from "./CourseStudioCanvas";
import { CourseStudioInspector } from "./CourseStudioInspector";
import { CourseStudioOnboarding } from "./CourseStudioOnboarding";
import { CourseStudioLoading } from "./CourseStudioLoading";
import { CourseStudioCreateLectureDialog } from "./CourseStudioCreateLectureDialog";
import { CourseStudioEditLectureDialog } from "./CourseStudioEditLectureDialog";
import { CourseStudioCreateSectionDialog } from "./CourseStudioCreateSectionDialog";
import { CourseStudioEditSectionDialog } from "./CourseStudioEditSectionDialog";
import { CourseStudioContentPicker } from "./CourseStudioContentPicker";
import { CourseStudioEditContentDialog } from "./CourseStudioEditContentDialog";
import { CourseStudioContentDetailsDialog } from "./CourseStudioContentDetailsDialog";
import { CourseStudioSessionPickerDialog } from "./CourseStudioSessionPickerDialog";
import { CourseStudioAddItemChoiceDialog } from "./CourseStudioAddItemChoiceDialog";
import { CourseStudioSessionEditDialog } from "./CourseStudioSessionEditDialog";
import { CourseStudioExternalLinkDialog } from "./CourseStudioExternalLinkDialog";
import { CourseStudioContentOnboarding } from "./CourseStudioContentOnboarding";
import { useLectures, useCreateLecture, useUpdateLecture, usePublishLecture, useArchiveLecture, useDuplicateLecture, useDeleteLecture, useRestoreLecture, useReorderLectures, useSelectAndScroll } from "../hooks/useLectures";
import { useSectionsList, useCreateSectionAction, useUpdateSectionAction, useDeleteSectionAction, usePublishSectionAction, useArchiveSectionAction, useDuplicateSectionAction, useRestoreSectionAction, useReorderSectionsAction, useMoveSectionAction, useSelectAndScrollSection } from "../hooks/useSections";
import { useLessons, useCreateLesson, useUpdateLesson, useDeleteLesson, usePublishLesson, useArchiveLesson, useDuplicateLesson, useRestoreLesson, useReorderLessons, useToggleFreePreview, useAttachLessonVideo, useAttachLessonFile } from "@/features/lessons/hooks";
import type { BreadcrumbItem } from "./CourseStudioBreadcrumb";
import type { CourseModule, CreateCourseModulePayload, UpdateCourseModulePayload } from "@/features/course-modules/types";
import type { CourseSection, CreateCourseSectionPayload, UpdateCourseSectionPayload } from "@/features/course-sections/types";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";
import { CONTENT_TYPE_CONFIG } from "@/features/course-content/constants";
import { ExamPicker } from "@/features/exam-bank";
import { MediaPicker } from "@/features/media-library/components/MediaPicker";
import { libraryForAllowedTypes } from "@/features/media-library/constants";
import type { MediaType } from "@/features/media-library/types";

const MEDIA_PICKER_TYPES: Partial<Record<ContentItemType, MediaType[]>> = {
  video: ["video"],
  pdf: ["pdf", "document"],
  audio: ["audio"],
  resource: ["document", "zip", "file"],
};

const CONTENT_TO_LESSON_TYPE: Record<string, string> = {
  video: "video",
  pdf: "pdf",
  audio: "audio",
  resource: "text",
};

export type StudioMode = "loading" | "empty" | "ready";

interface CourseStudioProps {
  mode?: StudioMode;
  courseId?: string;
  courseName?: string;
  courseStatus?: string;
  courseVisibility?: string;
  studentsCount?: number;
  lastEdited?: string;
  isSaving?: boolean;
  isSaved?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
  navigatorWidth?: number;
  inspectorWidth?: number;
  onQuickStart?: () => void;
  onPublish?: () => void;
  onQuickAction?: (action: string) => void;
  instructorMode?: boolean;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

function CourseStudio({
  mode = "empty",
  courseId,
  courseName,
  courseStatus,
  courseVisibility,
  studentsCount,
  lastEdited,
  isSaving,
  isSaved,
  breadcrumbItems,
  navigatorWidth = 300,
  inspectorWidth = 320,
  onQuickStart,
  onPublish,
  onQuickAction,
  instructorMode = false,
}: CourseStudioProps) {
  const isMobile = useIsMobile();
  const store = useCourseStudioStore();
  const [editContentItem, setEditContentItem] = useState<ContentItem | null>(null);

  const [pendingContent, setPendingContent] = useState<{
    kind: "media" | "exam";
    mediaId?: number;
    examId?: string;
    contentType?: ContentItemType;
    defaultTitle: string;
  } | null>(null);
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);
  const [addChoiceOpen, setAddChoiceOpen] = useState(false);
  const [sessionModulePickerOpen, setSessionModulePickerOpen] = useState(false);
  const [sessionEditId, setSessionEditId] = useState<string | null>(null);
  const [externalEditItem, setExternalEditItem] = useState<ContentItem | null>(null);

  const { data: lecturesData, isLoading: lecturesLoading } = useLectures(courseId ?? null);
  const lectures: CourseModule[] = (lecturesData?.data ?? []).sort(
    (a, b) => a.order - b.order,
  );

  const { data: sectionsData } = useSectionsList(courseId ?? null);

  const sectionsByLecture = useMemo(() => {
    const map: Record<string, CourseSection[]> = {};
    if (sectionsData?.data) {
      const sorted = [...sectionsData.data].sort((a, b) => a.order - b.order);
      for (const section of sorted) {
        const lectureId = section.courseModuleId ?? courseId;
        if (lectureId && typeof lectureId === "string") {
          if (!map[lectureId]) map[lectureId] = [];
          map[lectureId].push(section);
        }
      }
    }
    return map;
  }, [sectionsData, courseId]);

  const selectedLecture: CourseModule | null = lectures.find((l) => l.id === store.selectedLectureId) ?? null;

  const allSections = sectionsData?.data ?? [];
  const selectedSection: CourseSection | null = allSections.find(
    (s) => s.id === store.selectedSectionId,
  ) ?? null;

  const notDeletedLessons = (id: string) => (data: any) => (data?.data ?? []).filter((l: any) => !l.deletedAt);

  const { data: lessonsData } = useLessons(
    courseId ?? null,
    store.selectedSectionId,
  );
  const contentItems: ContentItem[] = useMemo(() => {
    if (!lessonsData?.data) return [];
    return lessonsData.data
      .filter((l: any) => !l.deletedAt)
      .sort((a: any, b: any) => a.order - b.order)
      .map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        type: (lesson.lessonType === "text" ? "resource" : lesson.lessonType === "external" ? "external_link" : lesson.lessonType) as ContentItemType,
        status: lesson.status === "archived" ? "archived" as const : lesson.status === "published" ? "published" as const : "draft" as const,
        visibility: lesson.visibility === "public" ? "public" as const : lesson.visibility === "preview" ? "preview" as const : "private" as const,
        duration: lesson.estimatedDuration ?? lesson.durationSeconds ?? null,
        freePreview: lesson.freePreview ?? false,
        locked: false,
        order: lesson.order ?? 0,
        thumbnail: null,
        description: lesson.shortDescription ?? lesson.description,
        examId: lesson.examId ?? null,
        externalUrl: lesson.externalUrl ?? lesson.external_url ?? null,
        courseSessionId: lesson.courseSessionId ?? null,
        courseSession: lesson.courseSession ?? null,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      } satisfies ContentItem));
  }, [lessonsData]);

  const selectedContent: ContentItem | null = contentItems.find(
    (c) => c.id === store.selectedContentId,
  ) ?? null;

  const canvasView = store.selectionType === "content" ? "content" as const
    : store.selectionType === "section" ? "section" as const
    : store.selectionType === "lecture" ? "lecture" as const
    : null;

  const createLecture = useCreateLecture();
  const updateLecture = useUpdateLecture();
  const publishLecture = usePublishLecture();
  const archiveLecture = useArchiveLecture();
  const duplicateLecture = useDuplicateLecture();
  const deleteLecture = useDeleteLecture();
  const restoreLecture = useRestoreLecture();
  const reorderLectures = useReorderLectures();

  const createSection = useCreateSectionAction();
  const updateSection = useUpdateSectionAction();
  const deleteSection = useDeleteSectionAction();
  const publishSection = usePublishSectionAction();
  const archiveSectionAction = useArchiveSectionAction();
  const duplicateSection = useDuplicateSectionAction();
  const restoreSection = useRestoreSectionAction();
  const reorderSections = useReorderSectionsAction();
  const moveSection = useMoveSectionAction();

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const publishLesson = usePublishLesson();
  const archiveLesson = useArchiveLesson();
  const duplicateLesson = useDuplicateLesson();
  const deleteLesson = useDeleteLesson();
  const restoreLesson = useRestoreLesson();
  const reorderLessons = useReorderLessons();
  const toggleFreePreview = useToggleFreePreview();
  const attachVideo = useAttachLessonVideo();
  const attachFile = useAttachLessonFile();

  const { selectAndScroll } = useSelectAndScroll(
    store.selectLecture,
  );

  const { selectAndScroll: selectAndScrollSection } = useSelectAndScrollSection(
    store.selectSection,
  );

  const openAddChoice = useCallback(() => setAddChoiceOpen(true), []);
  const closeAddChoice = useCallback(() => setAddChoiceOpen(false), []);

  const handleSessionModuleSelected = useCallback(
    async (session: any) => {
      if (!courseId) return;
      try {
        await createLecture.create(courseId, {
          title: session.title,
          course_session_id: Number(session.id),
          order: lectures.length,
        } as any);
        setSessionModulePickerOpen(false);
        toast.success(`تم إضافة الجلسة "${session.title}" إلى المنهج`);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "فشل إضافة الجلسة إلى المنهج";
        toast.error(String(msg));
      }
    },
    [courseId, createLecture, lectures.length],
  );

  const handleCreateLecture = useCallback(
    async (payload: CreateCourseModulePayload) => {
      if (!courseId) return;
      try {
        const result = await createLecture.create(courseId, payload);
        store.closeCreateDialog();
        toast.success("تم إنشاء المحاضرة بنجاح");
        if (result?.id) {
          store.expandLecture(result.id);
          selectAndScroll(result.id);
        }
      } catch {
        toast.error("فشل إنشاء المحاضرة");
      }
    },
    [courseId, createLecture, selectAndScroll, store.closeCreateDialog, store.expandLecture],
  );

  const handleUpdateLecture = useCallback(
    async (payload: UpdateCourseModulePayload) => {
      if (!courseId || !store.editLecture) return;
      try {
        await updateLecture.update(courseId, store.editLecture.id, payload);
        store.closeEditDialog();
        toast.success("تم تحديث المحاضرة بنجاح");
      } catch {
        toast.error("فشل تحديث المحاضرة");
      }
    },
    [courseId, store.editLecture, updateLecture, store.closeEditDialog],
  );

  const handlePublishLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await publishLecture.publish(courseId, lecture.id);
        toast.success(`تم نشر "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل نشر المحاضرة");
      }
    },
    [courseId, publishLecture],
  );

  const handleArchiveLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await archiveLecture.archive(courseId, lecture.id);
        toast.success(`تم أرشفة "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل أرشفة المحاضرة");
      }
    },
    [courseId, archiveLecture],
  );

  const handleDuplicateLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await duplicateLecture.duplicate(courseId, lecture.id);
        toast.success(`تم نسخ "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل نسخ المحاضرة");
      }
    },
    [courseId, duplicateLecture],
  );

  const handleDeleteLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await deleteLecture.remove(courseId, lecture.id);
        if (store.selectedLectureId === lecture.id) {
          store.clearSelection();
        }
        toast.success(`تم حذف "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل حذف المحاضرة");
      }
    },
    [courseId, deleteLecture, store.selectedLectureId, store.clearSelection],
  );

  const handleRestoreLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await restoreLecture.restore(courseId, lecture.id);
        toast.success(`تم استعادة "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل استعادة المحاضرة");
      }
    },
    [courseId, restoreLecture],
  );

  const handleReorder = useCallback(
    async (_lectures: CourseModule[], fromIndex: number, toIndex: number) => {
      if (!courseId) return;
      const reordered = [..._lectures];
      const moved = reordered.splice(fromIndex, 1)[0];
      if (!moved) return;
      reordered.splice(toIndex, 0, moved);
      const items = reordered.map((l, i) => ({
        id: parseInt(l.id, 10),
        order: i + 1,
      }));
      try {
        await reorderLectures.reorder(courseId, items);
        toast.success("تم إعادة ترتيب المحاضرات");
      } catch {
        toast.error("فشل إعادة الترتيب");
      }
    },
    [courseId, reorderLectures],
  );

  const handleSelectLecture = useCallback(
    (id: string) => {
      store.selectLecture(id);
    },
    [store.selectLecture],
  );

  const handleToggleLecture = useCallback(
    (id: string) => {
      store.toggleLectureExpanded(id);
    },
    [store.toggleLectureExpanded],
  );

  const handleSelectSection = useCallback(
    (id: string) => {
      store.selectSection(id);
      store.setInspectorOpen(true);
    },
    [store.selectSection, store.setInspectorOpen],
  );

  const handleAddSection = useCallback(
    (lectureId: string) => {
      store.openCreateSectionDialog(lectureId);
    },
    [store.openCreateSectionDialog],
  );

  const handleReorderSections = useCallback(
    async (courseId: string, sections: Array<{ id: number; sort_order: number }>) => {
      try {
        await reorderSections.reorder(courseId, sections);
        toast.success("تم إعادة ترتيب الأقسام بنجاح");
      } catch {
        toast.error("فشل إعادة ترتيب الأقسام");
      }
    },
    [reorderSections],
  );

  const handleCreateSection = useCallback(
    async (payload: CreateCourseSectionPayload) => {
      if (!courseId || !store.createSectionLectureId) return;
      try {
        const result = await createSection.create(courseId, {
          ...payload,
          course_module_id: store.createSectionLectureId,
        });
        store.closeCreateSectionDialog();
        toast.success("تم إنشاء القسم بنجاح");
        if (result?.id) {
          store.expandLecture(store.createSectionLectureId);
          selectAndScrollSection(result.id);
          store.selectSection(result.id);
          store.setInspectorOpen(true);
        }
      } catch {
        toast.error("فشل إنشاء القسم");
      }
    },
    [courseId, createSection, store.createSectionLectureId, store.closeCreateSectionDialog, store.expandLecture, selectAndScrollSection, store.selectSection, store.setInspectorOpen],
  );

  const handleUpdateSection = useCallback(
    async (payload: UpdateCourseSectionPayload) => {
      if (!courseId || !store.editSection) return;
      try {
        await updateSection.update(courseId, store.editSection.id, payload);
        store.closeEditSectionDialog();
        toast.success("تم تحديث القسم بنجاح");
      } catch {
        toast.error("فشل تحديث القسم");
      }
    },
    [courseId, store.editSection, updateSection, store.closeEditSectionDialog],
  );

  const handlePublishSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await publishSection.publish(courseId, section.id);
        toast.success(`تم نشر "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل نشر القسم");
      }
    },
    [courseId, publishSection],
  );

  const handleArchiveSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await archiveSectionAction.archive(courseId, section.id);
        toast.success(`تم أرشفة "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل أرشفة القسم");
      }
    },
    [courseId, archiveSectionAction],
  );

  const handleDuplicateSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await duplicateSection.duplicate(courseId, section.id);
        toast.success(`تم نسخ "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل نسخ القسم");
      }
    },
    [courseId, duplicateSection],
  );

  const handleDeleteSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await deleteSection.remove(courseId, section.id);
        if (store.selectedSectionId === section.id) {
          store.selectLecture(store.selectedLectureId);
        }
        toast.success(`تم حذف "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل حذف القسم");
      }
    },
    [courseId, deleteSection, store.selectedSectionId, store.selectedLectureId, store.selectLecture],
  );

  const handleRestoreSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await restoreSection.restore(courseId, section.id);
        toast.success(`تم استعادة "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل استعادة القسم");
      }
    },
    [courseId, restoreSection],
  );

  const handleMoveSection = useCallback(
    async (section: CourseSection, lectureId: string | null) => {
      if (!courseId) return;
      try {
        await moveSection.move(courseId, section.id, lectureId);
        toast.success(`تم نقل "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل نقل القسم");
      }
    },
    [courseId, moveSection],
  );

  const handleSelectContent = useCallback(
    (id: string) => {
      store.selectContent(id);
      store.setInspectorOpen(true);
      const item = contentItems.find((c) => c.id === id);
      if (item) {
        const isSession = item.type === "session" || item.type === "live" || !!item.courseSessionId;
        if (isSession && item.courseSessionId) {
          setSessionEditId(item.courseSessionId);
          return;
        }
        if (item.type === "external_link") {
          setExternalEditItem(item);
        }
      }
    },
    [store.selectContent, store.setInspectorOpen, contentItems],
  );

  const handleAddContent = useCallback(
    () => {
      store.openContentPicker();
    },
    [store.openContentPicker],
  );

  const handleContentTypeSelected = useCallback(
    (type: ContentItemType) => {
      if (!courseId || !store.selectedSectionId) return;

      if (type === "exam") {
        store.openExamPicker();
        return;
      }

      if (type === "session" || type === "live") {
        setSessionPickerOpen(true);
        return;
      }

      if (MEDIA_PICKER_TYPES[type]) {
        store.openMediaPicker(type);
        return;
      }

      store.triggerExtension(type);
      const sectionId = store.selectedSectionId;
      const nextOrder = contentItems.length;
      createLesson.mutateAsync({
        courseId,
        sectionId,
        data: {
          title: `${CONTENT_TYPE_CONFIG[type].label} جديد`,
          lesson_type: type === "external_link" ? "external" as any : type === "resource" ? "text" as any : type as any,
          sort_order: nextOrder + 1,
        },
      }).then((created: any) => {
        toast.success(`تم إضافة ${CONTENT_TYPE_CONFIG[type].label} بنجاح`);
        store.clearExtension();
        if (type === "external_link" && created) {
          const c = created?.data ?? created;
          setExternalEditItem({
            id: String(c.id ?? ""),
            title: c.title ?? "رابط خارجي",
            type: "external_link",
            status: "draft",
            visibility: "private",
            duration: null,
            freePreview: false,
            locked: false,
            order: c.order ?? c.sort_order ?? 0,
            externalUrl: c.externalUrl ?? c.external_url ?? null,
            description: c.shortDescription ?? c.description ?? null,
            createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
            updatedAt: c.updatedAt ?? c.updated_at ?? new Date().toISOString(),
          } as any);
        }
      }).catch(() => {
        toast.error(`فشل إنشاء ${CONTENT_TYPE_CONFIG[type].label}`);
        store.clearExtension();
      });
    },
    [courseId, store.selectedSectionId, store.openMediaPicker, store.triggerExtension, store.clearExtension, contentItems.length, createLesson],
  );

  const handleExamPicked = useCallback(
    (result: { id: string; ids: string[]; title: string }) => {
      if (!courseId || !store.selectedSectionId) return;
      store.closeExamPicker();
      setPendingContent({
        kind: "exam",
        examId: result.id,
        defaultTitle: result.title,
      });
    },
    [courseId, store.selectedSectionId, store.closeExamPicker],
  );

  const handleMediaSelected = useCallback(
    (result: { id: number; ids: number[]; title?: string | null }) => {
      if (!courseId || !store.selectedSectionId) return;
      const contentType = store.mediaPickerContentType ?? "video";
      const typeLabel = CONTENT_TYPE_CONFIG[contentType]?.label ?? "الوسائط";
      store.closeMediaPicker();
      setPendingContent({
        kind: "media",
        mediaId: result.id,
        contentType,
        defaultTitle: result.title || typeLabel,
      });
    },
    [courseId, store.selectedSectionId, store.mediaPickerContentType, store.closeMediaPicker],
  );

  const handleSessionSelected = useCallback(
    async (session: any) => {
      if (!courseId || !store.selectedSectionId) return;
      const sectionId = store.selectedSectionId;
      const nextOrder = contentItems.length + 1;
      try {
        await createLesson.mutateAsync({
          courseId,
          sectionId,
          data: {
            title: session.title,
            lesson_type: "session" as any,
            course_session_id: Number(session.id),
            sort_order: nextOrder,
          },
        });
        toast.success(`تم إضافة الجلسة "${session.title}" إلى المحتوى`);
        setSessionPickerOpen(false);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "فشل إضافة الجلسة للمحتوى";
        toast.error(String(msg));
      }
    },
    [courseId, store.selectedSectionId, contentItems.length, createLesson],
  );

  const handleCreateContent = useCallback(
    async (title: string, description: string) => {
      if (!courseId || !store.selectedSectionId || !pendingContent) return;
      const sectionId = store.selectedSectionId;
      const nextOrder = contentItems.length + 1;
      try {
        if (pendingContent.kind === "media" && pendingContent.mediaId != null) {
          const contentType = pendingContent.contentType ?? "video";
          const lessonType = (CONTENT_TO_LESSON_TYPE[contentType] ?? "video") as any;
          const lesson = await createLesson.mutateAsync({
            courseId,
            sectionId,
            data: {
              title,
              lesson_type: lessonType,
              description: description || null,
              sort_order: nextOrder,
            },
          });
          if (contentType === "video") {
            await attachVideo.mutateAsync({ courseId, sectionId, lessonId: lesson.id, mediaAssetId: pendingContent.mediaId });
          } else {
            await attachFile.mutateAsync({ courseId, sectionId, lessonId: lesson.id, mediaAssetId: pendingContent.mediaId, title });
          }
          toast.success(`تم إضافة "${title}" بنجاح`);
        } else if (pendingContent.examId) {
          await createLesson.mutateAsync({
            courseId,
            sectionId,
            data: {
              title,
              lesson_type: "exam" as any,
              exam_id: Number(pendingContent.examId),
              description: description || null,
              sort_order: nextOrder,
            },
          });
          toast.success(`تم ربط "${title}" بنجاح`);
        }
        setPendingContent(null);
      } catch {
        toast.error("فشل إضافة المحتوى");
      }
    },
    [courseId, store.selectedSectionId, pendingContent, contentItems.length, createLesson, attachVideo, attachFile],
  );

  /* Content action handlers — reuse existing lesson mutations directly */
  const handlePublishContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await publishLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(`تم نشر "${item.title}" بنجاح`);
      } catch { toast.error("فشل نشر المحتوى"); }
    },
    [courseId, store.selectedSectionId, publishLesson],
  );

  const handleArchiveContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await archiveLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(`تم أرشفة "${item.title}" بنجاح`);
      } catch { toast.error("فشل أرشفة المحتوى"); }
    },
    [courseId, store.selectedSectionId, archiveLesson],
  );

  const handleDuplicateContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await duplicateLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(`تم نسخ "${item.title}" بنجاح`);
      } catch { toast.error("فشل نسخ المحتوى"); }
    },
    [courseId, store.selectedSectionId, duplicateLesson],
  );

  const handleDeleteContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await deleteLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        if (store.selectedContentId === item.id) {
          store.selectSection(store.selectedSectionId);
        }
        toast.success(`تم حذف "${item.title}" بنجاح`);
      } catch { toast.error("فشل حذف المحتوى"); }
    },
    [courseId, store.selectedSectionId, deleteLesson, store.selectedContentId, store.selectSection],
  );

  const handleRestoreContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await restoreLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(`تم استعادة "${item.title}" بنجاح`);
      } catch { toast.error("فشل استعادة المحتوى"); }
    },
    [courseId, store.selectedSectionId, restoreLesson],
  );

  const handleToggleFreePreview = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await toggleFreePreview.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(item.freePreview ? "تم إيقاف المعاينة المجانية" : "تم تفعيل المعاينة المجانية");
      } catch { toast.error("فشل تحديث المعاينة"); }
    },
    [courseId, store.selectedSectionId, toggleFreePreview],
  );

  const handleEditContent = useCallback(
    (item: ContentItem) => {
      const isSession = item.type === "session" || item.type === "live" || !!item.courseSessionId;
      if (isSession && item.courseSessionId) {
        setSessionEditId(item.courseSessionId);
        return;
      }
      if (item.type === "external_link") {
        setExternalEditItem(item);
        return;
      }
      setEditContentItem(item);
    },
    [],
  );

  const handleSaveContentTitle = useCallback(
    async (newTitle: string) => {
      if (!courseId || !store.selectedSectionId || !editContentItem) return;
      try {
        await updateLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: editContentItem.id, data: { title: newTitle } });
        toast.success("تم تحديث العنوان بنجاح");
      } catch { toast.error("فشل تحديث العنوان"); } finally {
        setEditContentItem(null);
      }
    },
    [courseId, store.selectedSectionId, editContentItem, updateLesson],
  );

  const handleSaveExternalLink = useCallback(
    async (value: { title: string; external_url: string; short_description: string }) => {
      if (!courseId || !store.selectedSectionId || !externalEditItem) return;
      try {
        await updateLesson.mutateAsync({
          courseId,
          sectionId: store.selectedSectionId,
          id: externalEditItem.id,
          data: {
            title: value.title,
            external_url: value.external_url,
            short_description: value.short_description,
          } as any,
        });
        toast.success("تم حفظ الرابط الخارجي");
        setExternalEditItem(null);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "فشل حفظ الرابط الخارجي";
        toast.error(String(msg));
      }
    },
    [courseId, store.selectedSectionId, externalEditItem, updateLesson],
  );

  const handleReorderContent = useCallback(
    async (_items: ContentItem[], fromIndex: number, toIndex: number) => {
      if (!courseId || !store.selectedSectionId) return;
      const reordered = [..._items];
      const moved = reordered.splice(fromIndex, 1)[0];
      if (!moved) return;
      reordered.splice(toIndex, 0, moved);
      const lessons = reordered.map((l, i) => ({
        id: parseInt(l.id, 10),
        sort_order: i + 1,
      }));
      try {
        await reorderLessons.mutateAsync({ courseId, sectionId: store.selectedSectionId, lessons });
        toast.success("تم إعادة ترتيب المحتوى");
      } catch { toast.error("فشل إعادة الترتيب"); }
    },
    [courseId, store.selectedSectionId, reorderLessons],
  );

  const navigatorOpen = isMobile ? false : store.navigatorOpen;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      store.setNavigatorOpen(false);
      store.setInspectorOpen(false);
    }
  }, [isMobile]);

  const handleToggleNavigator = useCallback(() => {
    if (isMobile) {
      setMobileNavOpen((prev) => !prev);
    } else {
      store.toggleNavigator();
    }
  }, [isMobile, store.toggleNavigator]);

  const handleToggleInspector = useCallback(() => {
    store.toggleInspector();
  }, [store.toggleInspector]);

  const handleCloseInspector = useCallback(() => {
    store.setInspectorOpen(false);
  }, [store.setInspectorOpen]);

  const handleCloseMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const defaultBreadcrumb: BreadcrumbItem[] = breadcrumbItems ?? [
    { label: "الدورات", href: "/teacher/courses" },
    { label: courseName ?? "الاستوديو" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        handleToggleNavigator();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        handleToggleInspector();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleNavigator, handleToggleInspector]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileNavOpen]);

  if (mode === "loading") {
    return <CourseStudioLoading />;
  }

  const nextSectionOrder = store.createSectionLectureId
    ? (sectionsByLecture[store.createSectionLectureId]?.length ?? 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col overflow-hidden"
    >
      <CourseStudioHeader
        courseName={courseName}
        courseStatus={courseStatus}
        visibility={courseVisibility}
        studentsCount={studentsCount}
        lastEdited={lastEdited}
        isSaving={isSaving}
        isSaved={isSaved}
        navigatorOpen={isMobile ? mobileNavOpen : store.navigatorOpen}
        inspectorOpen={store.inspectorOpen}
        onToggleNavigator={handleToggleNavigator}
        onToggleInspector={handleToggleInspector}
        onPublish={onPublish}
        onQuickAction={onQuickAction}
      />

      <div className="flex shrink-0 items-center border-b border-studio-border bg-studio-muted/30 px-4 py-1.5 md:px-6">
        <CourseStudioBreadcrumb items={defaultBreadcrumb} />
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isMobile ? (
          <>
            <CourseStudioCanvas
              selectedLecture={selectedLecture}
              selectedSection={selectedSection}
              selectedContent={selectedContent}
              sectionContents={contentItems}
              canvasView={canvasView}
              onCreateLecture={openAddChoice}
              onAddSection={selectedLecture ? () => handleAddSection(selectedLecture.id) : undefined}
              onAddContent={handleAddContent}
              onSelectContent={handleSelectContent}
              onEditContent={handleEditContent}
              onPublishContent={handlePublishContent}
              onArchiveContent={handleArchiveContent}
              onDuplicateContent={handleDuplicateContent}
              onDeleteContent={handleDeleteContent}
              onRestoreContent={handleRestoreContent}
              onToggleFreePreview={instructorMode ? undefined : handleToggleFreePreview}
              onReorderContent={handleReorderContent}
            />

            <AnimatePresence>
              {mobileNavOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 z-40 bg-studio-overlay"
                    onClick={handleCloseMobileNav}
                    aria-hidden="true"
                  />
                  <motion.aside
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-y-0 end-0 z-50 w-[280px]"
                    role="dialog"
                    aria-modal="true"
                    aria-label="مستكشف المحتوى"
                  >
                    <div className="flex h-full flex-col bg-studio-surface border-s border-studio-border">
                      <div className="flex shrink-0 items-center justify-between border-b border-studio-border px-4 py-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-studio-fg-muted">
                          المحتوى التعليمي
                        </h3>
                        <StudioButton
                          variant="ghost"
                          size="icon"
                          onClick={handleCloseMobileNav}
                          aria-label="إغلاق المستكشف"
                        >
                          <X className="h-4 w-4" />
                        </StudioButton>
                      </div>
                      <div className="flex-1 overflow-y-auto studio-scrollbar">
                        <CourseStudioOnboarding
                          variant="navigator"
                          title="ابدأ ببناء منهجك التعليمي"
                          description="نظم محاضراتك وأقسامك والمحتوى التعليمي من هنا"
                          primaryAction={
                            store.createDialogOpen
                              ? { label: "إنشاء أول محاضرة", onClick: store.openCreateDialog }
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            <CourseStudioNavigator
              open={navigatorOpen}
              width={navigatorWidth}
              lectures={lectures ?? []}
              sections={sectionsByLecture}
              courseId={courseId ?? undefined}
              selectedLectureId={store.selectedLectureId}
              selectedSectionId={store.selectedSectionId}
              expandedLectures={store.expandedLectures}
              isLoading={lecturesLoading}
              onSelectLecture={handleSelectLecture}
              onToggleLecture={handleToggleLecture}
              onSelectSection={handleSelectSection}
              onCreateLecture={openAddChoice}
              onEditLecture={(l) => store.openEditDialog(l)}
              onPublishLecture={handlePublishLecture}
              onArchiveLecture={handleArchiveLecture}
              onDuplicateLecture={handleDuplicateLecture}
              onDeleteLecture={handleDeleteLecture}
              onRestoreLecture={handleRestoreLecture}
              onReorder={handleReorder}
              onEditSection={(s) => store.openEditSectionDialog(s)}
              onPublishSection={handlePublishSection}
              onArchiveSection={handleArchiveSection}
              onDuplicateSection={handleDuplicateSection}
              onDeleteSection={handleDeleteSection}
              onRestoreSection={handleRestoreSection}
              onAddSection={handleAddSection}
              onReorderSections={handleReorderSections}
            />

            <AnimatePresence>
              {navigatorOpen && (
                <motion.div
                  key="navigator-resizer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative w-px shrink-0 cursor-col-resize bg-studio-border transition-colors hover:bg-studio-accent/30"
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="تغيير عرض المستكشف"
                />
              )}
            </AnimatePresence>

            <CourseStudioCanvas
              selectedLecture={selectedLecture}
              selectedSection={selectedSection}
              selectedContent={selectedContent}
              lectureSections={selectedLecture ? sectionsByLecture[selectedLecture.id] : undefined}
              sectionContents={contentItems}
              canvasView={canvasView}
              onCreateLecture={openAddChoice}
              onAddSection={selectedLecture ? () => handleAddSection(selectedLecture.id) : undefined}
              onAddContent={handleAddContent}
              onEditSection={(s) => store.openEditSectionDialog(s)}
              onDuplicateSection={handleDuplicateSection}
              onArchiveSection={handleArchiveSection}
              onDeleteSection={handleDeleteSection}
              onRestoreSection={handleRestoreSection}
              onSelectContent={handleSelectContent}
              onEditContent={handleEditContent}
              onPublishContent={handlePublishContent}
              onArchiveContent={handleArchiveContent}
              onDuplicateContent={handleDuplicateContent}
              onDeleteContent={handleDeleteContent}
              onRestoreContent={handleRestoreContent}
              onToggleFreePreview={instructorMode ? undefined : handleToggleFreePreview}
              onReorderContent={handleReorderContent}
            />

            <AnimatePresence>
              {store.inspectorOpen && (
                <motion.div
                  key="inspector-resizer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative w-px shrink-0 cursor-col-resize bg-studio-border transition-colors hover:bg-studio-accent/30"
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="تغيير عرض الخصائص"
                />
              )}
            </AnimatePresence>

            <CourseStudioInspector
              open={store.inspectorOpen}
              width={inspectorWidth}
              selectedSection={selectedSection}
              selectedContent={selectedContent}
              lectures={lectures}
              onEditSection={(s) => store.openEditSectionDialog(s)}
              onDuplicateSection={handleDuplicateSection}
              onArchiveSection={handleArchiveSection}
              onDeleteSection={handleDeleteSection}
              onRestoreSection={handleRestoreSection}
              onMoveSection={handleMoveSection}
              onClose={handleCloseInspector}
            />
          </>
        )}
      </div>

      <CourseStudioAddItemChoiceDialog
        open={addChoiceOpen}
        onClose={closeAddChoice}
        onSelectLecture={() => store.openCreateDialog()}
        onSelectSession={() => setSessionModulePickerOpen(true)}
      />

      <CourseStudioCreateLectureDialog
        open={store.createDialogOpen}
        onClose={store.closeCreateDialog}
        onSave={handleCreateLecture}
        saving={createLecture.isPending}
        nextOrder={lectures.length}
      />

      {courseId && (
        <CourseStudioSessionPickerDialog
          open={sessionModulePickerOpen}
          courseId={courseId}
          onClose={() => setSessionModulePickerOpen(false)}
          onSelect={handleSessionModuleSelected}
        />
      )}

      <CourseStudioEditLectureDialog
        open={!!store.editLecture}
        lecture={store.editLecture}
        onClose={store.closeEditDialog}
        onSave={handleUpdateLecture}
        saving={updateLecture.isPending}
      />

      <CourseStudioCreateSectionDialog
        open={store.createSectionDialogOpen}
        lectureId={store.createSectionLectureId}
        onClose={store.closeCreateSectionDialog}
        onSave={handleCreateSection}
        saving={createSection.isPending}
        nextOrder={nextSectionOrder}
      />

      <CourseStudioEditSectionDialog
        open={!!store.editSection}
        section={store.editSection}
        onClose={store.closeEditSectionDialog}
        onSave={handleUpdateSection}
        saving={updateSection.isPending}
      />

      <CourseStudioContentPicker
        open={store.contentPickerOpen}
        onOpenChange={(open) => { if (!open) store.closeContentPicker(); }}
        onSelect={handleContentTypeSelected}
      />

      <ExamPicker
        open={store.examPickerOpen}
        onClose={store.closeExamPicker}
        onSelect={handleExamPicked}
        mode="single"
        allowedStatuses={["published", "draft"]}
      />

      <MediaPicker
        open={store.mediaPickerOpen}
        onClose={store.closeMediaPicker}
        onSelect={handleMediaSelected}
        mode="single"
        allowedTypes={MEDIA_PICKER_TYPES[store.mediaPickerContentType ?? "video"]}
        library={libraryForAllowedTypes(MEDIA_PICKER_TYPES[store.mediaPickerContentType ?? "video"])}
      />

      {courseId && (
        <CourseStudioSessionPickerDialog
          open={sessionPickerOpen}
          courseId={courseId}
          onClose={() => setSessionPickerOpen(false)}
          onSelect={handleSessionSelected}
        />
      )}

      <CourseStudioEditContentDialog
        open={!!editContentItem}
        item={editContentItem}
        onClose={() => setEditContentItem(null)}
        onSave={handleSaveContentTitle}
        saving={updateLesson.isPending}
      />

      {courseId && (
        <CourseStudioSessionEditDialog
          open={!!sessionEditId}
          courseId={courseId}
          sessionId={sessionEditId}
          onClose={() => setSessionEditId(null)}
          onSaved={async (session) => {
            setSessionEditId(null);
            // sync linked lesson title if exists
            const linked = contentItems.find((c) => c.courseSessionId === session.id);
            if (linked && store.selectedSectionId) {
              try {
                await updateLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: linked.id, data: { title: session.title } as any });
              } catch {}
            }
          }}
        />
      )}

      <CourseStudioExternalLinkDialog
        open={!!externalEditItem}
        initial={externalEditItem ? { title: externalEditItem.title, external_url: externalEditItem.externalUrl ?? "", short_description: externalEditItem.description ?? "" } : null}
        saving={updateLesson.isPending}
        onClose={() => setExternalEditItem(null)}
        onSave={handleSaveExternalLink}
      />

      <CourseStudioContentDetailsDialog
        open={!!pendingContent}
        type={pendingContent?.contentType ?? (pendingContent?.kind === "exam" ? "exam" : null)}
        defaultTitle={pendingContent?.defaultTitle}
        onClose={() => setPendingContent(null)}
        onSave={handleCreateContent}
        saving={createLesson.isPending || attachVideo.isPending || attachFile.isPending}
      />
    </motion.div>
  );
}

export { CourseStudio };
