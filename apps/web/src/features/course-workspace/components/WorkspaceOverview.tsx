"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Star,
  DollarSign,
  FileText,
  Layers,
  Clock,
  GraduationCap,
  Globe,
  BadgeCheck,
  TrendingUp,
  BookOpen,
  Plus,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { AppBadge, Skeleton, PermissionGuard } from "@/components/ui";
import {
  COURSE_DIFFICULTY_CONFIG,
  COURSE_STATUS_CONFIG,
  COURSE_VISIBILITY_CONFIG,
  PRICING_TYPE_CONFIG,
} from "@/features/courses/constants";
import type { Course } from "@/features/courses/types";
import { formatNumber, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

interface WorkspaceOverviewProps {
  course?: Course | null;
  loading?: boolean;
  onAddLecture?: () => void;
  totalModules?: number;
}

function WorkspaceOverview({ course, loading, onAddLecture, totalModules = 0 }: WorkspaceOverviewProps) {
  if (loading) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/[0.04] to-muted/30 border border-border/40"
        >
          <div className="p-8 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="flex gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-20" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!course) return null;

  const difficultyConfig = COURSE_DIFFICULTY_CONFIG[course.difficulty];
  const statusConfig = COURSE_STATUS_CONFIG[course.status];
  const visibilityConfig = COURSE_VISIBILITY_CONFIG[course.visibility];
  const pricingConfig = PRICING_TYPE_CONFIG[course.pricingType];

  const outlineItems = [
    { label: "المحاضرات", value: totalModules, icon: BookOpen, color: "text-primary" },
    { label: "الأقسام", value: course.sectionsCount ?? 0, icon: Layers, color: "text-blue-500" },
    { label: "المحتوى", value: course.lessonsCount ?? 0, icon: FileText, color: "text-secondary" },
    { label: "المدة", value: course.duration ? `${course.duration} د` : "—", icon: Clock, color: "text-amber-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-10 max-w-4xl"
    >
      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/[0.04] via-primary/[0.01] to-muted/30 border border-border/40"
      >
        <div className="absolute inset-0 bg-dot opacity-[0.015]" />
        <div className="relative p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {course.category && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {course.category.name}
                  </span>
                )}
                <AppBadge variant={statusConfig.color as any} className="text-[10px]">
                  {statusConfig.label}
                </AppBadge>
                <span className="text-xs font-medium text-muted-foreground/60 bg-muted/20 px-2.5 py-1 rounded-full border border-border/30">
                  {difficultyConfig?.label}
                </span>
                {course.featured && (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    مميزة
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {course.title}
              </h1>
              {course.shortDescription && (
                <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-xl">
                  {course.shortDescription}
                </p>
              )}
            </div>
          </div>

          {/* EMBEDDED METRICS - Not separate cards */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {outlineItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <div className={cn("p-2 rounded-lg bg-muted/20", item.color)}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">{typeof item.value === "number" ? formatNumber(item.value) : item.value}</p>
                  <p className="text-[10px] text-muted-foreground/50">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* STUDENT STATS EMBEDDED */}
          <div className="mt-6 pt-6 border-t border-border/20 flex flex-wrap items-center gap-6">
            {course.instructor && (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-[9px] font-medium text-primary shrink-0 overflow-hidden ring-1 ring-border">
                  {course.instructor.avatar ? (
                    <img src={course.instructor.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px]">{course.instructor.name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground/70">{course.instructor.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground/40" />
              <span className="text-sm font-bold">{formatNumber(course.studentsCount ?? 0)}</span>
              <span className="text-xs text-muted-foreground/50">طالب</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold">—</span>
              <span className="text-xs text-muted-foreground/50">تقييم</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-bold">
                {course.price ? `${formatNumber(course.price)} ${course.currency ?? "ر.س"}` : "مجاني"}
              </span>
              {course.discountPrice && (
                <span className="text-[10px] line-through text-muted-foreground/40">
                  {formatNumber(course.discountPrice)}
                </span>
              )}
              <span className="text-xs text-muted-foreground/50">{pricingConfig?.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/60">{visibilityConfig?.label}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
              آخر تعديل: {formatDate(course.updatedAt)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* QUICK OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="rounded-2xl border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5">
              <GraduationCap className="h-4.5 w-4.5 text-primary/60" />
            </div>
            <span className="text-sm font-semibold">هيكل التعلم</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">المستوى</span>
              <span className="font-medium">{difficultyConfig?.label ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">اللغة</span>
              <span className="font-medium">{course.language === "ar" ? "العربية" : course.language}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">الشهادة</span>
              <span className="font-medium">{course.certificateEnabled ? "مفعلة" : "غير مفعلة"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">المخرجات</span>
              <span className="font-medium">{course.learningOutcomes.length}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="rounded-2xl border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-500/70" />
            </div>
            <span className="text-sm font-semibold">الأداء</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">الظهور</span>
              <span className="font-medium">{visibilityConfig?.label ?? "—"}</span>
            </div>
            {course.enrollmentLimit && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground/60">حد التسجيل</span>
                <span className="font-medium">{formatNumber(course.enrollmentLimit)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">تاريخ البدء</span>
              <span className="font-medium">{course.startDate ? new Date(course.startDate).toLocaleDateString("ar") : "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">تاريخ الانتهاء</span>
              <span className="font-medium">{course.endDate ? new Date(course.endDate).toLocaleDateString("ar") : "—"}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="rounded-2xl border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
              <BarChart3 className="h-4.5 w-4.5 text-amber-500/70" />
            </div>
            <span className="text-sm font-semibold">SEO</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">العنوان SEO</span>
              <span className="font-medium truncate max-w-[150px]">{course.seo?.title || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">الوصف SEO</span>
              <span className="font-medium">{course.seo?.description ? "موجود" : "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">الكلمات المفتاحية</span>
              <span className="font-medium truncate max-w-[150px]">{course.seo?.keywords || "—"}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* DESCRIPTION */}
      {course.shortDescription && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-2xl border bg-card p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-3 w-3 text-primary/70" />
            </span>
            وصف الدورة
          </h3>
          <p className="text-sm text-muted-foreground/70 leading-relaxed">
            {course.shortDescription}
          </p>
        </motion.div>
      )}

      {/* LEARNING OUTCOMES */}
      {course.learningOutcomes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="rounded-2xl border bg-card p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-success/10">
              <BadgeCheck className="h-3 w-3 text-success/70" />
            </span>
            مخرجات التعلم
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {course.learningOutcomes.map((outcome, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-sm text-muted-foreground/70 p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                {outcome}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* EMPTY LECTURE STATE */}
      {course.sectionsCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center py-16 gap-6 rounded-[2rem] border border-dashed border-border/40 bg-muted/10"
        >
          <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center ring-8 ring-background/50">
            <BookOpen className="h-10 w-10 text-primary/20" />
          </div>
          <div className="text-center max-w-sm space-y-2">
            <h3 className="text-lg font-bold">ابدأ ببناء المحتوى</h3>
            <p className="text-sm text-muted-foreground/60 leading-relaxed">
            أضف أول محاضرة لبدء بناء المنهج التعليمي. كل محاضرة تحتوي على أقسام، وكل قسم يحتوي على محتوى تعليمي.
            </p>
          </div>
          <PermissionGuard permission="modules.create">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAddLecture}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <Plus className="h-4 w-4" />
              إنشاء أول محاضرة
            </motion.button>
          </PermissionGuard>
        </motion.div>
      )}
    </motion.div>
  );
}

export { WorkspaceOverview };
