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
  useSections,
  useSectionsMetrics,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  usePublishSection,
  useUnpublishSection,
  useToggleLockSection,
  useToggleFeatureSection,
  useRestoreSection,
  useDuplicateSection,
  useExportSections,
} from "@/features/course-sections/hooks";
import { SectionMetricCards } from "@/features/course-sections/components/SectionMetricCards";
import { SectionsToolbar } from "@/features/course-sections/components/SectionsToolbar";
import { SectionsTable } from "@/features/course-sections/components/SectionsTable";
import { SectionCreateDrawer } from "@/features/course-sections/components/SectionCreateDrawer";
import { SectionEditDrawer } from "@/features/course-sections/components/SectionEditDrawer";
import { SectionDetailsDrawer } from "@/features/course-sections/components/SectionDetailsDrawer";
import { SectionDeleteDialog } from "@/features/course-sections/components/SectionDeleteDialog";
import { SectionEmptyState } from "@/features/course-sections/components/SectionEmptyState";
import { SectionLoadingState } from "@/features/course-sections/components/SectionLoadingState";
import { SectionErrorState } from "@/features/course-sections/components/SectionErrorState";
import type { CourseSection, SectionStatus, CreateCourseSectionPayload, UpdateCourseSectionPayload } from "@/features/course-sections/types";

function SectionsPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SectionStatus | "all">("all");
  const [publishedFilter, setPublishedFilter] = useState<boolean | "all">("all");
  const [lockedFilter, setLockedFilter] = useState<boolean | "all">("all");
  const [sort, setSort] = useState("sort_order");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseSection | null>(null);

  const params = useMemo(() => ({
    search,
    status: statusFilter,
    published: publishedFilter,
    locked: lockedFilter,
    sort,
  }), [search, statusFilter, publishedFilter, lockedFilter, sort]);

  const sectionsQuery = useSections(courseId, params);
  const metricsQuery = useSectionsMetrics(courseId ?? undefined);
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const publishSection = usePublishSection();
  const unpublishSection = useUnpublishSection();
  const toggleLockSection = useToggleLockSection();
  const toggleFeatureSection = useToggleFeatureSection();
  const restoreSection = useRestoreSection();
  const duplicateSection = useDuplicateSection();
  const exportSections = useExportSections();

  const sections = sectionsQuery.data?.data ?? [];
  const isLoading = sectionsQuery.isLoading || metricsQuery.isLoading;
  const isError = sectionsQuery.isError;
  const isEmpty = sections.length === 0 && !search && statusFilter === "all";

  const openCreateDrawer = useCallback(() => setCreateDrawerOpen(true), []);

  const openViewDrawer = useCallback((section: CourseSection) => {
    setSelectedSection(section);
    setDetailsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((section: CourseSection) => {
    setSelectedSection(section);
    setEditDrawerOpen(true);
  }, []);

  const handleCreateSave = useCallback(
    (data: CreateCourseSectionPayload) => {
      if (!courseId) return;
      createSection.mutate({ courseId, data }, {
        onSuccess: () => setCreateDrawerOpen(false),
      });
    },
    [courseId, createSection],
  );

  const handleEditSave = useCallback(
    (data: UpdateCourseSectionPayload) => {
      if (!selectedSection) return;
      updateSection.mutate({
        courseId: selectedSection.courseId,
        id: selectedSection.id,
        data,
      }, {
        onSuccess: () => setEditDrawerOpen(false),
      });
    },
    [selectedSection, updateSection],
  );

  const handlePublish = useCallback(
    (section: CourseSection) => publishSection.mutate({ courseId: section.courseId, id: section.id }),
    [publishSection],
  );

  const handleUnpublish = useCallback(
    (section: CourseSection) => unpublishSection.mutate({ courseId: section.courseId, id: section.id }),
    [unpublishSection],
  );

  const handleToggleLock = useCallback(
    (section: CourseSection) => toggleLockSection.mutate({ courseId: section.courseId, id: section.id }),
    [toggleLockSection],
  );

  const handleToggleFeature = useCallback(
    (section: CourseSection) => toggleFeatureSection.mutate({ courseId: section.courseId, id: section.id }),
    [toggleFeatureSection],
  );

  const handleRestore = useCallback(
    (section: CourseSection) => restoreSection.mutate({ courseId: section.courseId, id: section.id }),
    [restoreSection],
  );

  const handleDuplicate = useCallback(
    (section: CourseSection) => duplicateSection.mutate({ courseId: section.courseId, id: section.id }),
    [duplicateSection],
  );

  const handleExport = useCallback(() => {
    if (!courseId) return;
    exportSections.mutate(courseId, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sections_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }, [courseId, exportSections]);

  const handleDelete = useCallback((section: CourseSection) => {
    setDeleteTarget(section);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteSection.mutate({
      courseId: deleteTarget.courseId,
      id: deleteTarget.id,
    }, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteSection]);

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="إدارة الأقسام"
        description={courseId ? "إدارة أقسام هذه الدورة التدريبية" : "إدارة أقسام الدورات التدريبية"}
        actions={
          courseId ? (
            <>
              <AppButton variant="outline" size="sm" onClick={handleExport} loading={exportSections.isPending}>
                <Download className="h-4 w-4" />
                تصدير
              </AppButton>
              <AppButton size="sm" onClick={openCreateDrawer}>
                <Plus className="h-4 w-4" />
                إضافة قسم
              </AppButton>
            </>
          ) : undefined
        }
      />

      <AppDivider className="mb-8" />

      {courseId ? (
        <>
          <AppSection>
            <SectionMetricCards
              data={metricsQuery.data}
              loading={metricsQuery.isLoading}
            />
          </AppSection>

          <AppSection>
            {isError ? (
              <SectionErrorState onRetry={() => sectionsQuery.refetch()} />
            ) : isLoading ? (
              <SectionLoadingState />
            ) : isEmpty ? (
              <SectionEmptyState onCreate={openCreateDrawer} />
            ) : (
              <>
                <div className="mb-4">
                  <SectionsToolbar
                    search={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    publishedFilter={publishedFilter}
                    onPublishedChange={setPublishedFilter}
                    lockedFilter={lockedFilter}
                    onLockedChange={setLockedFilter}
                    sort={sort}
                    onSortChange={setSort}
                    onRefresh={() => sectionsQuery.refetch()}
                    refreshing={sectionsQuery.isRefetching}
                  />
                </div>
                <SectionsTable
                  sections={sections}
                  onView={openViewDrawer}
                  onEdit={openEditDrawer}
                  onPublish={handlePublish}
                  onUnpublish={handleUnpublish}
                  onDuplicate={handleDuplicate}
                  onToggleFeature={handleToggleFeature}
                  onToggleLock={handleToggleLock}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
                {sections.length > 0 && (
                  <p className="mt-3 text-xs text-center text-muted-foreground/60">
                    إجمالي {sections.length} قسم
                  </p>
                )}
              </>
            )}
          </AppSection>
        </>
      ) : (
        <AppSection>
          <SectionEmptyState />
        </AppSection>
      )}

      <SectionCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSave={handleCreateSave}
        saving={createSection.isPending}
      />

      <SectionEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        section={selectedSection}
        onSave={handleEditSave}
        saving={updateSection.isPending}
      />

      <SectionDetailsDrawer
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        section={selectedSection}
        courseId={courseId}
      />

      <SectionDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        section={deleteTarget}
        onConfirm={confirmDelete}
        deleting={deleteSection.isPending}
      />
    </AppPage>
  );
}

export default SectionsPage;
