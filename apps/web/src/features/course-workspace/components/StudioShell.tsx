"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Clock,
  Copy,
  GraduationCap,
  Layers,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import {
  useCourse,
  usePublishCourse,
  useUpdateCourse,
  useArchiveCourse,
  useRestoreCourse,
  useToggleFeatureCourse,
} from "@/features/courses/hooks";
import {
  useModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  usePublishModule,
  useArchiveModule,
  useDuplicateModule,
} from "@/features/course-modules/hooks";
import {
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  usePublishSection,
  useArchiveSection,
  useDuplicateSection,
} from "@/features/course-sections/hooks";
import {
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  usePublishLesson,
  useArchiveLesson,
  useDuplicateLesson,
} from "@/features/lessons/hooks";
import { lessonsService } from "@/features/lessons/services";
import { LESSONS_QUERY_KEY } from "@/features/lessons/constants";
import { buildModuleTree } from "@/features/course-content/utils";
import { CourseEditDrawer } from "@/features/courses/components/CourseEditDrawer";
import { formatNumber } from "@/lib/format";
import { StudioTopBar } from "./StudioTopBar";
import { NavigatorPanel } from "./NavigatorPanel";
import { DynamicWorkspacePanel } from "./DynamicWorkspacePanel";
import { InspectorPanel } from "./InspectorPanel";
import { InlineCreateDialog } from "./InlineCreateDialog";
import { ContentPickerDialog } from "./ContentPickerDialog";
import { useWorkspaceStore } from "../store";
import type { Lesson } from "@/features/lessons/types";
import type { ContentItemType } from "@/features/course-content/types";
import type { UpdateCoursePayload } from "@/features/courses/types";
import type { UpdateCourseModulePayload } from "@/features/course-modules/types";
import type { UpdateCourseSectionPayload } from "@/features/course-sections/types";
import type { UpdateLessonPayload } from "@/features/lessons/types";
import type { ContentItem, NodeMenuItem, SelectedNode, StudioLecture, StudioSection } from "../types";

/** Load all lessons for every section of the course so the tree is complete. */
function useAllCourseLessons(courseId: string | null, sections: Array<{ id: string }>) {
  return useQuery({
    queryKey: [LESSONS_QUERY_KEY, "course-all", courseId, sections.map((s) => s.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        sections.map((section) =>
          lessonsService.list(courseId!, section.id).then((res) => ({
            sectionId: section.id,
            lessons: res.data,
          })),
        ),
      );
      const map = new Map<string, Lesson[]>();
      results.forEach(({ sectionId, lessons }) => map.set(sectionId, lessons));
      return map;
    },
    enabled: !!courseId && sections.length > 0,
  });
}

const CONTENT_TYPE_TO_LESSON: Record<string, "video" | "text" | "pdf" | "external" | "live"> = {
  video: "video",
  pdf: "pdf",
  external_link: "external",
  live: "live",
  resource: "text",
  audio: "text",
  exam: "text",
  assignment: "text",
  scorm: "text",
};

/**
 * Course Studio v4 shell.
 * Wires the Navigator (explorer tree), the dynamic workspace canvas and the
 * contextual Inspector together over the live course/modules/sections/lessons APIs.
 */
function StudioShell() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: modulesData, isLoading: modulesLoading } = useModules(courseId);
  const { data: sectionsData, isLoading: sectionsLoading } = useSections(courseId);

  const publishCourse = usePublishCourse();
  const updateCourse = useUpdateCourse();
  const archiveCourse = useArchiveCourse();
  const restoreCourse = useRestoreCourse();
  const toggleFeatureCourse = useToggleFeatureCourse();

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const publishModule = usePublishModule();
  const archiveModule = useArchiveModule();
  const duplicateModule = useDuplicateModule();

  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const publishSection = usePublishSection();
  const archiveSection = useArchiveSection();
  const duplicateSection = useDuplicateSection();

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const publishLesson = usePublishLesson();
  const archiveLesson = useArchiveLesson();
  const duplicateLesson = useDuplicateLesson();

  const {
    selectedType,
    selectedId,
    select,
    leftPanelOpen,
    rightPanelOpen,
    leftPanelWidth,
    rightPanelWidth,
    toggleLeftPanel,
    toggleRightPanel,
    setLeftPanelWidth,
    setRightPanelWidth,
  } = useWorkspaceStore();

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [lectureDialogOpen, setLectureDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [sectionTargetLectureId, setSectionTargetLectureId] = useState<string | null>(null);
  const [contentPickerOpen, setContentPickerOpen] = useState(false);
  const [pickerTargetSectionId, setPickerTargetSectionId] = useState<string | null>(null);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const modules = useMemo(() => modulesData?.data ?? [], [modulesData]);
  const sections = useMemo(() => sectionsData?.data ?? [], [sectionsData]);
  const { data: lessonsMap } = useAllCourseLessons(courseId, sections);

  const moduleTree = useMemo(
    () => buildModuleTree(modules, sections, (sectionId) => lessonsMap?.get(sectionId) ?? []),
    [modules, sections, lessonsMap],
  );

  /* Resolve the store selection against the current tree. */
  const selected = useMemo<SelectedNode | null>(() => {
    if (!selectedType) return null;
    if (selectedType === "course") return { type: "course" };
    for (const lecture of moduleTree) {
      if (selectedType === "lecture" && lecture.id === selectedId) {
        return { type: "lecture", lecture };
      }
      for (const section of lecture.sections) {
        if (selectedType === "section" && section.id === selectedId) {
          return { type: "section", lecture, section };
        }
        for (const item of section.items) {
          if (selectedType === "content" && item.id === selectedId) {
            return { type: "content", lecture, section, item };
          }
        }
      }
    }
    return null;
  }, [selectedType, selectedId, moduleTree]);

  const view = useMemo(() => {
    if (!selected) return null;
    if (selected.type === "lecture") return { type: "lecture" as const, data: selected.lecture };
    if (selected.type === "section") return { type: "section" as const, data: selected.section };
    if (selected.type === "content") return { type: "item" as const, data: selected.item };
    return null;
  }, [selected]);

  /* Default to the course overview when nothing is selected. */
  useEffect(() => {
    if (!selectedType && courseId) select("course", courseId);
  }, [selectedType, courseId, select]);

  /* ------------------------------ course actions ------------------------------ */

  const handlePublishCourse = useCallback(() => {
    publishCourse.mutate(courseId, {
      onSuccess: () => toast.success("تم نشر الدورة بنجاح"),
      onError: (err: any) => toast.error(err?.response?.data?.message || "فشل النشر"),
    });
  }, [publishCourse, courseId]);

  const handleUpdateCourse = useCallback(
    (data: UpdateCoursePayload) => {
      updateCourse.mutate(
        { id: courseId, data },
        {
          onSuccess: () => toast.success("تم حفظ التغييرات"),
          onError: (err: any) => toast.error(err?.response?.data?.message || "فشل الحفظ"),
        },
      );
    },
    [updateCourse, courseId],
  );

  const handleShare = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("تم نسخ الرابط");
  }, []);

  /* ------------------------------ create actions ------------------------------ */

  const handleCreateLecture = useCallback(
    ({ title, slug }: { title: string; slug?: string }) => {
      createModule.mutate(
        { courseId, data: { title, slug } as any },
        {
          onSuccess: () => {
            setLectureDialogOpen(false);
            toast.success("تم إنشاء المحاضرة بنجاح");
          },
          onError: (err: any) => toast.error(err?.response?.data?.message || "فشل إنشاء المحاضرة"),
        },
      );
    },
    [createModule, courseId],
  );

  const handleOpenSectionDialog = useCallback((lectureId: string) => {
    setSectionTargetLectureId(lectureId);
    setSectionDialogOpen(true);
  }, []);

  const handleCreateSection = useCallback(
    ({ title, slug }: { title: string; slug?: string }) => {
      if (!sectionTargetLectureId) return;
      createSection.mutate(
        { courseId, data: { title, slug, course_module_id: sectionTargetLectureId } as any },
        {
          onSuccess: () => {
            setSectionDialogOpen(false);
            setSectionTargetLectureId(null);
            toast.success("تم إنشاء القسم بنجاح");
          },
          onError: (err: any) => toast.error(err?.response?.data?.message || "فشل إنشاء القسم"),
        },
      );
    },
    [createSection, courseId, sectionTargetLectureId],
  );

  const handleOpenContentPicker = useCallback((sectionId: string) => {
    setPickerTargetSectionId(sectionId);
    setContentPickerOpen(true);
  }, []);

  const handleAddContent = useCallback(
    (type: ContentItemType) => {
      if (!pickerTargetSectionId) return;
      createLesson.mutate(
        {
          courseId,
          sectionId: pickerTargetSectionId,
          data: {
            title: "محتوى جديد",
            lesson_type: CONTENT_TYPE_TO_LESSON[type] ?? "text",
            short_description: "",
            visibility: "private",
          } as any,
        },
        {
          onSuccess: () => {
            toast.success("تم إضافة المحتوى بنجاح");
            setContentPickerOpen(false);
            setPickerTargetSectionId(null);
          },
          onError: (err: any) => toast.error(err?.response?.data?.message || "فشل إضافة المحتوى"),
        },
      );
    },
    [createLesson, courseId, pickerTargetSectionId],
  );

  /* ------------------------------ inspector updates ------------------------------ */

  const handleUpdateLecture = useCallback(
    (id: string, data: UpdateCourseModulePayload) => {
      updateModule.mutate(
        { courseId, id, data },
        {
          onSuccess: () => toast.success("تم حفظ المحاضرة"),
          onError: (err: any) => toast.error(err?.response?.data?.message || "فشل الحفظ"),
        },
      );
    },
    [updateModule, courseId],
  );

  const handleUpdateSection = useCallback(
    (id: string, data: UpdateCourseSectionPayload) => {
      updateSection.mutate(
        { courseId, id, data },
        {
          onSuccess: () => toast.success("تم حفظ القسم"),
          onError: (err: any) => toast.error(err?.response?.data?.message || "فشل الحفظ"),
        },
      );
    },
    [updateSection, courseId],
  );

  const handleUpdateContent = useCallback(
    (sectionId: string, id: string, data: UpdateLessonPayload) => {
      updateLesson.mutate(
        { courseId, sectionId, id, data },
        {
          onSuccess: () => toast.success("تم حفظ المحتوى"),
          onError: (err: any) => toast.error(err?.response?.data?.message || "فشل الحفظ"),
        },
      );
    },
    [updateLesson, courseId],
  );

  /* ------------------------------ node context menus ------------------------------ */

  const lectureMenu = useCallback(
    (lecture: StudioLecture): NodeMenuItem[] => [
      {
        key: "rename",
        label: "إعادة تسمية",
        icon: Pencil,
        permission: "courses.update",
        onSelect: () => {
          const title = window.prompt("عنوان المحاضرة:", lecture.title);
          if (title && title.trim() && title !== lecture.title) {
            updateModule.mutate({ courseId, id: lecture.id, data: { title: title.trim() } });
          }
        },
      },
      {
        key: "duplicate",
        label: "نسخ",
        icon: Copy,
        permission: "courses.create",
        onSelect: () => duplicateModule.mutate({ courseId, id: lecture.id }),
      },
      {
        key: "publish",
        label: "نشر",
        icon: Send,
        permission: "courses.update",
        onSelect: () => publishModule.mutate({ courseId, id: lecture.id }),
      },
      {
        key: "archive",
        label: "أرشفة",
        icon: Archive,
        permission: "courses.update",
        onSelect: () => archiveModule.mutate({ courseId, id: lecture.id }),
      },
      {
        key: "delete",
        label: "حذف",
        icon: Trash2,
        destructive: true,
        permission: "courses.delete",
        onSelect: () => {
          if (window.confirm(`حذف المحاضرة \"${lecture.title}\"؟`)) {
            deleteModule.mutate({ courseId, id: lecture.id });
          }
        },
      },
    ],
    [courseId, updateModule, duplicateModule, publishModule, archiveModule, deleteModule],
  );

  const sectionMenu = useCallback(
    (section: StudioSection): NodeMenuItem[] => [
      {
        key: "rename",
        label: "إعادة تسمية",
        icon: Pencil,
        permission: "courses.update",
        onSelect: () => {
          const title = window.prompt("عنوان القسم:", section.title);
          if (title && title.trim() && title !== section.title) {
            updateSection.mutate({ courseId, id: section.id, data: { title: title.trim() } });
          }
        },
      },
      {
        key: "duplicate",
        label: "نسخ",
        icon: Copy,
        permission: "courses.create",
        onSelect: () => duplicateSection.mutate({ courseId, id: section.id }),
      },
      {
        key: "publish",
        label: "نشر",
        icon: Send,
        permission: "courses.update",
        onSelect: () => publishSection.mutate({ courseId, id: section.id }),
      },
      {
        key: "archive",
        label: "أرشفة",
        icon: Archive,
        permission: "courses.update",
        onSelect: () => archiveSection.mutate({ courseId, id: section.id }),
      },
      {
        key: "delete",
        label: "حذف",
        icon: Trash2,
        destructive: true,
        permission: "courses.delete",
        onSelect: () => {
          if (window.confirm(`حذف القسم \"${section.title}\"؟`)) {
            deleteSection.mutate({ courseId, id: section.id });
          }
        },
      },
    ],
    [courseId, updateSection, duplicateSection, publishSection, archiveSection, deleteSection],
  );

  const contentMenu = useCallback(
    (item: ContentItem, section: StudioSection): NodeMenuItem[] => [
      {
        key: "rename",
        label: "إعادة تسمية",
        icon: Pencil,
        permission: "courses.update",
        onSelect: () => {
          const title = window.prompt("عنوان المحتوى:", item.title);
          if (title && title.trim() && title !== item.title) {
            updateLesson.mutate({ courseId, sectionId: section.id, id: item.id, data: { title: title.trim() } });
          }
        },
      },
      {
        key: "duplicate",
        label: "نسخ",
        icon: Copy,
        permission: "courses.create",
        onSelect: () => duplicateLesson.mutate({ courseId, sectionId: section.id, id: item.id }),
      },
      {
        key: "publish",
        label: "نشر",
        icon: Send,
        permission: "courses.update",
        onSelect: () => publishLesson.mutate({ courseId, sectionId: section.id, id: item.id }),
      },
      {
        key: "archive",
        label: "أرشفة",
        icon: Archive,
        permission: "courses.update",
        onSelect: () => archiveLesson.mutate({ courseId, sectionId: section.id, id: item.id }),
      },
      {
        key: "delete",
        label: "حذف",
        icon: Trash2,
        destructive: true,
        permission: "courses.delete",
        onSelect: () => {
          if (window.confirm(`حذف \"${item.title}\"؟`)) {
            deleteLesson.mutate({ courseId, sectionId: section.id, id: item.id });
          }
        },
      },
    ],
    [courseId, updateLesson, duplicateLesson, publishLesson, archiveLesson, deleteLesson],
  );

  /* ------------------------------ panel resizing & shortcuts ------------------------------ */

  useEffect(() => {
    if (!isResizingLeft && !isResizingRight) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) setLeftPanelWidth(Math.max(240, Math.min(480, e.clientX)));
      if (isResizingRight) setRightPanelWidth(Math.max(260, Math.min(480, window.innerWidth - e.clientX)));
    };
    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingLeft, isResizingRight, setLeftPanelWidth, setRightPanelWidth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleLeftPanel();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        toggleRightPanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleLeftPanel, toggleRightPanel]);

  const totalLectures = moduleTree.length;
  const totalContent = moduleTree.reduce(
    (sum, m) => sum + m.sections.reduce((s, sec) => s + sec.items.length, 0),
    0,
  );
  const totalDuration = moduleTree.reduce(
    (sum, m) => sum + (m.durationMinutes ?? 0) + m.sections.reduce((s, sec) => s + (sec.durationMinutes ?? 0), 0),
    0,
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <StudioTopBar
        course={course}
        courseLoading={courseLoading}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        showPanelToggles
        onToggleLeftPanel={toggleLeftPanel}
        onToggleRightPanel={toggleRightPanel}
        onEdit={() => setEditDrawerOpen(true)}
        onShare={handleShare}
        onPublish={handlePublishCourse}
        publishPending={publishCourse.isPending}
      />

      {/* Compact metrics strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex shrink-0 items-center gap-6 border-b border-border/20 bg-muted/10 px-5 py-2 text-xs text-muted-foreground/60"
      >
        <span className="flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" />
          {totalLectures} محاضرات
        </span>
        <span className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          {totalContent} محتوى
        </span>
        {totalDuration > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {totalDuration} د
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {formatNumber(course?.studentsCount ?? 0)} طالب
        </span>
        <div className="me-auto" />
        {course?.featured && (
          <span className="flex items-center gap-1 text-amber-500">
            <Sparkles className="h-3 w-3" />
            مميزة
          </span>
        )}
      </motion.div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Navigator (explorer tree) */}
        <AnimatePresence initial={false}>
          {leftPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, minWidth: 0 }}
              animate={{ width: leftPanelWidth, opacity: 1, minWidth: leftPanelWidth }}
              exit={{ width: 0, opacity: 0, minWidth: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="shrink-0 overflow-hidden border-e border-border/30 bg-muted/5"
            >
              <div style={{ width: leftPanelWidth }} className="flex h-full flex-col">
                <NavigatorPanel
                  course={course}
                  loading={courseLoading || modulesLoading || sectionsLoading}
                  tree={moduleTree}
                  onAddLecture={() => setLectureDialogOpen(true)}
                  onAddSection={handleOpenSectionDialog}
                  onAddContent={handleOpenContentPicker}
                  lectureMenu={lectureMenu}
                  sectionMenu={(section) => sectionMenu(section)}
                  contentMenu={(item, section) => contentMenu(item, section)}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {leftPanelOpen && (
          <div
            className="relative w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-primary/20 active:bg-primary/30"
            onMouseDown={() => setIsResizingLeft(true)}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        {/* Dynamic workspace canvas */}
        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          <DynamicWorkspacePanel
            view={view}
            course={course}
            courseLoading={courseLoading}
            onAddLecture={() => setLectureDialogOpen(true)}
            totalModules={totalLectures}
          />
        </div>

        {rightPanelOpen && (
          <div
            className="relative w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-primary/20 active:bg-primary/30"
            onMouseDown={() => setIsResizingRight(true)}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        {/* Contextual inspector */}
        <AnimatePresence initial={false}>
          {rightPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, minWidth: 0 }}
              animate={{ width: rightPanelWidth, opacity: 1, minWidth: rightPanelWidth }}
              exit={{ width: 0, opacity: 0, minWidth: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="shrink-0 overflow-hidden border-s border-border/30 bg-muted/5"
            >
              <div style={{ width: rightPanelWidth }} className="flex h-full flex-col overflow-y-auto p-4">
                <InspectorPanel
                  course={course}
                  selected={selected}
                  onUpdateCourse={handleUpdateCourse}
                  onToggleFeatureCourse={() => toggleFeatureCourse.mutate(courseId)}
                  onPublishCourse={handlePublishCourse}
                  onArchiveCourse={() => archiveCourse.mutate(courseId)}
                  onRestoreCourse={() => restoreCourse.mutate(courseId)}
                  coursePending={updateCourse.isPending || publishCourse.isPending}
                  onUpdateLecture={handleUpdateLecture}
                  lecturePending={updateModule.isPending}
                  onUpdateSection={handleUpdateSection}
                  sectionPending={updateSection.isPending}
                  onUpdateContent={handleUpdateContent}
                  contentPending={updateLesson.isPending}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <InlineCreateDialog
        open={lectureDialogOpen}
        onOpenChange={setLectureDialogOpen}
        heading="محاضرة جديدة"
        titleLabel="عنوان المحاضرة"
        description="أضف محاضرة جديدة إلى منهج الدورة"
        pending={createModule.isPending}
        onSubmit={handleCreateLecture}
      />

      <InlineCreateDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        heading="قسم جديد"
        titleLabel="عنوان القسم"
        description="أضف قسماً جديداً داخل المحاضرة"
        pending={createSection.isPending}
        onSubmit={handleCreateSection}
      />

      <ContentPickerDialog
        open={contentPickerOpen}
        onOpenChange={setContentPickerOpen}
        onSelect={handleAddContent}
      />

      <CourseEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        courseId={courseId}
        onSave={(id, data) => handleUpdateCourse(data)}
        saving={updateCourse.isPending}
        categories={[]}
      />
    </div>
  );
}

export { StudioShell };
