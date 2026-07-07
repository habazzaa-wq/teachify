"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Download } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppSection,
  AppDivider,
  AppButton,
} from "@/components/ui";
import {
  useCategories,
  useCategoriesMetrics,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useRestoreCategory,
  useForceDeleteCategory,
  useDuplicateCategory,
  useToggleFeatureCategory,
  useToggleActiveCategory,
  useExportCategories,
} from "@/features/course-categories/hooks";
import { CategoryMetricCards } from "@/features/course-categories/components/CategoryMetricCards";
import { CategoriesToolbar } from "@/features/course-categories/components/CategoriesToolbar";
import { CategoriesTable } from "@/features/course-categories/components/CategoriesTable";
import { CategoryCreateDrawer } from "@/features/course-categories/components/CategoryCreateDrawer";
import { CategoryEditDrawer } from "@/features/course-categories/components/CategoryEditDrawer";
import { CategoryDetailsDrawer } from "@/features/course-categories/components/CategoryDetailsDrawer";
import { CategoryDeleteDialog } from "@/features/course-categories/components/CategoryDeleteDialog";
import { CategoryEmptyState } from "@/features/course-categories/components/CategoryEmptyState";
import { CategoryLoadingState } from "@/features/course-categories/components/CategoryLoadingState";
import { CategoryErrorState } from "@/features/course-categories/components/CategoryErrorState";
import type { Category, CategoryStatus, CategorySort, CreateCategoryPayload, UpdateCategoryPayload } from "@/features/course-categories/types";

function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | "all">("all");
  const [featuredFilter, setFeaturedFilter] = useState<boolean | "all">("all");
  const [parentFilter, setParentFilter] = useState<number | "all" | "none" | "has">("all");
  const [hasCoursesFilter, setHasCoursesFilter] = useState<boolean | "all">("all");
  const [sort, setSort] = useState<CategorySort>("sort_order");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const params = useMemo(() => ({
    search,
    status: statusFilter,
    featured: featuredFilter,
    parent_id: parentFilter,
    has_courses: hasCoursesFilter,
    sort,
  }), [search, statusFilter, featuredFilter, parentFilter, hasCoursesFilter, sort]);

  const categoriesQuery = useCategories(params);
  const metricsQuery = useCategoriesMetrics();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const restoreCategory = useRestoreCategory();
  const forceDeleteCategory = useForceDeleteCategory();
  const duplicateCategory = useDuplicateCategory();
  const toggleFeature = useToggleFeatureCategory();
  const toggleActive = useToggleActiveCategory();
  const exportCategories = useExportCategories();

  const categories = categoriesQuery.data?.data ?? [];
  const isLoading = categoriesQuery.isLoading || metricsQuery.isLoading;
  const isError = categoriesQuery.isError;

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parentId).map((c) => ({ id: c.id, name: c.name })),
    [categories],
  );

  const openCreateDrawer = useCallback(() => setCreateDrawerOpen(true), []);

  const openViewDrawer = useCallback((category: Category) => {
    setSelectedCategoryId(category.id);
    setDetailsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((category: Category) => {
    setSelectedCategoryId(category.id);
    setEditDrawerOpen(true);
  }, []);

  const handleCreateSave = useCallback(
    (data: CreateCategoryPayload) => {
      createCategory.mutate(data, {
        onSuccess: () => setCreateDrawerOpen(false),
      });
    },
    [createCategory],
  );

  const handleEditSave = useCallback(
    (id: string, data: UpdateCategoryPayload) => {
      updateCategory.mutate({ id, data }, {
        onSuccess: () => setEditDrawerOpen(false),
      });
    },
    [updateCategory],
  );

  const handleToggleFeature = useCallback(
    (category: Category) => toggleFeature.mutate(category.id),
    [toggleFeature],
  );

  const handleToggleActive = useCallback(
    (category: Category) => toggleActive.mutate(category.id),
    [toggleActive],
  );

  const handleDuplicate = useCallback(
    (category: Category) => duplicateCategory.mutate(category.id),
    [duplicateCategory],
  );

  const handleExport = useCallback(() => {
    exportCategories.mutate(undefined, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `categories_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }, [exportCategories]);

  const handleDelete = useCallback((category: Category) => {
    setDeleteTarget(category);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteCategory]);

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="إدارة التصنيفات"
        description="إدارة تصنيفات الدورات التدريبية"
        actions={
          <>
            <AppButton variant="outline" size="sm" onClick={handleExport} loading={exportCategories.isPending}>
              <Download className="h-4 w-4" />
              تصدير
            </AppButton>
            <AppButton size="sm" onClick={openCreateDrawer}>
              <Plus className="h-4 w-4" />
              إضافة تصنيف
            </AppButton>
          </>
        }
      />

      <AppDivider className="mb-8" />

      <AppSection>
        <CategoryMetricCards
          data={metricsQuery.data}
          loading={metricsQuery.isLoading}
        />
      </AppSection>

      <AppSection>
        {isError ? (
          <CategoryErrorState onRetry={() => categoriesQuery.refetch()} />
        ) : isLoading ? (
          <CategoryLoadingState />
        ) : categories.length === 0 && !search && statusFilter === "all" ? (
          <CategoryEmptyState onCreate={openCreateDrawer} />
        ) : (
          <>
            <div className="mb-4">
              <CategoriesToolbar
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                featuredFilter={featuredFilter}
                onFeaturedChange={setFeaturedFilter}
                parentFilter={parentFilter}
                onParentChange={setParentFilter}
                hasCoursesFilter={hasCoursesFilter}
                onHasCoursesChange={setHasCoursesFilter}
                sort={sort}
                onSortChange={(val) => setSort(val as CategorySort)}
                onRefresh={() => categoriesQuery.refetch()}
                refreshing={categoriesQuery.isRefetching}
              />
            </div>
            <CategoriesTable
              categories={categories}
              onView={openViewDrawer}
              onEdit={openEditDrawer}
              onToggleFeature={handleToggleFeature}
              onToggleActive={handleToggleActive}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onRestore={(category) => restoreCategory.mutate(category.id)}
              onForceDelete={(category) => forceDeleteCategory.mutate(category.id)}
            />
            {categories.length > 0 && (
              <p className="mt-3 text-xs text-center text-muted-foreground/60">
                إجمالي {categories.length} تصنيف
              </p>
            )}
          </>
        )}
      </AppSection>

      <CategoryCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSave={handleCreateSave}
        saving={createCategory.isPending}
        parentCategories={parentCategories}
      />

      <CategoryEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        categoryId={selectedCategoryId}
        onSave={handleEditSave}
        saving={updateCategory.isPending}
        parentCategories={parentCategories}
      />

      <CategoryDetailsDrawer
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        categoryId={selectedCategoryId}
      />

      <CategoryDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        categoryName={deleteTarget?.name ?? ""}
        onConfirm={confirmDelete}
        loading={deleteCategory.isPending}
      />
    </AppPage>
  );
}

export default CategoriesPage;