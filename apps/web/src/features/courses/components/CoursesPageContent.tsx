"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Search,
  X,
  Clock,
  PenLine,
  CheckCircle2,
  Archive,
  Sparkles,
  RefreshCw,
  Upload,
  ChevronDown,
} from "lucide-react";
import { AppButton, PermissionGuard } from "@/components/ui";
import { useCurrentUser } from "@/hooks";
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
import { CourseCreatePanel } from "@/features/courses/components/CourseCreatePanel";
import { CourseEditDrawer } from "@/features/courses/components/CourseEditDrawer";
import { CourseCard } from "./CourseCard";
import { cn } from "@/lib/cn";
import type {
  Course,
  CourseStatus,
  CourseDifficulty,
  PricingType,
  CreateCoursePayload,
  UpdateCoursePayload,
  CourseFilterParams,
} from "@/features/courses/types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

interface FilterState {
  status: CourseStatus | null;
  featured: boolean | null;
  myCourses: boolean;
  recentlyEdited: boolean;
  categoryId: string | null;
  difficulty: CourseDifficulty | null;
  language: string | null;
  pricingType: PricingType | null;
}

const initialFilters: FilterState = {
  status: null,
  featured: null,
  myCourses: false,
  recentlyEdited: false,
  categoryId: null,
  difficulty: null,
  language: null,
  pricingType: null,
};

const DIFFICULTY_FILTERS = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
  { value: "all_levels", label: "جميع المستويات" },
];

const PRICING_FILTERS = [
  { value: "free", label: "مجاني" },
  { value: "one_time", label: "دفعة واحدة" },
  { value: "subscription", label: "اشتراك" },
];

const LANGUAGE_FILTERS = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ur", label: "اردو" },
];

function CoursesPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { user } = useCurrentUser();

  const queryParams = useMemo((): CourseFilterParams => {
    const params: CourseFilterParams = {
      per_page: 100,
    };
    if (searchQuery) params.search = searchQuery;
    if (filters.status) params.status = filters.status;
    if (filters.featured !== null) params.featured = filters.featured;
    if (filters.myCourses && user?.id) params.instructor_id = user.id;
    if (filters.recentlyEdited) {
      params.sort = "updated_at";
      params.sort_dir = "desc";
    }
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.language) params.language = filters.language;
    if (filters.pricingType) params.pricing_type = filters.pricingType;
    if (filters.categoryId) params.category_id = Number(filters.categoryId);
    return params;
  }, [searchQuery, filters, user?.id]);

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
  const hasActiveFilters = useMemo(
    () => searchQuery !== "" || Object.values(filters).some((v) => v !== null && v !== false),
    [searchQuery, filters],
  );

  const continueCourses = useMemo(
    () => [...courses]
      .filter((c) => c.status === "draft" && (c.sectionsCount > 0 || c.lessonsCount > 0))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5),
    [courses],
  );

  const showNoCourses = !isLoading && !isError && courses.length === 0 && !hasActiveFilters;
  const showEmptySearch = !isLoading && !isError && courses.length === 0 && hasActiveFilters;

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

  const handleDuplicate = useCallback(
    (course: Course) => duplicateCourse.mutate(course.id),
    [duplicateCourse],
  );

  const handleArchive = useCallback(
    (course: Course) => archiveCourse.mutate(course.id),
    [archiveCourse],
  );

  const handleRestore = useCallback(
    (course: Course) => restoreCourse.mutate(course.id),
    [restoreCourse],
  );

  const handleToggleFeature = useCallback(
    (course: Course) => toggleFeature.mutate(course.id),
    [toggleFeature],
  );

  const handleDelete = useCallback(
    (course: Course) => {
      if (window.confirm(`هل أنت متأكد من حذف "${course.title}"؟`)) {
        deleteCourse.mutate(course.id);
      }
    },
    [deleteCourse],
  );

  const handleOpenEdit = useCallback(
    (course: Course) => {
      setSelectedCourseId(course.id);
      setEditDrawerOpen(true);
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilters(initialFilters);
  }, []);

  const hasAnyFilter = useMemo(
    () => Object.values(filters).some((v) => v !== null && v !== false),
    [filters],
  );

  const handleSearchToggle = useCallback(() => {
    setShowSearch((prev) => !prev);
    if (!showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
        className={cn(
          "pb-16 transition-[padding] duration-300 ease-out",
          (createDrawerOpen || editDrawerOpen) && "lg:pe-[480px]",
        )}
    >
      {isLoading && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-10 w-48 animate-pulse rounded-xl bg-muted/30" />
            <div className="h-5 w-96 animate-pulse rounded-lg bg-muted/20" />
          </div>
          <div className="h-14 w-full animate-pulse rounded-2xl bg-muted/20" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted/20" />
            ))}
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[200px] w-[420px] shrink-0 animate-pulse rounded-2xl bg-muted/20" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-muted/20">
                <div className="aspect-[16/10] rounded-t-2xl bg-muted/30" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-full rounded-lg bg-muted/30" />
                  <div className="h-3 w-3/4 rounded-lg bg-muted/20" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-3 w-full rounded-lg bg-muted/20" />
                    <div className="h-3 w-full rounded-lg bg-muted/20" />
                    <div className="h-3 w-full rounded-lg bg-muted/20" />
                    <div className="h-3 w-full rounded-lg bg-muted/20" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/20" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-3 w-20 rounded-lg bg-muted/20" />
                    <div className="h-6 w-6 rounded-lg bg-muted/20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-6 py-32"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-destructive/10">
            <BookOpen className="h-10 w-10 text-destructive/40" />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-bold">فشل تحميل الدورات</h3>
            <p className="text-sm text-muted-foreground/60">
              حدث خطأ أثناء تحميل الدورات. حاول مرة أخرى.
            </p>
          </div>
          <AppButton variant="outline" size="sm" onClick={() => coursesQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </AppButton>
        </motion.div>
      )}

      {!isLoading && !isError && (
        <>
          <motion.div variants={staggerItem} className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  الكورسات
                </h1>
                <p className="text-sm text-muted-foreground/60 max-w-lg">
                  إدارة وتنظيم جميع دوراتك التدريبية. أنشئ دورات جديدة، تابع التقدم، وانشر محتواك التعليمي.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSearchToggle}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                    showSearch
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/40 hover:bg-muted/30 hover:text-foreground",
                  )}
                  aria-label="بحث"
                >
                  <Search className="h-4 w-4" />
                </button>
                <PermissionGuard permission="courses.create">
                  <AppButton
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {}}
                  >
                    <Upload className="h-4 w-4" />
                    استيراد
                  </AppButton>
                </PermissionGuard>
                <PermissionGuard permission="courses.create">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCreateDrawerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    إنشاء كورس
                  </motion.button>
                </PermissionGuard>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                variants={staggerItem}
                className="mb-6"
              >
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                    <Search className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن كورس..."
                    className="flex h-14 w-full rounded-2xl border border-border/50 bg-card ps-11 pe-12 text-sm shadow-lg shadow-primary/5 backdrop-blur-sm placeholder:text-muted-foreground/40 transition-all duration-300 focus-visible:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    aria-label="ابحث عن كورس"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 end-0 flex items-center pe-4 text-muted-foreground/30 hover:text-foreground transition-colors"
                      aria-label="مسح البحث"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={staggerItem} className="mb-6 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 pb-1">
              {[
                { key: "status", value: "draft" as const, label: "مسودة", icon: PenLine },
                { key: "status", value: "published" as const, label: "منشور", icon: CheckCircle2 },
                { key: "status", value: "archived" as const, label: "مؤرشف", icon: Archive },
                { key: "featured", value: true, label: "مميز", icon: Sparkles },
                { key: "recentlyEdited", value: true, label: "آخر التعديلات", icon: Clock },
                { key: "myCourses", value: true, label: "دوراتي", icon: BookOpen },
              ].map((chip) => {
                const isActive = filters[chip.key as keyof FilterState] === chip.value;
                const Icon = chip.icon;
                return (
                  <motion.button
                    key={`${chip.key}-${chip.value}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (chip.key === "status") {
                        setFilters((prev) => ({
                          ...prev,
                          status: prev.status === chip.value ? null : (chip.value as CourseStatus),
                        }));
                      } else if (chip.key === "featured") {
                        setFilters((prev) => ({
                          ...prev,
                          featured: prev.featured === true ? null : true,
                        }));
                      } else if (chip.key === "recentlyEdited") {
                        setFilters((prev) => ({
                          ...prev,
                          recentlyEdited: !prev.recentlyEdited,
                        }));
                      } else if (chip.key === "myCourses") {
                        setFilters((prev) => ({
                          ...prev,
                          myCourses: !prev.myCourses,
                        }));
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200",
                      isActive
                        ? "border-primary/20 bg-primary/10 text-primary shadow-sm"
                        : "border-border/50 bg-muted/30 text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground",
                    )}
                    aria-pressed={isActive}
                    aria-label={`تصفية: ${chip.label}`}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "opacity-100" : "opacity-50")} />
                    {chip.label}
                  </motion.button>
                );
              })}

              <div className="h-5 w-px bg-border/50 mx-1" />

              {[
                { key: "difficulty", options: DIFFICULTY_FILTERS, placeholder: "المستوى" },
                { key: "language", options: LANGUAGE_FILTERS, placeholder: "اللغة" },
                { key: "pricingType", options: PRICING_FILTERS, placeholder: "السعر" },
              ].map((dropdown) => {
                const currentVal = filters[dropdown.key as keyof FilterState] as string | null;
                const currentLabel = dropdown.options.find((o) => o.value === currentVal)?.label;
                return (
                  <div key={dropdown.key} className="relative">
                    <select
                      value={currentVal ?? ""}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          [dropdown.key]: e.target.value || null,
                        }));
                      }}
                      className={cn(
                        "appearance-none rounded-full border px-3.5 py-1.5 pe-8 text-xs font-medium cursor-pointer transition-all duration-200",
                        currentVal
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border/50 bg-muted/30 text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground",
                      )}
                      aria-label={`تصفية: ${dropdown.placeholder}`}
                    >
                      <option value="">{dropdown.placeholder}</option>
                      {dropdown.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className={cn(
                      "pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-3 w-3",
                      currentVal ? "text-primary" : "text-muted-foreground/40",
                    )} />
                  </div>
                );
              })}

              {categories.length > 0 && (
                <div className="relative">
                  <select
                    value={filters.categoryId ?? ""}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        categoryId: e.target.value || null,
                      }));
                    }}
                    className={cn(
                      "appearance-none rounded-full border px-3.5 py-1.5 pe-8 text-xs font-medium cursor-pointer transition-all duration-200",
                      filters.categoryId
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border/50 bg-muted/30 text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground",
                    )}
                    aria-label="تصفية: التصنيف"
                  >
                    <option value="">التصنيف</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown className={cn(
                    "pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-3 w-3",
                    filters.categoryId ? "text-primary" : "text-muted-foreground/40",
                  )} />
                </div>
              )}
            </div>
          </motion.div>

          {showNoCourses && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center gap-8 py-32"
            >
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-primary/[0.08] via-primary/[0.03] to-transparent ring-8 ring-background">
                  <BookOpen className="h-16 w-16 text-primary/15" />
                </div>
                <div className="absolute -bottom-2 -end-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <div className="max-w-lg space-y-3 text-center">
                <h2 className="text-2xl font-bold tracking-tight">ابدأ رحلتك التعليمية</h2>
                <p className="text-sm leading-relaxed text-muted-foreground/70">
                  أنشئ أول دورة تدريبية لك. قم بإضافة المحاضرات والأقسام والمحتوى التعليمي
                  لتقديم تجربة تعليمية متكاملة لطلابك.
                </p>
              </div>
              <PermissionGuard permission="courses.create">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCreateDrawerOpen(true)}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  إنشاء أول دورة
                </motion.button>
              </PermissionGuard>
            </motion.div>
          )}

          {showEmptySearch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-24"
            >
              <Search className="h-12 w-12 text-muted-foreground/15" />
              <div className="space-y-1 text-center">
                <h3 className="text-base font-bold">لا توجد نتائج للبحث</h3>
                <p className="text-sm text-muted-foreground/60">
                  حاول تغيير كلمات البحث أو تصفية الحالة
                </p>
              </div>
              <AppButton variant="outline" size="sm" onClick={clearFilters}>
                مسح التصفية
              </AppButton>
            </motion.div>
          )}

          {!showNoCourses && !showEmptySearch && courses.length > 0 && (
            <motion.div variants={containerVariants} className="space-y-10">
              {continueCourses.length > 0 && !hasAnyFilter && !searchQuery && (
                <motion.section variants={staggerItem}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                      <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <h2 className="text-sm font-bold tracking-tight">أكمل العمل</h2>
                    <span className="text-xs text-muted-foreground/40">({continueCourses.length})</span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {continueCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        variant="continue"
                        onEdit={handleOpenEdit}
                        onDuplicate={handleDuplicate}
                        onArchive={handleArchive}
                        onRestore={handleRestore}
                        onDelete={handleDelete}
                        onToggleFeature={handleToggleFeature}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              <motion.section variants={staggerItem}>
                {!hasAnyFilter && !searchQuery && (
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-sm font-bold tracking-tight">جميع الدورات</h2>
                    <span className="text-xs text-muted-foreground/40">({courses.length})</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      variant="default"
                      onEdit={handleOpenEdit}
                      onDuplicate={handleDuplicate}
                      onArchive={handleArchive}
                      onRestore={handleRestore}
                      onDelete={handleDelete}
                      onToggleFeature={handleToggleFeature}
                    />
                  ))}
                </div>
              </motion.section>

              <motion.div
                variants={staggerItem}
                className="flex items-center justify-center gap-2 pb-8 text-xs text-muted-foreground/20"
              >
                <Sparkles className="h-3 w-3" />
                <span>إجمالي {courses.length} دورة</span>
              </motion.div>
            </motion.div>
          )}
        </>
      )}

      <CourseCreatePanel
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSave={handleCreateSave}
        saving={createCourse.isPending}
      />

      <CourseEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        courseId={selectedCourseId}
        onSave={handleEditSave}
        saving={updateCourse.isPending}
      />
    </motion.div>
  );
}

export { CoursesPageContent };
