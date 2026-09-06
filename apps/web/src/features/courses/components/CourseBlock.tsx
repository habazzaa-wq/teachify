"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Copy,
  Archive,
  Trash2,
  Sparkles,
  CheckCircle2,
  PenLine,
  Eye,
  RotateCcw,
  Clock,
  Layers,
  Globe,
  Lock,
  BadgePercent,
  Signal,
  MapPin,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  PermissionGuard,
  AppTooltip,
  AppTooltipTrigger,
  AppTooltipContent,
  AppTooltipProvider,
} from "@/components/ui";
import { COURSE_STATUS_CONFIG, COURSE_DIFFICULTY_CONFIG, COURSE_VISIBILITY_CONFIG } from "@/features/courses/constants";
import type { Course } from "@/features/courses/types";
import { formatNumber, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

interface CourseBlockProps {
  course: Course;
  index?: number;
  onEdit?: (course: Course) => void;
  onDuplicate?: (course: Course) => void;
  onArchive?: (course: Course) => void;
  onRestore?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  onToggleFeature?: (course: Course) => void;
  onTogglePin?: (courseId: string) => void;
  isPinned?: boolean;
}

const languageLabels: Record<string, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français",
  ur: "اردو",
};

const statusBadgeStyles: Record<string, string> = {
  published:
    "bg-emerald-500/90 text-emerald-50 border-emerald-400/30",
  draft: "bg-amber-500/90 text-amber-50 border-amber-400/30",
  archived: "bg-tenant-fg-muted/60 text-tenant-bg border-transparent",
  review: "bg-blue-500/90 text-blue-50 border-blue-400/30",
  scheduled: "bg-secondary/90 text-secondary-foreground border-secondary/30",
};

const visibilityIcons: Record<string, React.ReactNode> = {
  private: <Lock className="h-3 w-3" />,
  public: <Globe className="h-3 w-3" />,
  unlisted: <Eye className="h-3 w-3" />,
};

const difficultyGradients: Record<string, string> = {
  beginner: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  intermediate: "from-amber-500/20 via-amber-500/5 to-transparent",
  advanced: "from-rose-500/20 via-rose-500/5 to-transparent",
  all_levels: "from-primary/20 via-primary/5 to-transparent",
};

function getContentCount(course: Course): number {
  return (course.sectionsCount ?? 0) + (course.lessonsCount ?? 0);
}

function getCompletionPercent(course: Course): number {
  if (course.status === "published") return 100;
  if (course.status === "archived") return 0;
  const total = getContentCount(course);
  if (total === 0) return 0;
  return Math.min(
    100,
    Math.round(
      ((course.sectionsCount ?? 0) / Math.max(total, 1)) * 50,
    ),
  );
}

function CourseBlock({
  course,
  index = 0,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
  onToggleFeature,
  onTogglePin,
  isPinned,
}: CourseBlockProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);

  const statusConfig = COURSE_STATUS_CONFIG[course.status];
  const difficultyConfig = COURSE_DIFFICULTY_CONFIG[course.difficulty];
  const visibilityConfig = COURSE_VISIBILITY_CONFIG[course.visibility];

  const hasCover = course.coverImage || course.thumbnail;
  const gradient = difficultyGradients[course.difficulty] ?? difficultyGradients.all_levels;
  const completion = useMemo(() => getCompletionPercent(course), [course]);
  const contentCount = useMemo(() => getContentCount(course), [course]);

  const revenueDisplay = useMemo(() => {
    if (course.pricingType === "free") return "مجاني";
    if (course.price != null && course.price > 0)
      return `${formatNumber(course.price)} ${course.currency ?? "ر.س"}`;
    return null;
  }, [course.pricingType, course.price, course.currency]);

  const hasDiscount =
    course.discountPrice != null && course.discountPrice > 0;

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.03, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      role="button"
      tabIndex={0}
      aria-label={`فتح ${course.title}`}
      className="group cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-ring focus-visible:ring-offset-2 focus-visible:ring-offset-tenant-bg"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileHover={{
        y: -4,
        transition: { type: "spring", stiffness: 200, damping: 20 },
      }}
    >
      <div className="overflow-hidden rounded-2xl border border-tenant-border/40 bg-tenant-surface shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-tenant-accent/5 group-hover:border-tenant-border/70">
        {/* Cover */}
        <div className="relative overflow-hidden bg-gradient-to-br from-tenant-soft to-tenant-surface">
          <div
            className={cn(
              "relative overflow-hidden",
              "aspect-[16/10] sm:aspect-[16/9]",
            )}
          >
            {hasCover ? (
              <>
                <motion.img
                  src={course.coverImage || course.thumbnail!}
                  alt={course.title}
                  loading="lazy"
                  className={cn(
                    "h-full w-full object-cover transition-all duration-700 ease-out",
                    imageLoaded ? "scale-100 opacity-100" : "scale-105 opacity-0",
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tenant-surface via-tenant-surface/20 to-transparent opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-tenant-surface/5 to-transparent" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-tenant-surface/60 via-transparent to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-tenant-accent/10 ring-1 ring-tenant-accent/10">
                    <BookOpen className="h-8 w-8 text-tenant-accent/30" />
                  </div>
                  <span className="text-xs font-medium text-tenant-fg-muted/30">
                    {course.category?.name ?? "دورة تدريبية"}
                  </span>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute start-3 top-3 z-10 flex flex-wrap gap-1.5">
              {course.featured && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-amber-50 shadow-sm backdrop-blur-sm border border-amber-400/30"
                >
                  <Sparkles className="h-3 w-3 fill-current" />
                  مميز
                </motion.span>
              )}
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm border",
                  statusBadgeStyles[course.status] ?? "bg-tenant-fg-muted/60 text-tenant-bg border-transparent",
                )}
              >
                {course.status === "published" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : course.status === "draft" ? (
                  <PenLine className="h-3 w-3" />
                ) : course.status === "archived" ? (
                  <Archive className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {statusConfig?.label ?? course.status}
              </motion.span>
            </div>

            {/* Quick Actions */}
            <div className="absolute end-3 top-3 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <AppTooltipProvider>
                <div className="flex items-center gap-1">
                  {onTogglePin && (
                    <AppTooltip>
                      <AppTooltipTrigger asChild>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(course.id);
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-xl border shadow-sm transition-colors duration-200",
                            isPinned
                              ? "bg-tenant-accent/80 text-tenant-accent-fg border-tenant-accent/30"
                              : "bg-tenant-surface/80 text-tenant-fg-muted/60 border-tenant-border/30 hover:bg-tenant-surface hover:text-tenant-fg",
                          )}
                          aria-label={isPinned ? "إزالة التثبيت" : "تثبيت"}
                        >
                          <MapPin className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
                        </motion.button>
                      </AppTooltipTrigger>
                      <AppTooltipContent side="top">
                        {isPinned ? "إزالة التثبيت" : "تثبيت"}
                      </AppTooltipContent>
                    </AppTooltip>
                  )}
                  <PermissionGuard permission="courses.update">
                    <AppTooltip>
                      <AppTooltipTrigger asChild>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(course);
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-tenant-surface/80 backdrop-blur-xl border border-tenant-border/30 text-tenant-fg-muted/60 shadow-sm transition-colors duration-200 hover:bg-tenant-surface hover:text-tenant-fg"
                          aria-label="تعديل"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </motion.button>
                      </AppTooltipTrigger>
                      <AppTooltipContent side="top">
                        تعديل
                      </AppTooltipContent>
                    </AppTooltip>
                  </PermissionGuard>
                  <PermissionGuard permission="courses.update">
                    <AppDropdownMenu>
                      <AppDropdownMenuTrigger asChild>
                        <motion.button
                          onClick={(e) => e.stopPropagation()}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-tenant-surface/80 backdrop-blur-xl border border-tenant-border/30 text-tenant-fg-muted/60 shadow-sm transition-colors duration-200 hover:bg-tenant-surface hover:text-tenant-fg"
                          aria-label="المزيد من الخيارات"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </motion.button>
                      </AppDropdownMenuTrigger>
                      <AppDropdownMenuContent align="end" className="w-44">
                        <AppDropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate?.(course);
                          }}
                        >
                          <Copy className="ms-2 h-4 w-4" />
                          نسخ
                        </AppDropdownMenuItem>
                        {onToggleFeature && (
                          <AppDropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFeature(course);
                            }}
                          >
                            <Sparkles className="ms-2 h-4 w-4" />
                            {course.featured
                              ? "إلغاء التميز"
                              : "تمييز"}
                          </AppDropdownMenuItem>
                        )}
                        <AppDropdownMenuSeparator />
                        {course.status === "archived" ? (
                          <AppDropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestore?.(course);
                            }}
                          >
                            <RotateCcw className="ms-2 h-4 w-4" />
                            استعادة
                          </AppDropdownMenuItem>
                        ) : (
                          <AppDropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchive?.(course);
                            }}
                          >
                            <Archive className="ms-2 h-4 w-4" />
                            أرشفة
                          </AppDropdownMenuItem>
                        )}
                        <PermissionGuard permission="courses.delete">
                          <AppDropdownMenuSeparator />
                          <AppDropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete?.(course);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="ms-2 h-4 w-4" />
                            حذف
                          </AppDropdownMenuItem>
                        </PermissionGuard>
                      </AppDropdownMenuContent>
                    </AppDropdownMenu>
                  </PermissionGuard>
                </div>
              </AppTooltipProvider>
            </div>
          </div>

          {/* Info overlay at bottom of cover */}
          <div className="absolute bottom-0 start-0 end-0 z-10 p-4 pt-12 bg-gradient-to-t from-tenant-surface via-tenant-surface/80 to-transparent">
            {course.category && (
              <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-tenant-soft/80 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-tenant-fg-muted border border-tenant-border/40 shadow-sm">
                {course.category.name}
              </span>
            )}
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-tenant-fg transition-colors duration-300 group-hover:text-tenant-accent">
              {course.title}
            </h3>
            <div className="mt-1.5 flex items-center justify-between">
              {course.instructor ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-tenant-accent/20 to-tenant-accent/10 ring-1 ring-tenant-border/50 text-[8px] font-medium text-tenant-accent">
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
                  <span className="truncate text-[11px] text-tenant-fg-muted/70">
                    {course.instructor.name}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-tenant-fg-muted/30">
                  بدون مدرب
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] text-tenant-fg-muted/40">
                <Clock className="h-3 w-3" />
                {formatDate(course.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 pb-4 pt-2 space-y-2.5">
          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {visibilityConfig && (
              <span className="inline-flex items-center gap-1 rounded-md bg-tenant-soft/50 px-1.5 py-0.5 text-[10px] font-medium text-tenant-fg-muted/70">
                {visibilityIcons[course.visibility] ?? (
                  <Eye className="h-3 w-3" />
                )}
                {visibilityConfig.label}
              </span>
            )}
            {difficultyConfig && (
              <span className="inline-flex items-center gap-1 rounded-md bg-tenant-soft/50 px-1.5 py-0.5 text-[10px] font-medium text-tenant-fg-muted/70">
                <Signal className="h-3 w-3" />
                {difficultyConfig.label}
              </span>
            )}
            {course.language && (
              <span className="inline-flex items-center gap-1 rounded-md bg-tenant-soft/50 px-1.5 py-0.5 text-[10px] font-medium text-tenant-fg-muted/70">
                <Globe className="h-3 w-3" />
                {languageLabels[course.language] ?? course.language}
              </span>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {course.studentsCount > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-tenant-fg-muted/60">
                <Users className="h-3.5 w-3.5 shrink-0 text-tenant-fg-muted/30" />
                <span>{formatNumber(course.studentsCount)} طالب</span>
              </div>
            )}
            {revenueDisplay && (
              <div className="flex items-center gap-1.5 text-[11px] text-tenant-fg-muted/60">
                <BadgePercent className="h-3.5 w-3.5 shrink-0 text-tenant-fg-muted/30" />
                <span>{revenueDisplay}</span>
                {hasDiscount && course.price && course.discountPrice != null && (
                  <span className="text-[10px] text-rose-500/70">
                    -{Math.round(((course.price - course.discountPrice) / course.price) * 100)}%
                  </span>
                )}
              </div>
            )}
            {course.lessonsCount > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-tenant-fg-muted/60">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-tenant-fg-muted/30" />
                <span>{formatNumber(course.lessonsCount)} درس</span>
              </div>
            )}
            {course.sectionsCount > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-tenant-fg-muted/60">
                <Layers className="h-3.5 w-3.5 shrink-0 text-tenant-fg-muted/30" />
                <span>{formatNumber(course.sectionsCount)} قسم</span>
              </div>
            )}
          </div>

          {/* Progress */}
          {completion > 0 && completion < 100 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-tenant-soft">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{
                      duration: 1.2,
                      ease: [0.16, 1, 0.3, 1],
                      delay: Math.min(index * 0.03, 0.4) + 0.3,
                    }}
                    className="h-full rounded-full bg-tenant-accent/60"
                  />
                </div>
                <span className="me-1 text-[10px] font-medium text-tenant-accent shrink-0">
                  {completion}%
                </span>
              </div>
            </div>
          )}
          {completion === 100 && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-medium">مكتمل</span>
            </div>
          )}

          {/* Price/Discount row */}
          {course.pricingType !== "free" && course.price != null && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-sm font-bold text-tenant-fg">
                {formatNumber(course.price)} {course.currency ?? "ر.س"}
              </span>
              {hasDiscount && course.discountPrice != null && (
                <span className="text-[11px] text-tenant-fg-muted/50 line-through">
                  {formatNumber(course.discountPrice)} {course.currency ?? "ر.س"}
                </span>
              )}
            </div>
          )}
          {course.pricingType === "free" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              مجاني
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const MemoizedCourseBlock = memo(CourseBlock);
export { MemoizedCourseBlock as CourseBlock };
