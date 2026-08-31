"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  Upload,
  ChevronDown,
  ArrowUpDown,
  MapPin,
  SlidersHorizontal,
  Play,
  Users,
  LayoutGrid,
  Eye,
  Lock,
  Globe,
  BadgePercent,
  Send,
  RotateCcw,
  Trash2,
  ListChecks,
  FileX,
} from "lucide-react";
import {
  AppButton,
  PermissionGuard,
  AppPagination,
  AppCheckbox,
  AppConfirmDialog,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import {
  useCourses,
  useCoursesMetrics,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  usePublishCourse,
  useArchiveCourse,
  useRestoreCourse,
  useDuplicateCourse,
  useToggleFeatureCourse,
  useBulkPublishCourses,
  useBulkArchiveCourses,
  useBulkRestoreCourses,
  useBulkDeleteCourses,
  useBulkToggleFeatureCourses,
} from "@/features/courses/hooks";
import { useCategories } from "@/features/course-categories/hooks";
import { CourseCreatePanel } from "@/features/courses/components/CourseCreatePanel";
import { CourseEditDrawer } from "@/features/courses/components/CourseEditDrawer";
import { CourseBlock } from "./CourseBlock";
import { useStudioPrefs } from "./studio/studio-prefs";
import { cn } from "@/lib/cn";
import { formatNumber, formatDate } from "@/lib/format";
import type {
  Course,
  CourseStatus,
  CourseVisibility,
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
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

type SortValue = "newest" | "oldest" | "most_students" | "most_revenue" | "title";

const COURSES_PER_PAGE = 12;

interface FilterState {
  status: CourseStatus | null;
  visibility: CourseVisibility | null;
  difficulty: CourseDifficulty | null;
  pricingType: PricingType | null;
  featured: boolean | null;
  language: string | null;
  categoryId: string | null;
  sort: SortValue;
}

const initialFilters: FilterState = {
  status: null,
  visibility: null,
  difficulty: null,
  pricingType: null,
  featured: null,
  language: null,
  categoryId: null,
  sort: "newest",
};

const STATUS_CHIPS: Array<{ key: "status"; value: CourseStatus; label: string; icon: React.ElementType }> = [
  { key: "status", value: "published", label: "منشور", icon: CheckCircle2 },
  { key: "status", value: "draft", label: "مسودة", icon: PenLine },
  { key: "status", value: "archived", label: "مؤرشف", icon: Archive },
];

const VISIBILITY_OPTIONS: Array<{ value: CourseVisibility; label: string; icon: React.ElementType }> = [
  { value: "public", label: "عام", icon: Globe },
  { value: "private", label: "خاص", icon: Lock },
  { value: "unlisted", label: "مخفي", icon: Eye },
];

const DIFFICULTY_OPTIONS: Array<{ value: CourseDifficulty; label: string }> = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
  { value: "all_levels", label: "جميع المستويات" },
];

const PRICING_OPTIONS: Array<{ value: PricingType; label: string }> = [
  { value: "free", label: "مجاني" },
  { value: "one_time", label: "مدفوع" },
  { value: "subscription", label: "اشتراك" },
];

const LANGUAGE_OPTIONS_LIST: Array<{ value: string; label: string }> = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ur", label: "اردو" },
];

const SORT_OPTIONS: Array<{ value: SortValue; label: string; icon: React.ElementType }> = [
  { value: "newest", label: "الأحدث", icon: Clock },
  { value: "oldest", label: "الأقدم", icon: Clock },
  { value: "most_students", label: "الأكثر طلاباً", icon: Users },
  { value: "most_revenue", label: "الأكثر إيراداً", icon: BadgePercent },
  { value: "title", label: "الترتيب الأبجدي", icon: ArrowUpDown },
];

function buildFilterParams(
  search: string,
  filters: FilterState,
  page: number,
  perPage: number,
): CourseFilterParams {
  const params: CourseFilterParams = { per_page: perPage, page };

  if (search) params.search = search;

  if (filters.status) params.status = filters.status;
  if (filters.visibility) params.visibility = filters.visibility;
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.pricingType) params.pricing_type = filters.pricingType;
  if (filters.featured !== null) params.featured = filters.featured;
  if (filters.language) params.language = filters.language;
  if (filters.categoryId) params.category_id = Number(filters.categoryId);

  switch (filters.sort) {
    case "newest":
      params.sort = "created_at";
      params.sort_dir = "desc";
      break;
    case "oldest":
      params.sort = "created_at";
      params.sort_dir = "asc";
      break;
    case "most_students":
      params.sort = "students_count";
      params.sort_dir = "desc";
      break;
    case "most_revenue":
      params.sort = "price_amount";
      params.sort_dir = "desc";
      break;
    case "title":
      params.sort = "title";
      params.sort_dir = "asc";
      break;
  }

  return params;
}

function CoursesHomeContent() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pinnedCourseIds = useStudioPrefs((s) => s.pinnedCourseIds);
  const togglePin = useStudioPrefs((s) => s.togglePinned);

  const resetPageAndSelection = useCallback(() => {
    setPage(1);
    setSelectedCourseIds(new Set());
  }, []);

  /* ── Debounced search ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      resetPageAndSelection();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, resetPageAndSelection]);

  /* ── Query params ── */
  const queryParams = useMemo(
    () => buildFilterParams(searchQuery, filters, page, COURSES_PER_PAGE),
    [searchQuery, filters, page],
  );

  /* ── Data fetching ── */
  const coursesQuery = useCourses(queryParams);
  const categoriesQuery = useCategories({ per_page: 100 });
  const metricsQuery = useCoursesMetrics();

  /* ── Mutations ── */
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const publishCourse = usePublishCourse();
  const archiveCourse = useArchiveCourse();
  const restoreCourse = useRestoreCourse();
  const duplicateCourse = useDuplicateCourse();
  const toggleFeature = useToggleFeatureCourse();
  const bulkPublish = useBulkPublishCourses();
  const bulkArchive = useBulkArchiveCourses();
  const bulkRestore = useBulkRestoreCourses();
  const bulkDelete = useBulkDeleteCourses();
  const bulkToggleFeature = useBulkToggleFeatureCourses();

  const bulkPending =
    bulkPublish.isPending ||
    bulkArchive.isPending ||
    bulkRestore.isPending ||
    bulkDelete.isPending ||
    bulkToggleFeature.isPending;

  /* ── Derived data ── */
  const allCourses = coursesQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const isLoading = coursesQuery.isLoading;
  const isError = coursesQuery.isError;

  const pinnedCourses = useMemo(
    () => allCourses.filter((c) => pinnedCourseIds.includes(c.id)),
    [allCourses, pinnedCourseIds],
  );

  const unpinnedCourses = useMemo(
    () => allCourses.filter((c) => !pinnedCourseIds.includes(c.id)),
    [allCourses, pinnedCourseIds],
  );

  /* ── Pagination meta ── */
  const totalCourses = coursesQuery.data?.total ?? 0;
  const lastPage = coursesQuery.data?.lastPage ?? 1;

  /* ── Selection state ── */
  const selectedCount = selectedCourseIds.size;
  const allPageSelected =
    allCourses.length > 0 &&
    allCourses.every((c) => selectedCourseIds.has(c.id));
  const somePageSelected = allCourses.some((c) =>
    selectedCourseIds.has(c.id),
  );

  const continueCourses = useMemo(
    () =>
      [...allCourses]
        .filter(
          (c) =>
            c.status === "draft" &&
            (c.sectionsCount > 0 || c.lessonsCount > 0),
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime(),
        )
        .slice(0, 6),
    [allCourses],
  );

  const hasActiveFilters = useMemo(
    () =>
      searchQuery !== "" ||
      filters.status !== null ||
      filters.visibility !== null ||
      filters.difficulty !== null ||
      filters.pricingType !== null ||
      filters.featured !== null ||
      filters.language !== null ||
      filters.categoryId !== null ||
      filters.sort !== "newest",
    [searchQuery, filters],
  );

  const isPageOutOfRange = totalCourses > 0 && allCourses.length === 0 && page > lastPage;
  const showNoCourses =
    !isLoading && !isError && !isPageOutOfRange && allCourses.length === 0 && !hasActiveFilters;
  const showEmptySearch =
    !isLoading && !isError && !isPageOutOfRange && allCourses.length === 0 && hasActiveFilters;

  /* ── Handlers ── */

  const handleSearchToggle = useCallback(() => {
    setShowSearch((prev) => !prev);
    if (!showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  const handleCreateSave = useCallback(
    (data: CreateCoursePayload) => {
      createCourse.mutate(data, {
        onSuccess: () => setCreateDrawerOpen(false),
      });
    },
    [createCourse],
  );

  const handleEditSave = useCallback(
    (id: string, data: UpdateCoursePayload) => {
      updateCourse.mutate(
        { id, data },
        { onSuccess: () => setEditDrawerOpen(false) },
      );
    },
    [updateCourse],
  );

  const handleOpenEdit = useCallback((course: Course) => {
    setSelectedCourseId(course.id);
    setEditDrawerOpen(true);
  }, []);

  const handleDuplicate = useCallback(
    (course: Course) => duplicateCourse.mutate(course.id),
    [duplicateCourse],
  );

  const handlePublish = useCallback(
    (course: Course) => {
      publishCourse.mutate(course.id, {
        onSuccess: () => {
          toast.success(`تم نشر "${course.title}" بنجاح`);
        },
        onError: () => {
          toast.error(`فشل نشر "${course.title}"`);
        },
      });
    },
    [publishCourse],
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

  const handleTogglePin = useCallback(
    (courseId: string) => togglePin(courseId),
    [togglePin],
  );

  const handleDelete = useCallback(
    (course: Course) => {
      if (window.confirm(`هل أنت متأكد من حذف "${course.title}"؟`)) {
        deleteCourse.mutate(course.id);
      }
    },
    [deleteCourse],
  );

  /* ── Selection handlers ── */
  const handleSelectCourse = useCallback((course: Course) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(course.id)) {
        next.delete(course.id);
      } else {
        next.add(course.id);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      const shouldSelectAll =
        allCourses.length > 0 &&
        !allCourses.every((c) => next.has(c.id));
      if (shouldSelectAll) {
        allCourses.forEach((c) => next.add(c.id));
      } else {
        allCourses.forEach((c) => next.delete(c.id));
      }
      return next;
    });
  }, [allCourses]);

  const clearSelection = useCallback(() => {
    setSelectedCourseIds(new Set());
  }, []);

  const updateFilters = useCallback(
    (updater: (prev: FilterState) => FilterState) => {
      setFilters(updater);
      resetPageAndSelection();
    },
    [resetPageAndSelection],
  );

  /* ── Bulk actions ── */
  const handleBulkAction = useCallback(
    (action: "publish" | "archive" | "restore" | "toggle_feature" | "delete") => {
      const ids = [...selectedCourseIds];
      if (ids.length === 0) return;
      const onError = () => toast.error("حدث خطأ أثناء تنفيذ الإجراء");
      switch (action) {
        case "publish":
          bulkPublish.mutate(ids, {
            onSuccess: () => {
              toast.success(`تم نشر ${ids.length} دورة بنجاح`);
              clearSelection();
            },
            onError,
          });
          break;
        case "archive":
          bulkArchive.mutate(ids, {
            onSuccess: () => {
              toast.success(`تمت أرشفة ${ids.length} دورة بنجاح`);
              clearSelection();
            },
            onError,
          });
          break;
        case "restore":
          bulkRestore.mutate(ids, {
            onSuccess: () => {
              toast.success(`تمت استعادة ${ids.length} دورة بنجاح`);
              clearSelection();
            },
            onError,
          });
          break;
        case "toggle_feature":
          bulkToggleFeature.mutate(ids, {
            onSuccess: () => {
              toast.success(`تم تحديث التميز لـ ${ids.length} دورة`);
              clearSelection();
            },
            onError,
          });
          break;
        case "delete":
          setBulkDeleteOpen(true);
          break;
      }
    },
    [selectedCourseIds, bulkPublish, bulkArchive, bulkRestore, bulkToggleFeature, clearSelection],
  );

  const confirmBulkDelete = useCallback(() => {
    const ids = [...selectedCourseIds];
    if (ids.length === 0) return;
    bulkDelete.mutate(ids, {
      onSuccess: () => {
        toast.success(`تم حذف ${ids.length} دورة بنجاح`);
        setBulkDeleteOpen(false);
        clearSelection();
      },
      onError: () => {
        toast.error("فشل حذف الدورات المحددة");
        setBulkDeleteOpen(false);
      },
    });
  }, [selectedCourseIds, bulkDelete, clearSelection]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setFilters(initialFilters);
    resetPageAndSelection();
  }, [resetPageAndSelection]);

  const setStatusFilter = useCallback(
    (value: CourseStatus | null) => {
      updateFilters((prev) => ({
        ...prev,
        status: prev.status === value ? null : value,
      }));
    },
    [updateFilters],
  );
  const setFeaturedFilter = useCallback(() => {
    updateFilters((prev) => ({
      ...prev,
      featured: prev.featured === true ? null : true,
    }));
  }, [updateFilters]);
  const setVisibilityFilter = useCallback(
    (value: CourseVisibility | null) => {
      updateFilters((prev) => ({
        ...prev,
        visibility: prev.visibility === value ? null : value,
      }));
    },
    [updateFilters],
  );
  const setPricingFilter = useCallback(
    (value: PricingType | null) => {
      updateFilters((prev) => ({
        ...prev,
        pricingType: prev.pricingType === value ? null : value,
      }));
    },
    [updateFilters],
  );
  const setDifficultyFilter = useCallback(
    (value: CourseDifficulty | null) => {
      updateFilters((prev) => ({
        ...prev,
        difficulty: prev.difficulty === value ? null : value,
      }));
    },
    [updateFilters],
  );
  const setLanguageFilter = useCallback(
    (value: string | null) => {
      updateFilters((prev) => ({
        ...prev,
        language: prev.language === value ? null : value,
      }));
    },
    [updateFilters],
  );
  const setCategoryFilter = useCallback(
    (value: string | null) => {
      updateFilters((prev) => ({
        ...prev,
        categoryId: prev.categoryId === value ? null : value,
      }));
    },
    [updateFilters],
  );

  const cycleSort = useCallback(() => {
    const sortValues: SortValue[] = [
      "newest",
      "oldest",
      "most_students",
      "most_revenue",
      "title",
    ];
    updateFilters((prev) => {
      const idx = sortValues.indexOf(prev.sort);
      return { ...prev, sort: sortValues[(idx + 1) % sortValues.length] } as FilterState;
    });
  }, [updateFilters]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? "الأحدث";

  /* ── Stats ── */
  const stats = useMemo(
    () => ({
      total: totalCourses,
      published:
        metricsQuery.data?.published ??
        allCourses.filter((c) => c.status === "published").length,
      draft:
        metricsQuery.data?.draft ??
        allCourses.filter((c) => c.status === "draft").length,
      archived:
        metricsQuery.data?.archived ??
        allCourses.filter((c) => c.status === "archived").length,
      students: allCourses.reduce((s, c) => s + c.studentsCount, 0),
    }),
    [totalCourses, metricsQuery.data, allCourses],
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "pb-20 transition-[padding] duration-300 ease-out",
        createDrawerOpen && "lg:pe-[480px]",
      )}
    >
      {/* ── Loading State ── */}
      {isLoading && (
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="h-14 w-56 animate-pulse rounded-2xl bg-tenant-soft/50" />
            <div className="h-6 w-80 animate-pulse rounded-lg bg-tenant-soft/30" />
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-28 animate-pulse rounded-full bg-tenant-soft/40"
              />
            ))}
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-44 w-[400px] shrink-0 animate-pulse rounded-2xl bg-tenant-soft/30"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-tenant-soft/30 overflow-hidden"
              >
                <div className="aspect-[16/10] bg-tenant-soft/40" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded-lg bg-tenant-soft/40" />
                  <div className="h-3 w-1/2 rounded-lg bg-tenant-soft/30" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-tenant-soft/30" />
                    <div className="h-5 w-16 rounded-full bg-tenant-soft/30" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-tenant-soft/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error State ── */}
      {isError && (
        <motion.div
          variants={fadeUpItem}
          className="flex flex-col items-center justify-center gap-6 py-32"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-destructive/10">
            <BookOpen className="h-10 w-10 text-destructive/40" />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-bold text-tenant-fg">
              فشل تحميل الدورات
            </h3>
            <p className="text-sm text-tenant-fg-muted/60">
              حدث خطأ أثناء تحميل الدورات. حاول مرة أخرى.
            </p>
          </div>
          <AppButton
            variant="outline"
            size="sm"
            onClick={() => coursesQuery.refetch()}
          >
            إعادة المحاولة
          </AppButton>
        </motion.div>
      )}

      {/* ── Main Content ── */}
      {!isLoading && !isError && (
        <>
          {/* ═══ 1. Editorial Header ═══ */}
          <motion.div variants={fadeUpItem} className="mb-10">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold tracking-tight text-tenant-fg sm:text-6xl lg:text-7xl">
                كورساتي
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-tenant-fg-muted/60 sm:text-lg">
                قم بإنشاء وتنظيم دوراتك التعليمية. مساحة العمل الإبداعية
                للمعلمين.
              </p>
            </div>
          </motion.div>

          {/* ═══ 2. Primary Actions ═══ */}
          <motion.div
            variants={fadeUpItem}
            className="mb-8 flex flex-wrap items-center gap-3"
          >
            <PermissionGuard permission="courses.create">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCreateDrawerOpen(true)}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-tenant-accent px-6 py-3 text-sm font-semibold text-tenant-accent-fg shadow-lg shadow-tenant-accent/20 transition-all duration-200 hover:bg-tenant-accent/90 hover:shadow-xl hover:shadow-tenant-accent/25"
              >
                <Plus className="h-4 w-4" />
                إنشاء دورة
              </motion.button>
            </PermissionGuard>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {}}
              className="inline-flex items-center gap-2 rounded-2xl border border-tenant-border/50 bg-tenant-surface px-5 py-3 text-sm font-medium text-tenant-fg-muted/70 transition-all duration-200 hover:bg-tenant-soft hover:text-tenant-fg hover:border-tenant-border/70"
            >
              <Upload className="h-4 w-4" />
              استيراد
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearchToggle}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition-all duration-200",
                showSearch
                  ? "border-tenant-accent/30 bg-tenant-accent/10 text-tenant-accent"
                  : "border-tenant-border/50 bg-tenant-surface text-tenant-fg-muted/70 hover:bg-tenant-soft hover:text-tenant-fg hover:border-tenant-border/70",
              )}
              aria-label="بحث"
            >
              <Search className="h-4 w-4" />
              بحث
            </motion.button>
          </motion.div>

          {/* ═══ 3. Global Search ═══ */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                variants={fadeUpItem}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8"
              >
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-5">
                    <Search className="h-5 w-5 text-tenant-fg-muted/30" />
                  </div>
                  <input
                    ref={searchInputRef}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="ابحث عن دورة..."
                    className="flex h-16 w-full rounded-2xl border border-tenant-border/40 bg-tenant-surface ps-13 pe-13 text-base shadow-lg shadow-tenant-accent/5 backdrop-blur-sm placeholder:text-tenant-fg-muted/40 transition-all duration-300 focus-visible:border-tenant-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-ring/30"
                    aria-label="ابحث عن دورة"
                  />
                  {searchInput && (
                    <button
                      onClick={() => {
                        setSearchInput("");
                        setSearchQuery("");
                        resetPageAndSelection();
                      }}
                      className="absolute inset-y-0 end-0 flex items-center pe-5 text-tenant-fg-muted/30 hover:text-tenant-fg transition-colors"
                      aria-label="مسح البحث"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ 4. Smart Filters ═══ */}
          <motion.div variants={fadeUpItem} className="mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status pills */}
              {STATUS_CHIPS.map((chip) => {
                const Icon = chip.icon;
                const isActive = filters.status === chip.value;
                return (
                  <motion.button
                    key={`status-${chip.value}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      setStatusFilter(chip.value)
                    }
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                      isActive
                        ? "border-tenant-accent/20 bg-tenant-accent/10 text-tenant-accent shadow-sm"
                        : "border-tenant-border/40 bg-tenant-surface/60 text-tenant-fg-muted/60 hover:bg-tenant-soft/60 hover:text-tenant-fg",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        isActive ? "opacity-100" : "opacity-50",
                      )}
                    />
                    {chip.label}
                  </motion.button>
                );
              })}

              <div className="h-5 w-px bg-tenant-border/40 mx-1" />

              {/* Featured pill */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={setFeaturedFilter}
                aria-pressed={filters.featured === true}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                  filters.featured === true
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "border-tenant-border/40 bg-tenant-surface/60 text-tenant-fg-muted/60 hover:bg-tenant-soft/60 hover:text-tenant-fg",
                )}
              >
                <Sparkles
                  className={cn(
                    "h-3.5 w-3.5",
                    filters.featured === true
                      ? "opacity-100"
                      : "opacity-50",
                  )}
                />
                مميز
              </motion.button>

              {/* Visibility pill */}
              <div className="relative">
                <select
                  value={filters.visibility ?? ""}
                  onChange={(e) =>
                    setVisibilityFilter(
                      (e.target.value || null) as CourseVisibility | null,
                    )
                  }
                  className={cn(
                    "appearance-none rounded-full border px-3.5 py-1.5 pe-8 text-xs font-medium cursor-pointer transition-all duration-200",
                    filters.visibility
                      ? "border-tenant-accent/20 bg-tenant-accent/10 text-tenant-accent"
                      : "border-tenant-border/40 bg-tenant-surface/60 text-tenant-fg-muted/60 hover:bg-tenant-soft/60 hover:text-tenant-fg",
                  )}
                  aria-label="تصفية: الظهور"
                >
                  <option value="">الظهور</option>
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={cn(
                    "pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-3 w-3",
                    filters.visibility
                      ? "text-tenant-accent"
                      : "text-tenant-fg-muted/40",
                  )}
                />
              </div>

              {/* Pricing pill */}
              <div className="relative">
                <select
                  value={filters.pricingType ?? ""}
                  onChange={(e) =>
                    setPricingFilter(
                      (e.target.value || null) as PricingType | null,
                    )
                  }
                  className={cn(
                    "appearance-none rounded-full border px-3.5 py-1.5 pe-8 text-xs font-medium cursor-pointer transition-all duration-200",
                    filters.pricingType
                      ? "border-tenant-accent/20 bg-tenant-accent/10 text-tenant-accent"
                      : "border-tenant-border/40 bg-tenant-surface/60 text-tenant-fg-muted/60 hover:bg-tenant-soft/60 hover:text-tenant-fg",
                  )}
                  aria-label="تصفية: السعر"
                >
                  <option value="">السعر</option>
                  {PRICING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={cn(
                    "pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-3 w-3",
                    filters.pricingType
                      ? "text-tenant-accent"
                      : "text-tenant-fg-muted/40",
                  )}
                />
              </div>

              {/* More filters toggle */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAllFilters((p) => !p)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                  showAllFilters || hasActiveFilters
                    ? "border-tenant-accent/20 bg-tenant-accent/10 text-tenant-accent"
                    : "border-tenant-border/40 bg-tenant-surface/60 text-tenant-fg-muted/60 hover:bg-tenant-soft/60 hover:text-tenant-fg",
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                المزيد
              </motion.button>

              {/* Sort cycle button */}
              <div className="me-auto" />

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={cycleSort}
                className="inline-flex items-center gap-1.5 rounded-full border border-tenant-border/40 bg-tenant-surface/60 px-3.5 py-1.5 text-xs font-medium text-tenant-fg-muted/60 hover:bg-tenant-soft/60 hover:text-tenant-fg transition-all duration-200"
                aria-label="ترتيب"
              >
                <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                {activeSortLabel}
              </motion.button>

              {/* Stats badge */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-tenant-fg-muted/40">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>{formatNumber(stats.total)} دورة</span>
              </div>
            </div>

            {/* Expanded filters */}
            <AnimatePresence>
              {showAllFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-3 flex flex-wrap items-center gap-2 overflow-hidden"
                >
                  {/* Difficulty */}
                  <div className="relative">
                    <select
                      value={filters.difficulty ?? ""}
                      onChange={(e) =>
                        setDifficultyFilter(
                          (e.target.value || null) as CourseDifficulty | null,
                        )
                      }
                      className={cn(
                        "appearance-none rounded-full border px-3.5 py-1.5 pe-8 text-xs font-medium cursor-pointer transition-all duration-200",
                        filters.difficulty
                          ? "border-tenant-accent/20 bg-tenant-accent/10 text-tenant-accent"
                          : "border-tenant-border/40 bg-tenant-surface/60 text-tenant-fg-muted/60 hover:bg-tenant-soft/60 hover:text-tenant-fg",
                      )}
                      aria-label="تصفية: المستوى"
                    >
                      <option value="">المستوى</option>
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className={cn(
                        "pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-3 w-3",
                        filters.difficulty
                          ? "text-tenant-accent"
                          : "text-tenant-fg-muted/40",
                      )}
                    />
                  </div>

                  {/* Language */}
                  <div className="relative">
                    <select
                      value={filters.language ?? ""}
                      onChange={(e) =>
                        setLanguageFilter(e.target.value || null)
                      }
                      className={cn(
                        "appearance-none rounded-full border px-3.5 py-1.5 pe-8 text-xs font-medium cursor-pointer transition-all duration-200",
                        filters.language
                          ? "border-tenant-accent/20 bg-tenant-accent/10 text-tenant-accent"
                          : "border-tenant-border/40 bg-tenant-surface/60 text-tenant-fg-muted/60 hover:bg-tenant-soft/60 hover:text-tenant-fg",
                      )}
                      aria-label="تصفية: اللغة"
                    >
                      <option value="">اللغة</option>
                      {LANGUAGE_OPTIONS_LIST.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className={cn(
                        "pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-3 w-3",
                        filters.language
                          ? "text-tenant-accent"
                          : "text-tenant-fg-muted/40",
                      )}
                    />
                  </div>

                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="relative">
                      <select
                        value={filters.categoryId ?? ""}
                        onChange={(e) =>
                          setCategoryFilter(e.target.value || null)
                        }
                        className={cn(
                          "appearance-none rounded-full border px-3.5 py-1.5 pe-8 text-xs font-medium cursor-pointer transition-all duration-200",
                          filters.categoryId
                            ? "border-tenant-accent/20 bg-tenant-accent/10 text-tenant-accent"
                            : "border-tenant-border/40 bg-tenant-surface/60 text-tenant-fg-muted/60 hover:bg-tenant-soft/60 hover:text-tenant-fg",
                        )}
                        aria-label="تصفية: التصنيف"
                      >
                        <option value="">التصنيف</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className={cn(
                          "pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-3 w-3",
                          filters.categoryId
                            ? "text-tenant-accent"
                            : "text-tenant-fg-muted/40",
                        )}
                      />
                    </div>
                  )}

                  {/* Clear filters */}
                  {hasActiveFilters && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive/70 hover:bg-destructive/10 transition-all"
                    >
                      <X className="h-3 w-3" />
                      مسح الكل
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ═══ Empty States ═══ */}
          {showNoCourses && (
            <motion.div
              variants={fadeUpItem}
              className="flex flex-col items-center justify-center gap-8 py-32"
            >
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-tenant-accent/10 via-tenant-accent/5 to-transparent ring-8 ring-tenant-bg">
                  <BookOpen className="h-16 w-16 text-tenant-accent/20" />
                </div>
                <div className="absolute -bottom-2 -end-2 flex h-10 w-10 items-center justify-center rounded-xl bg-tenant-accent/10">
                  <Sparkles className="h-5 w-5 text-tenant-accent" />
                </div>
              </div>
              <div className="max-w-lg space-y-3 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-tenant-fg">
                  ابدأ رحلتك التعليمية
                </h2>
                <p className="text-sm leading-relaxed text-tenant-fg-muted/60">
                  أنشئ أول دورة تدريبية لك لتقديم تجربة تعليمية
                  متكاملة لطلابك.
                </p>
              </div>
              <PermissionGuard permission="courses.create">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCreateDrawerOpen(true)}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-tenant-accent px-6 py-3 text-sm font-semibold text-tenant-accent-fg shadow-lg shadow-tenant-accent/20 transition-all duration-200 hover:bg-tenant-accent/90 hover:shadow-xl hover:shadow-tenant-accent/25"
                >
                  <Plus className="h-4 w-4" />
                  إنشاء أول دورة
                </motion.button>
              </PermissionGuard>
            </motion.div>
          )}

          {showEmptySearch && (
            <motion.div
              variants={fadeUpItem}
              className="flex flex-col items-center justify-center gap-4 py-24"
            >
              <Search className="h-12 w-12 text-tenant-fg-muted/20" />
              <div className="space-y-1 text-center">
                <h3 className="text-base font-bold text-tenant-fg">
                  لا توجد نتائج للبحث
                </h3>
                <p className="text-sm text-tenant-fg-muted/60">
                  حاول تغيير كلمات البحث أو مسح التصفية
                </p>
              </div>
              <AppButton
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                مسح التصفية
              </AppButton>
            </motion.div>
          )}

          {/* ═══ Page Out of Range (bulk delete/archive on last page) ═══ */}
          {isPageOutOfRange && (
            <motion.div
              variants={fadeUpItem}
              className="flex flex-col items-center justify-center gap-4 py-24"
            >
              <FileX className="h-12 w-12 text-tenant-fg-muted/20" />
              <div className="space-y-1 text-center">
                <h3 className="text-base font-bold text-tenant-fg">
                  هذه الصفحة لم تعد متوفرة
                </h3>
                <p className="text-sm text-tenant-fg-muted/60">
                  تم حذف أو أرشفة أحدث الدورات في هذه الصفحة
                </p>
              </div>
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => setPage(lastPage)}
              >
                الانتقال إلى الصفحة السابقة
              </AppButton>
            </motion.div>
          )}

          {/* ═══ Courses Exist ═══ */}
          {!showNoCourses && !showEmptySearch && allCourses.length > 0 && (
            <motion.div variants={containerVariants} className="space-y-12">
              {/* ═══ 5. Selection Toolbar ═══ */}
              <motion.div variants={fadeUpItem}>
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border px-4 py-3 transition-colors duration-300",
                    selectedCount > 0
                      ? "border-tenant-accent/25 bg-tenant-accent/5"
                      : "border-tenant-border/40 bg-tenant-surface/60",
                  )}
                >
                  {/* Select all */}
                  <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-tenant-fg-muted/70 transition-colors hover:text-tenant-fg">
                    <AppCheckbox
                      checked={
                        allPageSelected
                          ? true
                          : somePageSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="تحديد الكل"
                    />
                    <span>تحديد الكل</span>
                    <span className="rounded-full bg-tenant-soft/80 px-2 py-0.5 text-[11px] font-semibold text-tenant-fg-muted/60">
                      {formatNumber(allCourses.length)}
                    </span>
                  </label>

                  <div className="hidden h-5 w-px bg-tenant-border/40 sm:block" />

                  {selectedCount > 0 ? (
                    <span className="text-sm text-tenant-fg-muted/70">
                      تم تحديد{" "}
                      <span className="font-bold text-tenant-accent">
                        {formatNumber(selectedCount)}
                      </span>{" "}
                      دورة
                    </span>
                  ) : (
                    <span className="text-xs text-tenant-fg-muted/40">
                      اختر الدورات لتنفيذ إجراء جماعي عليها
                    </span>
                  )}

                  <div className="ms-auto flex items-center gap-2">
                    <PermissionGuard permission="courses.update">
                      <AppDropdownMenu>
                        <AppDropdownMenuTrigger asChild>
                          <AppButton
                            variant="outline"
                            size="sm"
                            disabled={selectedCount === 0 || bulkPending}
                            loading={bulkPending}
                          >
                            <ListChecks className="h-4 w-4" />
                            الأكشنز
                            {selectedCount > 0 && (
                              <span className="rounded-full bg-tenant-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-tenant-accent">
                                {selectedCount}
                              </span>
                            )}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </AppButton>
                        </AppDropdownMenuTrigger>
                        <AppDropdownMenuContent align="end" className="w-52">
                          <AppDropdownMenuItem
                            onClick={() => handleBulkAction("publish")}
                          >
                            <Send className="ms-2 h-4 w-4" />
                            نشر
                          </AppDropdownMenuItem>
                          <AppDropdownMenuItem
                            onClick={() => handleBulkAction("archive")}
                          >
                            <Archive className="ms-2 h-4 w-4" />
                            أرشفة
                          </AppDropdownMenuItem>
                          <AppDropdownMenuItem
                            onClick={() => handleBulkAction("restore")}
                          >
                            <RotateCcw className="ms-2 h-4 w-4" />
                            استعادة
                          </AppDropdownMenuItem>
                          <AppDropdownMenuItem
                            onClick={() =>
                              handleBulkAction("toggle_feature")
                            }
                          >
                            <Sparkles className="ms-2 h-4 w-4" />
                            تمييز / إلغاء التميز
                          </AppDropdownMenuItem>
                          <AppDropdownMenuSeparator />
                          <PermissionGuard permission="courses.delete">
                            <AppDropdownMenuItem
                              onClick={() => handleBulkAction("delete")}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="ms-2 h-4 w-4" />
                              حذف
                            </AppDropdownMenuItem>
                          </PermissionGuard>
                        </AppDropdownMenuContent>
                      </AppDropdownMenu>
                    </PermissionGuard>

                    {selectedCount > 0 && (
                      <AppButton
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                      >
                        إلغاء التحديد
                      </AppButton>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ═══ 6. Continue Working ═══ */}
              {continueCourses.length > 0 &&
                page === 1 &&
                !hasActiveFilters &&
                !searchQuery && (
                  <motion.section variants={fadeUpItem}>
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tenant-accent/10">
                        <Clock className="h-4 w-4 text-tenant-accent" />
                      </div>
                      <h2 className="text-sm font-bold text-tenant-fg tracking-tight">
                        أكمل العمل
                      </h2>
                      <span className="text-xs text-tenant-fg-muted/40">
                        ({continueCourses.length})
                      </span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                      {continueCourses.map((course) => (
                        <ContinueCourseCard
                          key={course.id}
                          course={course}
                        />
                      ))}
                    </div>
                  </motion.section>
                )}

{/* ═══ 7. Pinned Courses ═══ */}
              {pinnedCourses.length > 0 &&
                page === 1 &&
                !hasActiveFilters &&
                !searchQuery && (
                <motion.section variants={fadeUpItem}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                      <MapPin className="h-4 w-4 text-amber-500" />
                    </div>
                    <h2 className="text-sm font-bold text-tenant-fg tracking-tight">
                      مثبت
                    </h2>
                    <span className="text-xs text-tenant-fg-muted/40">
                      ({pinnedCourses.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pinnedCourses.map((course, i) => (
                      <CourseBlock
                        key={course.id}
                        course={course}
                        index={i}
                        isPinned
                        selected={selectedCourseIds.has(course.id)}
                        onToggleSelect={handleSelectCourse}
                        onEdit={handleOpenEdit}
                        onPublish={handlePublish}
                        onDuplicate={handleDuplicate}
                        onArchive={handleArchive}
                        onRestore={handleRestore}
                        onDelete={handleDelete}
                        onToggleFeature={handleToggleFeature}
                        onTogglePin={handleTogglePin}
                      />
                    ))}
                  </div>
                </motion.section>
                )}

              {/* ═══ 8. All Courses ═══ */}
              <motion.section variants={fadeUpItem}>
                <div className="mb-4 flex items-center gap-2">
                  {(pinnedCourses.length > 0 ||
                    hasActiveFilters ||
                    searchQuery) && (
                    <>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tenant-accent/10">
                        <BookOpen className="h-4 w-4 text-tenant-accent" />
                      </div>
                      <h2 className="text-sm font-bold text-tenant-fg tracking-tight">
                        {hasActiveFilters || searchQuery
                          ? "نتائج البحث"
                          : "جميع الدورات"}
                      </h2>
                      <span className="text-xs text-tenant-fg-muted/40">
                        ({unpinnedCourses.length})
                      </span>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {unpinnedCourses.map((course, i) => (
                    <CourseBlock
                      key={course.id}
                      course={course}
                      index={i}
                      isPinned={pinnedCourseIds.includes(course.id)}
                      selected={selectedCourseIds.has(course.id)}
                      onToggleSelect={handleSelectCourse}
                      onEdit={handleOpenEdit}
                      onPublish={handlePublish}
                      onDuplicate={handleDuplicate}
                      onArchive={handleArchive}
                      onRestore={handleRestore}
                      onDelete={handleDelete}
                      onToggleFeature={handleToggleFeature}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              </motion.section>

              {/* ═══ 9. Pagination ═══ */}
              <motion.div variants={fadeUpItem}>
                <AppPagination
                  currentPage={coursesQuery.data?.currentPage ?? page}
                  lastPage={lastPage}
                  total={totalCourses}
                  onPageChange={(p) => {
                    setPage(p);
                    setSelectedCourseIds(new Set());
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </motion.div>

              {/* Footer */}
              <motion.div
                variants={fadeUpItem}
                className="flex items-center justify-center gap-2 pb-8 text-xs text-tenant-fg-muted/20"
              >
                <Sparkles className="h-3 w-3" />
                <span>إجمالي {formatNumber(totalCourses)} دورة</span>
              </motion.div>
            </motion.div>
          )}
        </>
      )}

      {/* ═══ Drawers ═══ */}
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

      <AppConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="حذف الدورات المحددة"
        description={`هل أنت متأكد من حذف ${formatNumber(selectedCount)} دورة؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        destructive
        loading={bulkDelete.isPending}
        onConfirm={confirmBulkDelete}
      />
    </motion.div>
  );
}

/* ── Continue Course Card (horizontal carousel item) ── */

interface ContinueCourseCardProps {
  course: Course;
}

function ContinueCourseCard({ course }: ContinueCourseCardProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push(`/teacher/courses/${course.id}`);
  }, [router, course.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  const completion = useMemo(() => {
    if (course.status === "published") return 100;
    if (course.status === "archived") return 0;
    const total = (course.sectionsCount ?? 0) + (course.lessonsCount ?? 0);
    if (total === 0) return 0;
    return Math.min(
      100,
      Math.round(((course.sectionsCount ?? 0) / Math.max(total, 1)) * 50),
    );
  }, [course]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      role="button"
      tabIndex={0}
      aria-label={`أكمل العمل على ${course.title}`}
      className="group cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-ring focus-visible:ring-offset-2 focus-visible:ring-offset-tenant-bg shrink-0 w-[420px]"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileHover={{
        y: -2,
        transition: { type: "spring", stiffness: 300, damping: 24 },
      }}
    >
      <div className="flex overflow-hidden rounded-2xl border border-tenant-border/30 bg-tenant-surface shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-tenant-accent/5 group-hover:border-tenant-border/60">
        {/* Cover */}
        <div className="relative w-44 shrink-0 overflow-hidden bg-gradient-to-br from-tenant-soft to-tenant-surface sm:w-52">
          {course.coverImage || course.thumbnail ? (
            <>
              <img
                src={course.coverImage || course.thumbnail!}
                alt={course.title}
                loading="lazy"
                className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-tenant-surface via-tenant-surface/20 to-transparent opacity-60" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-8 w-8 text-tenant-fg-muted/20" />
            </div>
          )}
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tenant-surface/80 backdrop-blur-xl shadow-lg border border-tenant-border/30">
              <Play className="h-5 w-5 text-tenant-fg ms-0.5" />
            </div>
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
          <div className="space-y-1.5">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-tenant-fg transition-colors duration-300 group-hover:text-tenant-accent">
              {course.title}
            </h3>
            {course.instructor && (
              <div className="flex items-center gap-1.5 text-[11px] text-tenant-fg-muted/60">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-tenant-accent/20 to-tenant-accent/10 text-[7px] font-medium text-tenant-accent">
                  {course.instructor.avatar ? (
                    <img
                      src={course.instructor.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    course.instructor.name.charAt(0)
                  )}
                </div>
                <span className="truncate">{course.instructor.name}</span>
              </div>
            )}
          </div>

          <div className="mt-3 space-y-2.5">
            {/* Progress */}
            {completion > 0 && completion < 100 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-tenant-accent">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-tenant-soft">
                    <div
                      className="h-full rounded-full bg-tenant-accent/60 transition-all duration-700"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  <span className="shrink-0 font-medium">
                    {completion}%
                  </span>
                </div>
              </div>
            )}
            {completion === 100 && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-medium">مكتمل</span>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-tenant-accent/10 px-3.5 py-1.5 text-xs font-medium text-tenant-accent transition-all duration-200 hover:bg-tenant-accent/20">
              <Play className="h-3 w-3" />
              أكمل
            </span>
            <div className="flex items-center gap-1 text-[10px] text-tenant-fg-muted/40">
              <Clock className="h-3 w-3" />
              <span>{formatDate(course.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { CoursesHomeContent };
