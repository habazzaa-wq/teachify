"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Download } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppSection,
  AppDivider,
  AppButton,
} from "@/components/ui";
import {
  useLessons,
  useLessonsMetrics,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  usePublishLesson,
  useArchiveLesson,
  useToggleFeatureLesson,
  useToggleFreePreview,
  useRestoreLesson,
  useDuplicateLesson,
  useExportLessons,
} from "@/features/lessons/hooks";
import { LessonMetricCards } from "@/features/lessons/components/LessonMetricCards";
import { LessonsToolbar } from "@/features/lessons/components/LessonsToolbar";
import { LessonsTable } from "@/features/lessons/components/LessonsTable";
import { LessonCreateDrawer } from "@/features/lessons/components/LessonCreateDrawer";
import { LessonEditDrawer } from "@/features/lessons/components/LessonEditDrawer";
import { LessonDetailsDrawer } from "@/features/lessons/components/LessonDetailsDrawer";
import { LessonDeleteDialog } from "@/features/lessons/components/LessonDeleteDialog";
import { LessonEmptyState } from "@/features/lessons/components/LessonEmptyState";
import { LessonLoadingState } from "@/features/lessons/components/LessonLoadingState";
import { LessonErrorState } from "@/features/lessons/components/LessonErrorState";
import type { Lesson, LessonStatus, LessonVisibility, LessonType, LessonSort, CreateLessonPayload, UpdateLessonPayload } from "@/features/lessons/types";

function LessonsPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id");
  const sectionId = searchParams.get("section_id");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LessonStatus | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<LessonVisibility | "all">("all");
  const [lessonTypeFilter, setLessonTypeFilter] = useState<LessonType | "all">("all");
  const [featuredFilter, setFeaturedFilter] = useState<boolean | "all">("all");
  const [sort, setSort] = useState("sort_order");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);

  const params = useMemo(() => ({
    search,
    status: statusFilter,
    visibility: visibilityFilter,
    lesson_type: lessonTypeFilter,
    featured: featuredFilter,
    sort: sort as LessonSort,
  }), [search, statusFilter, visibilityFilter, lessonTypeFilter, featuredFilter, sort]);

  const lessonsQuery = useLessons(courseId, sectionId, params);
  const metricsQuery = useLessonsMetrics(courseId ?? undefined, sectionId ?? undefined);
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const publishLesson = usePublishLesson();
  const archiveLesson = useArchiveLesson();
  const toggleFeatureLesson = useToggleFeatureLesson();
  const toggleFreePreview = useToggleFreePreview();
  const restoreLesson = useRestoreLesson();
  const duplicateLesson = useDuplicateLesson();
  const exportLessons = useExportLessons();

  const lessons = lessonsQuery.data?.data ?? [];
  const isLoading = lessonsQuery.isLoading || metricsQuery.isLoading;
  const isError = lessonsQuery.isError;
  const isEmpty = lessons.length === 0 && !search && statusFilter === "all";

  const openCreateDrawer = useCallback(() => setCreateDrawerOpen(true), []);

  const openViewDrawer = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setDetailsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setEditDrawerOpen(true);
  }, []);

  const handleCreateSave = useCallback(
    (data: CreateLessonPayload) => {
      if (!courseId || !sectionId) return;
      createLesson.mutate({ courseId, sectionId, data }, {
        onSuccess: () => setCreateDrawerOpen(false),
      });
    },
    [courseId, sectionId, createLesson],
  );

  const handleEditSave = useCallback(
    (data: UpdateLessonPayload) => {
      if (!selectedLesson) return;
      updateLesson.mutate({
        courseId: selectedLesson.courseId,
        sectionId: selectedLesson.sectionId,
        id: selectedLesson.id,
        data,
      }, {
        onSuccess: () => setEditDrawerOpen(false),
      });
    },
    [selectedLesson, updateLesson],
  );

  const handlePublish = useCallback(
    (lesson: Lesson) => publishLesson.mutate({ courseId: lesson.courseId, sectionId: lesson.sectionId, id: lesson.id }),
    [publishLesson],
  );

  const handleArchive = useCallback(
    (lesson: Lesson) => archiveLesson.mutate({ courseId: lesson.courseId, sectionId: lesson.sectionId, id: lesson.id }),
    [archiveLesson],
  );

  const handleToggleFeature = useCallback(
    (lesson: Lesson) => toggleFeatureLesson.mutate({ courseId: lesson.courseId, sectionId: lesson.sectionId, id: lesson.id }),
    [toggleFeatureLesson],
  );

  const handleToggleFreePreview = useCallback(
    (lesson: Lesson) => toggleFreePreview.mutate({ courseId: lesson.courseId, sectionId: lesson.sectionId, id: lesson.id }),
    [toggleFreePreview],
  );

  const handleRestore = useCallback(
    (lesson: Lesson) => restoreLesson.mutate({ courseId: lesson.courseId, sectionId: lesson.sectionId, id: lesson.id }),
    [restoreLesson],
  );

  const handleDuplicate = useCallback(
    (lesson: Lesson) => duplicateLesson.mutate({ courseId: lesson.courseId, sectionId: lesson.sectionId, id: lesson.id }),
    [duplicateLesson],
  );

  const handleExport = useCallback(() => {
    if (!courseId || !sectionId) return;
    exportLessons.mutate({ courseId, sectionId }, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lessons_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }, [courseId, sectionId, exportLessons]);

  const handleDelete = useCallback((lesson: Lesson) => {
    setDeleteTarget(lesson);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteLesson.mutate({
      courseId: deleteTarget.courseId,
      sectionId: deleteTarget.sectionId,
      id: deleteTarget.id,
    }, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteLesson]);

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="إدارة الدروس"
        description={courseId && sectionId ? "إدارة دروس هذا القسم" : "إدارة دروس الدورات التدريبية"}
        actions={
          courseId && sectionId ? (
            <>
              <AppButton variant="outline" size="sm" onClick={handleExport} loading={exportLessons.isPending}>
                <Download className="h-4 w-4" />
                تصدير
              </AppButton>
              <AppButton size="sm" onClick={openCreateDrawer}>
                <Plus className="h-4 w-4" />
                إضافة درس
              </AppButton>
            </>
          ) : undefined
        }
      />

      <AppDivider className="mb-8" />

      {courseId && sectionId ? (
        <>
          <AppSection>
            <LessonMetricCards
              data={metricsQuery.data}
              loading={metricsQuery.isLoading}
            />
          </AppSection>

          <AppSection>
            {isError ? (
              <LessonErrorState onRetry={() => lessonsQuery.refetch()} />
            ) : isLoading ? (
              <LessonLoadingState />
            ) : isEmpty ? (
              <LessonEmptyState onCreate={openCreateDrawer} />
            ) : (
              <>
                <div className="mb-4">
                  <LessonsToolbar
                    search={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    visibilityFilter={visibilityFilter}
                    onVisibilityChange={setVisibilityFilter}
                    lessonTypeFilter={lessonTypeFilter}
                    onLessonTypeChange={setLessonTypeFilter}
                    featuredFilter={featuredFilter}
                    onFeaturedChange={setFeaturedFilter}
                    sort={sort}
                    onSortChange={setSort}
                    onRefresh={() => lessonsQuery.refetch()}
                    refreshing={lessonsQuery.isRefetching}
                  />
                </div>
                <LessonsTable
                  lessons={lessons}
                  onView={openViewDrawer}
                  onEdit={openEditDrawer}
                  onPublish={handlePublish}
                  onArchive={handleArchive}
                  onDuplicate={handleDuplicate}
                  onToggleFeature={handleToggleFeature}
                  onToggleFreePreview={handleToggleFreePreview}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
                {lessons.length > 0 && (
                  <p className="mt-3 text-xs text-center text-muted-foreground/60">
                    إجمالي {lessons.length} درس
                  </p>
                )}
              </>
            )}
          </AppSection>
        </>
      ) : (
        <AppSection>
          <LessonEmptyState />
        </AppSection>
      )}

      <LessonCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSave={handleCreateSave}
        saving={createLesson.isPending}
      />

      <LessonEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        lesson={selectedLesson}
        onSave={handleEditSave}
        saving={updateLesson.isPending}
      />

      <LessonDetailsDrawer
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        lesson={selectedLesson}
      />

      <LessonDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        lesson={deleteTarget}
        onConfirm={confirmDelete}
        deleting={deleteLesson.isPending}
      />
    </AppPage>
  );
}

export default LessonsPage;
