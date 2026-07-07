"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Eye,
  Send,
  Pencil,
  Share2,
  Users,
  TrendingUp,
  Settings,
  Star,
  FileText,
  Activity,
  Search,
  PanelLeftClose,
  PanelRightClose,
  PanelRight,
  Plus,
  Layers,
  BookOpen,
  Clock,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { AppBreadcrumb, AppDialog, AppDialogContent, AppDialogHeader, AppDialogTitle, AppInput, AppButton, PermissionGuard } from "@/components/ui";
import { useCourse, usePublishCourse, useUpdateCourse } from "@/features/courses/hooks";
import { useModules, useCreateModule, useUpdateModule, useDeleteModule, usePublishModule, useArchiveModule, useDuplicateModule } from "@/features/course-modules/hooks";
import { useSections, useCreateSection, useUpdateSection, useDeleteSection, usePublishSection, useArchiveSection, useDuplicateSection } from "@/features/course-sections/hooks";
import { useCreateLesson, useDeleteLesson, usePublishLesson, useArchiveLesson, useDuplicateLesson } from "@/features/lessons/hooks";
import { lessonsService } from "@/features/lessons/services";
import { LESSONS_QUERY_KEY } from "@/features/lessons/constants";
import { CourseEditDrawer } from "@/features/courses/components/CourseEditDrawer";
import { WorkspaceExplorer } from "./WorkspaceExplorer";
import { WorkspaceEditor } from "./WorkspaceEditor";
import { WorkspaceInspector } from "./WorkspaceInspector";
import { ContentPickerDialog } from "./ContentPickerDialog";
import { useWorkspaceStore } from "../store";
import { buildModuleTree } from "@/features/course-content/utils";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { UpdateCoursePayload } from "@/features/courses/types";
import type { CourseModule, CourseModuleSection, ContentItem } from "@/features/course-content/types";
import type { ContentItemType } from "@/features/course-content/types";
import type { Lesson } from "@/features/lessons/types";

function useAllCourseLessons(courseId: string | null, sections: Array<{ id: string }>) {
  return useQuery({
    queryKey: [LESSONS_QUERY_KEY, "course-all", courseId],
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

function CourseWorkspaceShell() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: modulesData, isLoading: modulesLoading } = useModules(courseId);
  const { data: sectionsData, isLoading: sectionsLoading } = useSections(courseId);
  const publishCourse = usePublishCourse();
  const updateCourse = useUpdateCourse();
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
  const deleteLesson = useDeleteLesson();
  const publishLesson = usePublishLesson();
  const archiveLesson = useArchiveLesson();
  const duplicateLesson = useDuplicateLesson();

  const {
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
  const [contentPickerOpen, setContentPickerOpen] = useState(false);
  const [pickerTargetSectionId, setPickerTargetSectionId] = useState<string | null>(null);
  const [createLectureDialogOpen, setCreateLectureDialogOpen] = useState(false);
  const [createLectureTitle, setCreateLectureTitle] = useState("");
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const modules = useMemo(() => modulesData?.data ?? [], [modulesData]);
  const sections = useMemo(() => sectionsData?.data ?? [], [sectionsData]);

  const { data: lessonsMap } = useAllCourseLessons(courseId, sections);

  const moduleTree = useMemo(() => {
    return buildModuleTree(modules, sections, (sectionId) => lessonsMap?.get(sectionId) ?? []);
  }, [modules, sections, lessonsMap]);

  const handlePublish = useCallback(() => {
    publishCourse.mutate(courseId, {
      onSuccess: () => toast.success("تم نشر الدورة بنجاح"),
      onError: (err: any) => toast.error(err?.response?.data?.message || "فشل النشر"),
    });
  }, [publishCourse, courseId]);

  const handlePreview = useCallback(() => {
    window.open(`/courses/${courseId}/preview`, "_blank");
  }, [courseId]);

  const handleShare = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("تم نسخ الرابط");
  }, []);

  const handleEditSave = useCallback(
    (id: string, data: UpdateCoursePayload) => {
      updateCourse.mutate({ id, data }, { onSuccess: () => setEditDrawerOpen(false) });
    },
    [updateCourse],
  );

  const handleAddLecture = useCallback(() => {
    setCreateLectureTitle("");
    setCreateLectureDialogOpen(true);
  }, []);

  const handleCreateLecture = useCallback(() => {
    if (!createLectureTitle.trim()) return;
    createModule.mutate(
      { courseId, data: { title: createLectureTitle.trim() } },
      {
        onSuccess: () => {
          setCreateLectureDialogOpen(false);
          setCreateLectureTitle("");
          toast.success("تم إنشاء المحاضرة بنجاح");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "فشل إنشاء المحاضرة");
        },
      },
    );
  }, [createModule, courseId, createLectureTitle]);

  const handleAddSection = useCallback(
    (lectureId: string) => {
      createSection.mutate(
        {
          courseId,
          data: {
            title: "قسم جديد",
            course_module_id: lectureId,
          } as any,
        },
        {
          onSuccess: () => toast.success("تم إنشاء القسم بنجاح"),
          onError: (err: any) => toast.error(err?.response?.data?.message || "فشل إنشاء القسم"),
        },
      );
    },
    [createSection, courseId],
  );

  const handleOpenContentPicker = useCallback((sectionId: string) => {
    setPickerTargetSectionId(sectionId);
    setContentPickerOpen(true);
  }, []);

  const handleAddContent = useCallback(
    (type: ContentItemType) => {
      if (!pickerTargetSectionId) return;
      const typeToLesson: Record<string, "video" | "text" | "pdf" | "external" | "live"> = {
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
      createLesson.mutate(
        {
          courseId,
          sectionId: pickerTargetSectionId,
          data: {
            title: "محتوى جديد",
            lesson_type: typeToLesson[type] ?? "text",
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

  const handleEditLecture = useCallback(
    (lecture: CourseModule) => {
      const newTitle = window.prompt("عنوان المحاضرة:", lecture.title);
      if (newTitle && newTitle.trim() && newTitle !== lecture.title) {
        updateModule.mutate({ courseId, id: lecture.id, data: { title: newTitle.trim() } });
      }
    },
    [updateModule, courseId],
  );

  const handleDuplicateLecture = useCallback(
    (lecture: CourseModule) => {
      duplicateModule.mutate({ courseId, id: lecture.id });
    },
    [duplicateModule, courseId],
  );

  const handlePublishLecture = useCallback(
    (lecture: CourseModule) => {
      publishModule.mutate({ courseId, id: lecture.id });
    },
    [publishModule, courseId],
  );

  const handleArchiveLecture = useCallback(
    (lecture: CourseModule) => {
      archiveModule.mutate({ courseId, id: lecture.id });
    },
    [archiveModule, courseId],
  );

  const handleDeleteLecture = useCallback(
    (lecture: CourseModule) => {
      if (window.confirm(`حذف المحاضرة "${lecture.title}"؟`)) {
        deleteModule.mutate({ courseId, id: lecture.id });
      }
    },
    [deleteModule, courseId],
  );

  const handleEditSection = useCallback(
    (section: CourseModuleSection) => {
      const newTitle = window.prompt("عنوان القسم:", section.title);
      if (newTitle && newTitle.trim() && newTitle !== section.title) {
        updateSection.mutate({ courseId, id: section.id, data: { title: newTitle.trim() } });
      }
    },
    [updateSection, courseId],
  );

  const handleDuplicateSection = useCallback(
    (section: CourseModuleSection) => {
      duplicateSection.mutate({ courseId, id: section.id });
    },
    [duplicateSection, courseId],
  );

  const handlePublishSection = useCallback(
    (section: CourseModuleSection) => {
      publishSection.mutate({ courseId, id: section.id });
    },
    [publishSection, courseId],
  );

  const handleArchiveSection = useCallback(
    (section: CourseModuleSection) => {
      archiveSection.mutate({ courseId, id: section.id });
    },
    [archiveSection, courseId],
  );

  const handleDeleteSection = useCallback(
    (section: CourseModuleSection) => {
      if (window.confirm(`حذف القسم "${section.title}"؟`)) {
        deleteSection.mutate({ courseId, id: section.id });
      }
    },
    [deleteSection, courseId],
  );

  const handleLeftMouseDown = useCallback(() => {
    setIsResizingLeft(true);
  }, []);

  const handleRightMouseDown = useCallback(() => {
    setIsResizingRight(true);
  }, []);

  useEffect(() => {
    if (!isResizingLeft && !isResizingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        setLeftPanelWidth(Math.max(240, Math.min(480, e.clientX)));
      }
      if (isResizingRight) {
        setRightPanelWidth(Math.max(240, Math.min(420, window.innerWidth - e.clientX)));
      }
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
  const totalContent = moduleTree.reduce((sum, m) => sum + m.sections.reduce((s, sec) => s + sec.items.length, 0), 0);
  const totalDuration = moduleTree.reduce((sum, m) => sum + (m.durationMinutes ?? 0) + m.sections.reduce((s, sec) => s + (sec.durationMinutes ?? 0), 0), 0);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/40 px-6 py-2.5 flex items-center justify-between gap-4 z-30"
      >
        <div className="flex items-center gap-3">
          <AppBreadcrumb
            items={[
              { label: "الدورات", href: "/courses" },
              { label: courseLoading ? "..." : (course?.title ?? ""), href: "#" },
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLeftPanel}
            className={cn(
              "p-2 rounded-lg transition-all",
              leftPanelOpen
                ? "text-primary bg-primary/10"
                : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/30",
            )}
            aria-label={leftPanelOpen ? "إخفاء المستكشف" : "إظهار المستكشف"}
            title={leftPanelOpen ? "إخفاء المستكشف (Cmd+B)" : "إظهار المستكشف (Cmd+B)"}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-border/40 mx-1" />

          <PermissionGuard permission="courses.update">
            <button onClick={() => setEditDrawerOpen(true)} className="p-2 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-colors" aria-label="تعديل">
              <Pencil className="h-4 w-4" />
            </button>
          </PermissionGuard>
          <button onClick={handlePreview} className="p-2 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-colors" aria-label="معاينة">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={handleShare} className="p-2 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-colors" aria-label="مشاركة">
            <Share2 className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-border/40 mx-1" />

          <button
            onClick={toggleRightPanel}
            className={cn(
              "p-2 rounded-lg transition-all",
              rightPanelOpen
                ? "text-primary bg-primary/10"
                : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/30",
            )}
            aria-label={rightPanelOpen ? "إخفاء المفتش" : "إظهار المفتش"}
            title={rightPanelOpen ? "إخفاء المفتش (Cmd+I)" : "إظهار المفتش (Cmd+I)"}
          >
            <PanelRight className="h-4 w-4" />
          </button>

          <PermissionGuard permission="courses.update">
            {course?.status !== "published" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePublish}
                disabled={publishCourse.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-emerald-50 text-xs font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                نشر
              </motion.button>
            )}
          </PermissionGuard>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="shrink-0 bg-muted/10 border-b border-border/20 px-6 py-2 flex items-center gap-6 text-xs text-muted-foreground/60"
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AnimatePresence initial={false}>
          {leftPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, minWidth: 0 }}
              animate={{ width: leftPanelWidth, opacity: 1, minWidth: leftPanelWidth }}
              exit={{ width: 0, opacity: 0, minWidth: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="shrink-0 border-e border-border/30 bg-muted/5 overflow-hidden"
            >
              <div style={{ width: leftPanelWidth }} className="h-full flex flex-col">
                <WorkspaceExplorer
                  course={course}
                  courseLoading={courseLoading}
                  modules={moduleTree}
                  modulesLoading={modulesLoading || sectionsLoading}
                  sectionsCount={sections.length}
                  lessonsCount={totalContent}
                  onAddLecture={handleAddLecture}
                  onAddSection={handleAddSection}
                  onAddContent={handleOpenContentPicker}
                  onEditLecture={handleEditLecture}
                  onDuplicateLecture={handleDuplicateLecture}
                  onPublishLecture={handlePublishLecture}
                  onArchiveLecture={handleArchiveLecture}
                  onDeleteLecture={handleDeleteLecture}
                  onEditSection={handleEditSection}
                  onDuplicateSection={handleDuplicateSection}
                  onPublishSection={handlePublishSection}
                  onArchiveSection={handleArchiveSection}
                  onDeleteSection={handleDeleteSection}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {leftPanelOpen && (
          <div
            className="w-1 shrink-0 bg-transparent hover:bg-primary/20 active:bg-primary/30 transition-colors cursor-col-resize relative group"
            onMouseDown={handleLeftMouseDown}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        <div className="flex-1 min-w-0 overflow-hidden">
          <WorkspaceEditor
            course={course}
            courseLoading={courseLoading}
            moduleTree={moduleTree}
            totalModules={totalLectures}
            onAddLecture={handleAddLecture}
          />
        </div>

        {rightPanelOpen && (
          <div
            className="w-1 shrink-0 bg-transparent hover:bg-primary/20 active:bg-primary/30 transition-colors cursor-col-resize relative group"
            onMouseDown={handleRightMouseDown}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        <AnimatePresence initial={false}>
          {rightPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, minWidth: 0 }}
              animate={{ width: rightPanelWidth, opacity: 1, minWidth: rightPanelWidth }}
              exit={{ width: 0, opacity: 0, minWidth: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="shrink-0 border-s border-border/30 bg-muted/5 overflow-hidden"
            >
              <div style={{ width: rightPanelWidth }} className="h-full flex flex-col">
                <WorkspaceInspector course={course} moduleTree={moduleTree} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <AppDialog open={createLectureDialogOpen} onOpenChange={setCreateLectureDialogOpen}>
        <AppDialogContent className="sm:max-w-md">
          <AppDialogHeader>
            <AppDialogTitle>إضافة محاضرة جديدة</AppDialogTitle>
          </AppDialogHeader>
          <div className="space-y-4 p-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground/70">عنوان المحاضرة</label>
              <AppInput
                value={createLectureTitle}
                onChange={(e) => setCreateLectureTitle(e.target.value)}
                placeholder="أدخل عنوان المحاضرة"
                autoFocus
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter") handleCreateLecture();
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/40">
                سيتم إنشاء slugs تلقائياً
              </span>
              <div className="flex items-center gap-2">
                <AppButton variant="ghost" size="sm" onClick={() => setCreateLectureDialogOpen(false)}>
                  إلغاء
                </AppButton>
                <AppButton
                  size="sm"
                  onClick={handleCreateLecture}
                  disabled={!createLectureTitle.trim() || createModule.isPending}
                  loading={createModule.isPending}
                >
                  إنشاء
                </AppButton>
              </div>
            </div>
          </div>
        </AppDialogContent>
      </AppDialog>

      <ContentPickerDialog
        open={contentPickerOpen}
        onOpenChange={setContentPickerOpen}
        onSelect={handleAddContent}
      />

      <CourseEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        courseId={courseId}
        onSave={handleEditSave}
        saving={updateCourse.isPending}
        categories={[]}
      />
    </div>
  );
}

export { CourseWorkspaceShell };
