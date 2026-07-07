"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  GraduationCap,
  FileText,
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
  Play,
  Layers,
  Globe,
  Lock,
  Timer,
  BadgePercent,
  Signal,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  PermissionGuard,
} from "@/components/ui";
import { COURSE_STATUS_CONFIG, COURSE_DIFFICULTY_CONFIG, COURSE_VISIBILITY_CONFIG } from "@/features/courses/constants";
import type { Course } from "@/features/courses/types";
import { formatNumber, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "continue";
  onEdit?: (course: Course) => void;
  onDuplicate?: (course: Course) => void;
  onArchive?: (course: Course) => void;
  onRestore?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  onToggleFeature?: (course: Course) => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  published: <CheckCircle2 className="h-3 w-3" />,
  draft: <PenLine className="h-3 w-3" />,
  archived: <Archive className="h-3 w-3" />,
  review: <PenLine className="h-3 w-3" />,
  scheduled: <Clock className="h-3 w-3" />,
};

const statusBadgeStyles: Record<string, string> = {
  published: "bg-emerald-500/90 text-emerald-50 border-emerald-400/30",
  draft: "bg-amber-500/90 text-amber-50 border-amber-400/30",
  archived: "bg-muted-foreground/60 text-background border-muted-foreground/30",
  review: "bg-blue-500/90 text-blue-50 border-blue-400/30",
  scheduled: "bg-purple-500/90 text-purple-50 border-purple-400/30",
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

const difficultyBorderAccents: Record<string, string> = {
  beginner: "border-emerald-500/10",
  intermediate: "border-amber-500/10",
  advanced: "border-rose-500/10",
  all_levels: "border-primary/10",
};

const languageLabels: Record<string, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français",
  ur: "اردو",
};

function getContentCount(course: Course): number {
  return (course.sectionsCount ?? 0) + (course.lessonsCount ?? 0);
}

function getCompletionPercent(course: Course): number {
  if (course.status === "published") return 100;
  if (course.status === "archived") return 0;
  const total = getContentCount(course);
  if (total === 0) return 0;
  return Math.min(100, Math.round(((course.sectionsCount ?? 0) / Math.max(total, 1)) * 50));
}

function CircularProgress({ percent, size = 40, strokeWidth = 3 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--emerald))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
        {percent}%
      </span>
    </div>
  );
}

function CourseCard({
  course,
  variant = "default",
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
  onToggleFeature,
}: CourseCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const statusConfig = COURSE_STATUS_CONFIG[course.status];
  const difficultyConfig = COURSE_DIFFICULTY_CONFIG[course.difficulty];
  const visibilityConfig = COURSE_VISIBILITY_CONFIG[course.visibility];

  const handleClick = useCallback(() => {
    router.push(`/courses/${course.id}`);
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

  const hasCover = course.coverImage || course.thumbnail;
  const gradient = useMemo(
    () => difficultyGradients[course.difficulty] ?? difficultyGradients.all_levels,
    [course.difficulty],
  );

  const progressPercent = useMemo(() => getCompletionPercent(course), [course]);
  const contentCount = useMemo(() => getContentCount(course), [course]);

  const revenueDisplay = useMemo(() => {
    if (course.pricingType === "free") return "مجاني";
    if (course.price != null && course.price > 0) {
      return `${formatNumber(course.price)} ${course.currency ?? "ر.س"}`;
    }
    return null;
  }, [course.pricingType, course.price, course.currency]);

  const hasDiscount = course.discountPrice != null && course.discountPrice > 0;
  const hasDuration = course.duration != null && course.duration > 0;

  const infoItems = useMemo(() => {
    const items: Array<{ icon: React.ReactNode; label: string }> = [];

    if (difficultyConfig) {
      items.push({
        icon: <Signal className="h-3.5 w-3.5" />,
        label: difficultyConfig.label,
      });
    }

    if (course.language) {
      items.push({
        icon: <Globe className="h-3.5 w-3.5" />,
        label: languageLabels[course.language] ?? course.language,
      });
    }

    if (visibilityConfig) {
      items.push({
        icon: visibilityIcons[course.visibility] ?? <Eye className="h-3.5 w-3.5" />,
        label: visibilityConfig.label,
      });
    }

    if (hasDuration) {
      items.push({
        icon: <Timer className="h-3.5 w-3.5" />,
        label: `${course.duration} ${course.duration! > 10 ? "دقيقة" : "دقائق"}`,
      });
    }

    if (revenueDisplay) {
      items.push({
        icon: <BadgePercent className="h-3.5 w-3.5" />,
        label: revenueDisplay,
      });
    }

    if (hasDiscount && course.price) {
      const discountPercent = Math.round(((course.price - course.discountPrice!) / course.price) * 100);
      items.push({
        icon: <BadgePercent className="h-3.5 w-3.5" />,
        label: `-${discountPercent}%`,
      });
    }

    return items;
  }, [difficultyConfig, course.language, course.visibility, visibilityConfig, hasDuration, course.duration, revenueDisplay, hasDiscount, course.price, course.discountPrice]);

  const cover = (
    <div className={cn(
      "relative overflow-hidden bg-gradient-to-br rounded-2xl",
      gradient,
      variant === "continue" ? "h-full w-44 shrink-0 sm:w-52" : "w-full",
    )}>
      {hasCover ? (
        <>
          <motion.img
            src={course.coverImage || course.thumbnail!}
            alt={course.title}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-all duration-700",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
            )}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/5 to-transparent" />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "256px 256px",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 55%, hsl(var(--background) / 0.4) 100%)",
            }}
          />
          {variant !== "continue" && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0"
              initial={false}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
              <BookOpen className="h-7 w-7 text-primary/20" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground/20">
              {course.category?.name ?? "دورة تدريبية"}
            </span>
          </div>
        </div>
      )}

      <div className="absolute top-3 start-3 z-10 flex flex-wrap gap-1.5">
        {course.featured && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-amber-50 shadow-sm backdrop-blur-sm border border-amber-400/30"
          >
            <Sparkles className="h-3 w-3 fill-current" />
            مميز
          </motion.span>
        )}
        {course.visibility === "private" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="inline-flex items-center gap-1 rounded-full bg-muted-foreground/70 px-2.5 py-0.5 text-[10px] font-semibold text-background shadow-sm backdrop-blur-sm border border-muted-foreground/30"
          >
            <Lock className="h-3 w-3" />
            خاص
          </motion.span>
        )}
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm border",
            statusBadgeStyles[course.status] ?? "bg-muted-foreground/60 text-background border-muted-foreground/30",
          )}
        >
          {statusIcons[course.status]}
          {statusConfig?.label ?? course.status}
        </motion.span>
      </div>

      <div className="absolute top-3 end-3 z-20">
        <PermissionGuard permission="courses.update">
          <AppDropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <AppDropdownMenuTrigger asChild>
              <motion.button
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--background) / 0.8)" }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  "bg-background/60 backdrop-blur-xl border border-border/30",
                  "text-muted-foreground/50 hover:text-foreground",
                  "shadow-sm transition-colors duration-200",
                  menuOpen ? "bg-background/80 text-foreground" : "",
                )}
                aria-label="خيارات الدورة"
              >
                <MoreHorizontal className="h-4 w-4" />
              </motion.button>
            </AppDropdownMenuTrigger>
            <AppDropdownMenuContent align="end" className="w-44">
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(course); }}>
                <Pencil className="ms-2 h-4 w-4" />
                تعديل
              </AppDropdownMenuItem>
              <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(course); }}>
                <Copy className="ms-2 h-4 w-4" />
                نسخ
              </AppDropdownMenuItem>
              {onToggleFeature && (
                <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFeature(course); }}>
                  <Sparkles className="ms-2 h-4 w-4" />
                  {course.featured ? "إلغاء التميز" : "تمييز"}
                </AppDropdownMenuItem>
              )}
              <AppDropdownMenuSeparator />
              {course.status === "archived" ? (
                <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onRestore?.(course); }}>
                  <RotateCcw className="ms-2 h-4 w-4" />
                  استعادة
                </AppDropdownMenuItem>
              ) : (
                <AppDropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(course); }}>
                  <Archive className="ms-2 h-4 w-4" />
                  أرشفة
                </AppDropdownMenuItem>
              )}
              <AppDropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete?.(course); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="ms-2 h-4 w-4" />
                حذف
              </AppDropdownMenuItem>
            </AppDropdownMenuContent>
          </AppDropdownMenu>
        </PermissionGuard>
      </div>

      {variant !== "continue" && (
        <div className="absolute bottom-3 start-3 end-12 z-10">
          <div className="flex flex-wrap gap-1.5">
            {course.studentsCount > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="inline-flex items-center gap-1 rounded-full bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/30 shadow-sm"
              >
                <Users className="h-3 w-3 text-muted-foreground/60" />
                <span>{formatNumber(course.studentsCount)}</span>
              </motion.span>
            )}
            {course.lessonsCount > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="inline-flex items-center gap-1 rounded-full bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/30 shadow-sm"
              >
                <GraduationCap className="h-3 w-3 text-muted-foreground/60" />
                <span>{course.lessonsCount}</span>
              </motion.span>
            )}
            {course.sectionsCount > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="inline-flex items-center gap-1 rounded-full bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/30 shadow-sm"
              >
                <Layers className="h-3 w-3 text-muted-foreground/60" />
                <span>{course.sectionsCount}</span>
              </motion.span>
            )}
            {contentCount > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="inline-flex items-center gap-1 rounded-full bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/30 shadow-sm"
              >
                <FileText className="h-3 w-3 text-muted-foreground/60" />
                <span>{contentCount}</span>
              </motion.span>
            )}
          </div>
        </div>
      )}

      {variant === "continue" && (
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur-xl shadow-lg border border-border/30">
            <Play className="h-5 w-5 text-foreground ms-0.5" />
          </div>
        </motion.div>
      )}
    </div>
  );

  if (variant === "continue") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        role="button"
        tabIndex={0}
        aria-label={`فتح مساحة عمل دورة ${course.title}`}
        className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl shrink-0 w-[440px]"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        whileHover={{ y: -2, transition: { type: "spring", stiffness: 300, damping: 24 } }}
      >
        <div className="flex overflow-hidden rounded-2xl border border-border/30 bg-background shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:border-border/60">
          {cover}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug transition-colors duration-300 group-hover:text-primary">
                  {course.title}
                </h3>
              </div>
              {course.instructor && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-[7px] font-medium text-primary">
                    {course.instructor.avatar ? (
                      <img src={course.instructor.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      course.instructor.name.charAt(0)
                    )}
                  </div>
                  <span className="truncate">{course.instructor.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 mt-3">
              {progressPercent > 0 && progressPercent < 100 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CircularProgress percent={progressPercent} size={32} strokeWidth={2.5} />
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      {progressPercent}% مكتمل
                    </span>
                  </div>
                </div>
              )}
              {progressPercent === 100 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="font-medium">مكتمل</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary/20 hover:shadow-sm">
                <Play className="h-3 w-3" />
                أكمل
              </span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                <Clock className="h-3 w-3" />
                <span>{formatDate(course.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      role="button"
      tabIndex={0}
      aria-label={`فتح مساحة عمل دورة ${course.title}`}
      className="group cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 perspective-[1000px]"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileHover={{
        y: -4,
        rotate: -0.8,
        transition: { type: "spring", stiffness: 200, damping: 20 },
      }}
    >
      <div className={cn(
        "overflow-hidden rounded-2xl border bg-background shadow-sm transition-all duration-500",
        "group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:border-border/60",
        difficultyBorderAccents[course.difficulty] ?? "border-border/30",
      )}>
        <div className="relative">
          {cover}

          {course.category && variant === "default" && (
            <div className="absolute -bottom-0 start-0 end-0 z-10 p-4 pt-12 bg-gradient-to-t from-background via-background/80 to-transparent">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="inline-flex items-center gap-1 rounded-full bg-background/70 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/30 shadow-sm mb-2"
              >
                {course.category.name}
              </motion.span>
              <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors duration-300 group-hover:text-primary">
                {course.title}
              </h3>
              <div className="flex items-center justify-between mt-1.5">
                {course.instructor ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-border/50 text-[8px] font-medium text-primary">
                      {course.instructor.avatar ? (
                        <img src={course.instructor.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        course.instructor.name.charAt(0)
                      )}
                    </div>
                    <span className="truncate text-[11px] text-muted-foreground/70">{course.instructor.name}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground/30">بدون مدرب</span>
                )}
                <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(course.updatedAt)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={cn(
          "px-4 pb-4",
          course.category ? "pt-2" : "pt-4",
        )}>
          {!course.category && (
            <>
              <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors duration-300 group-hover:text-primary mb-1.5">
                {course.title}
              </h3>
              <div className="flex items-center justify-between">
                {course.instructor ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-border/50 text-[8px] font-medium text-primary">
                      {course.instructor.avatar ? (
                        <img src={course.instructor.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        course.instructor.name.charAt(0)
                      )}
                    </div>
                    <span className="truncate text-[11px] text-muted-foreground/70">{course.instructor.name}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground/30">بدون مدرب</span>
                )}
                <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(course.updatedAt)}
                </span>
              </div>
            </>
          )}

          {progressPercent > 0 && (
            <div className={cn(
              "flex items-center gap-3 py-2.5 mt-2",
              "border-t border-border/20",
            )}>
              {progressPercent < 100 ? (
                <div className="flex items-center gap-2 shrink-0">
                  <CircularProgress percent={progressPercent} />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[11px] font-semibold">مكتمل</span>
                </div>
              )}
            </div>
          )}

          {infoItems.length > 0 && (
            <div className={cn(
              "grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 py-2.5 mt-1",
              "border-t border-border/20",
            )}>
              {infoItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70"
                >
                  <span className="text-muted-foreground/40 shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export { CourseCard };
