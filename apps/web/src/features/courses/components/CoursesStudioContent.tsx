"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Copy,
  GraduationCap,
  Layers,
  MoreHorizontal,
  Pencil,
  PenLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  AppButton,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  PermissionGuard,
} from "@/components/ui";
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useArchiveCourse,
  useRestoreCourse,
  useDuplicateCourse,
  useToggleFeatureCourse,
} from "@/features/courses/hooks";
import { useCategories } from "@/features/course-categories/hooks";
import { CourseCreateDrawer } from "@/features/courses/components/CourseCreateDrawer";
import { CourseEditDrawer } from "@/features/courses/components/CourseEditDrawer";
import { COURSE_DIFFICULTY_CONFIG } from "@/features/courses/constants";
import { cn } from "@/lib/cn";
import { formatNumber, formatDate } from "@/lib/format";
import type {
  Course,
  CourseStatus,
  CourseDifficulty,
  CourseFilterParams,
  CreateCoursePayload,
  UpdateCoursePayload,
} from "@/features/courses/types";

const STATUS_META: Record<CourseStatus, { label: string; cls: string; dot: string }> = {
  draft: { label: "مسودة", cls: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" },
  review: { label: "قيد المراجعة", cls: "bg-blue-500/10 text-blue-500", dot: "bg-blue-500" },
  published: { label: "منشورة", cls: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500" },
  scheduled: { label: "مجدولة", cls: "bg-purple-500/10 text-purple-500", dot: "bg-purple-500" },
  archived: { label: "مؤرشفة", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

const STATUS_FILTERS: Array<{ value: CourseStatus; label: string; icon: React.ElementType }> = [
  { value: "draft", label: "مسودة", icon: PenLine },
  { value: "published", label: "منشور", icon: CheckCircle2 },
  { value: "archived", label: "مؤرشف", icon: Archive },
];

const DIFFICULTY_FILTERS: Array<{ value: CourseDifficulty; label: string }> = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
  { value: "all_levels", label: "جميع المستويات" },
];

function StatusBadge({ status }: { status: CourseStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", meta.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

/**
 * Studio-style courses index: chrome top bar, stats strip and a table of
 * courses. Clicking a row opens the course workspace (/courses/[courseId]).
 */
function CoursesStudioContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | null>(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [difficulty, setDifficulty] = useState<CourseDifficulty | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const queryParams = useMemo((): CourseFilterParams => {
    const params: CourseFilterParams = { per_page: 100 };
    if (searchQuery) params.search = searchQuery;
    if (statusFilter) params.status = statusFilter;
    if (featuredOnly) params.featured = true;
    if (difficulty) params.difficulty = difficulty;
    if (categoryId) params.category_id = Number(categoryId);
    return params;
  }, [searchQuery, statusFilter, featuredOnly, difficulty, categoryId]);

  const coursesQuery = useCourses(queryParams);
  const categoriesQuery = useCategories({ per_page: 100 });
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const archiveCourse = useArchiveCourse();
  const restoreCourse = useRestoreCourse();
  const duplicateCourse = useDuplicateCourse();
  const toggleFeature = useToggleFeatureCourse();

  const courses = coursesQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const isLoading = coursesQuery.isLoading;
  const isError = coursesQuery.isError;

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== null || featuredOnly || difficulty !== null || categoryId !== null;

  const stats = useMemo(
    () => ({
      total: courses.length,
      published: courses.filter((c) => c.status === "published").length,
      draft: courses.filter((c) => c.status === "draft").length,
      archived: courses.filter((c) => c.status === "archived").length,
      students: courses.reduce((sum, c) => sum + c.studentsCount, 0),
    }),
    [courses],
  );

  const openWorkspace = useCallback(
    (course: Course) => router.push(`/courses/${course.id}`),
    [router],
  );

  const handleCreateSave = useCallback(
    (data: CreateCoursePayload) => {
      createCourse.mutate(data, { onSuccess: () => setCreateDrawerOpen(false) });
    },
    [createCourse],
  );

  const handleEditSave = useCallback(
    (id: string, data: UpdateCoursePayload) => {
      updateCourse.mutate({ id, data }, { onSuccess: () => setEditDrawerOpen(false) });
    },
    [updateCourse],
  );

  const handleOpenEdit = useCallback((course: Course) => {
    setSelectedCourseId(course.id);
    setEditDrawerOpen(true);
  }, []);

  const handleDelete = useCallback(
    (course: Course) => {
      if (window.confirm(`هل أنت متأكد من حذف \"${course.title}\"؟`)) {
        deleteCourse.mutate(course.id);
      }
    },
    [deleteCourse],
  );

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter(null);
    setFeaturedOnly(false);
    setDifficulty(null);
    setCategoryId(null);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Studio chrome: title, search, primary actions */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/80 px-4 py-2 backdrop-blur-xl sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight">الدورات</h1>
            <p className="hidden text-[10px] text-muted-foreground/50 sm:block">
              اختر دورة لفتحها في الاستوديو
            </p>
          </div>
        </div>

        <div className="flex max-w-md flex-1 items-center">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن دورة..."
              aria-label="ابحث عن دورة"
              className="h-8 w-full rounded-lg border border-border/40 bg-muted/20 ps-9 pe-8 text-xs placeholder:text-muted-foreground/40 transition-colors focus-visible:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 transition-colors hover:text-foreground"
                aria-label="مسح البحث"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <PermissionGuard permission="courses.create">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCreateDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-50 transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <Plus className="h-3.5 w-3.5" />
              دورة جديدة
            </motion.button>
          </PermissionGuard>
        </div>
      </motion.header>

      {/* Stats + filters strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/20 bg-muted/10 px-4 py-2 text-xs text-muted-foreground/60 sm:px-6"
      >
        <span className="flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" />
          {formatNumber(stats.total)} دورة
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {formatNumber(stats.students)} طالب
        </span>

        <div className="h-4 w-px bg-border/40" />

        {STATUS_FILTERS.map((chip) => {
          const Icon = chip.icon;
          const isActive = statusFilter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(isActive ? null : chip.value)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors",
                isActive
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <Icon className="h-3 w-3" />
              {chip.label}
            </button>
          );
        })}

        <button
          onClick={() => setFeaturedOnly((prev) => !prev)}
          aria-pressed={featuredOnly}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors",
            featuredOnly
              ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
              : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:text-foreground",
          )}
        >
          <Sparkles className="h-3 w-3" />
          مميز
        </button>

        <div className="relative">
          <select
            value={difficulty ?? ""}
            onChange={(e) => setDifficulty((e.target.value || null) as CourseDifficulty | null)}
            aria-label="تصفية: المستوى"
            className={cn(
              "cursor-pointer appearance-none rounded-full border px-2.5 py-1 pe-7 font-medium transition-colors",
              difficulty
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <option value="">المستوى</option>
            {DIFFICULTY_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-3 w-3 -translate-y-1/2" />
        </div>

        {categories.length > 0 && (
          <div className="relative">
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              aria-label="تصفية: التصنيف"
              className={cn(
                "cursor-pointer appearance-none rounded-full border px-2.5 py-1 pe-7 font-medium transition-colors",
                categoryId
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <option value="">التصنيف</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-3 w-3 -translate-y-1/2" />
          </div>
        )}

        <div className="me-auto" />

        <span className="hidden items-center gap-3 lg:flex">
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {stats.published} منشورة
          </span>
          <span className="flex items-center gap-1 text-amber-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {stats.draft} مسودة
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {stats.archived} مؤرشفة
          </span>
        </span>
      </motion.div>

      {/* Courses table */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {isLoading && (
          <div className="overflow-hidden rounded-2xl border border-border/40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border/20 px-4 py-3 last:border-b-0">
                <div className="h-10 w-14 shrink-0 animate-pulse rounded-lg bg-muted/30" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 animate-pulse rounded bg-muted/30" />
                  <div className="h-2.5 w-1/4 animate-pulse rounded bg-muted/20" />
                </div>
                <div className="hidden h-5 w-16 animate-pulse rounded-full bg-muted/20 md:block" />
                <div className="hidden h-3 w-20 animate-pulse rounded bg-muted/20 lg:block" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-5 py-28">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10">
              <BookOpen className="h-8 w-8 text-destructive/40" />
            </div>
            <div className="space-y-1 text-center">
              <h3 className="text-base font-bold">فشل تحميل الدورات</h3>
              <p className="text-xs text-muted-foreground/60">حدث خطأ أثناء تحميل الدورات. حاول مرة أخرى.</p>
            </div>
            <AppButton variant="outline" size="sm" onClick={() => coursesQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </AppButton>
          </div>
        )}

        {!isLoading && !isError && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-5 py-28">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/[0.06]">
              {hasActiveFilters ? (
                <Search className="h-9 w-9 text-primary/20" />
              ) : (
                <BookOpen className="h-9 w-9 text-primary/20" />
              )}
            </div>
            <div className="max-w-md space-y-1.5 text-center">
              <h3 className="text-base font-bold">
                {hasActiveFilters ? "لا توجد نتائج" : "ابدأ رحلتك التعليمية"}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground/60">
                {hasActiveFilters
                  ? "حاول تغيير كلمات البحث أو مسح التصفية"
                  : "أنشئ أول دورة تدريبية لك وافتحها في الاستوديو لإضافة المحاضرات والمحتوى."}
              </p>
            </div>
            {hasActiveFilters ? (
              <AppButton variant="outline" size="sm" onClick={clearFilters}>
                مسح التصفية
              </AppButton>
            ) : (
              <PermissionGuard permission="courses.create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCreateDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-50 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600"
                >
                  <Plus className="h-4 w-4" />
                  إنشاء أول دورة
                </motion.button>
              </PermissionGuard>
            )}
          </div>
        )}

        {!isLoading && !isError && courses.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-muted/20 text-[11px] text-muted-foreground/60">
                <tr>
                  <th className="px-4 py-2.5 text-start font-medium">الدورة</th>
                  <th className="hidden px-4 py-2.5 text-start font-medium md:table-cell">الحالة</th>
                  <th className="hidden px-4 py-2.5 text-start font-medium lg:table-cell">التصنيف</th>
                  <th className="hidden px-4 py-2.5 text-start font-medium xl:table-cell">المستوى</th>
                  <th className="hidden px-4 py-2.5 text-start font-medium md:table-cell">المحتوى</th>
                  <th className="hidden px-4 py-2.5 text-start font-medium lg:table-cell">الطلاب</th>
                  <th className="hidden px-4 py-2.5 text-start font-medium xl:table-cell">آخر تحديث</th>
                  <th className="w-12 px-2 py-2.5" aria-label="إجراءات" />
                </tr>
              </thead>
              <tbody>
                {courses.map((course, index) => (
                  <motion.tr
                    key={course.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.4) }}
                    onClick={() => openWorkspace(course)}
                    className="group cursor-pointer border-b border-border/20 transition-colors last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {course.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.thumbnail}
                            alt=""
                            className="h-10 w-14 shrink-0 rounded-lg object-cover ring-1 ring-border/40"
                          />
                        ) : (
                          <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06]">
                            <BookOpen className="h-4 w-4 text-primary/30" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-semibold transition-colors group-hover:text-primary">
                              {course.title}
                            </span>
                            {course.featured && <Sparkles className="h-3 w-3 shrink-0 text-amber-500" />}
                          </div>
                          {course.subtitle && (
                            <p className="truncate text-[11px] text-muted-foreground/50">{course.subtitle}</p>
                          )}
                          <div className="mt-1 md:hidden">
                            <StatusBadge status={course.status} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground/60 lg:table-cell">
                      {course.category?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground/60 xl:table-cell">
                      {COURSE_DIFFICULTY_CONFIG[course.difficulty]?.label ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                        <Layers className="h-3.5 w-3.5" />
                        {course.sectionsCount} قسم · {course.lessonsCount} درس
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                        <Users className="h-3.5 w-3.5" />
                        {formatNumber(course.studentsCount)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground/50 xl:table-cell">
                      {formatDate(course.updatedAt)}
                    </td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <AppDropdownMenu>
                        <AppDropdownMenuTrigger asChild>
                          <button
                            className="rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-muted/40 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                            aria-label={`إجراءات ${course.title}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </AppDropdownMenuTrigger>
                        <AppDropdownMenuContent align="end" className="w-44">
                          <AppDropdownMenuItem onClick={() => openWorkspace(course)}>
                            <GraduationCap className="h-3.5 w-3.5" />
                            فتح في الاستوديو
                          </AppDropdownMenuItem>
                          <PermissionGuard permission="courses.update">
                            <AppDropdownMenuItem onClick={() => handleOpenEdit(course)}>
                              <Pencil className="h-3.5 w-3.5" />
                              تعديل البيانات
                            </AppDropdownMenuItem>
                            <AppDropdownMenuItem onClick={() => toggleFeature.mutate(course.id)}>
                              <Sparkles className="h-3.5 w-3.5" />
                              {course.featured ? "إلغاء التمييز" : "تمييز"}
                            </AppDropdownMenuItem>
                          </PermissionGuard>
                          <PermissionGuard permission="courses.create">
                            <AppDropdownMenuItem onClick={() => duplicateCourse.mutate(course.id)}>
                              <Copy className="h-3.5 w-3.5" />
                              نسخ
                            </AppDropdownMenuItem>
                          </PermissionGuard>
                          <PermissionGuard permission="courses.update">
                            {course.status === "archived" ? (
                              <AppDropdownMenuItem onClick={() => restoreCourse.mutate(course.id)}>
                                <RotateCcw className="h-3.5 w-3.5" />
                                استعادة
                              </AppDropdownMenuItem>
                            ) : (
                              <AppDropdownMenuItem onClick={() => archiveCourse.mutate(course.id)}>
                                <Archive className="h-3.5 w-3.5" />
                                أرشفة
                              </AppDropdownMenuItem>
                            )}
                          </PermissionGuard>
                          <PermissionGuard permission="courses.delete">
                            <AppDropdownMenuSeparator />
                            <AppDropdownMenuItem
                              onClick={() => handleDelete(course)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              حذف
                            </AppDropdownMenuItem>
                          </PermissionGuard>
                        </AppDropdownMenuContent>
                      </AppDropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CourseCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSave={handleCreateSave}
        saving={createCourse.isPending}
        categories={categories}
      />

      <CourseEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        courseId={selectedCourseId}
        onSave={handleEditSave}
        saving={updateCourse.isPending}
        categories={categories}
      />
    </div>
  );
}

export { CoursesStudioContent };
