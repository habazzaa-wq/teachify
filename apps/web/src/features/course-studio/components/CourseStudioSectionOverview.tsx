"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Layers,
  FileText,
  Eye,
  Lock,
  Plus,
  Pencil,
  Copy,
  Archive,
  Trash2,
  MoreHorizontal,
  CalendarDays,
  ArrowUpDown,
  RotateCcw,
  ChevronLeft,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioSurfaceCard } from "@/components/studio/surfaces/StudioSurfaceCard";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CourseSection } from "@/features/course-sections/types";
import type { CourseModule } from "@/features/course-modules/types";

interface CourseStudioSectionOverviewProps {
  section: CourseSection;
  lecture?: CourseModule | null;
  breadcrumb?: { label: string; href?: string }[];
  onAddContent?: () => void;
  onEdit?: (section: CourseSection) => void;
  onDuplicate?: (section: CourseSection) => void;
  onArchive?: (section: CourseSection) => void;
  onDelete?: (section: CourseSection) => void;
  onRestore?: (section: CourseSection) => void;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const easeCurve = [0.22, 1, 0.36, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeCurve },
  },
};

function visibilityLabel(section: CourseSection): { label: string; tone: "success" | "info" | "default" | "warning" } {
  if (section.freePreview) return { label: "معاينة مجانية", tone: "success" };
  if (section.locked) return { label: "مقفل", tone: "warning" };
  return { label: "ظاهر", tone: "info" };
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-xl border border-studio-border bg-studio-surface p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-studio-accent-soft">
          <Icon className="h-5 w-5 text-studio-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-studio-fg-muted">{label}</p>
          <p className="text-lg font-semibold text-studio-fg">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function SectionContextMenu({
  section,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onRestore,
}: {
  section: CourseSection;
  onEdit?: (section: CourseSection) => void;
  onDuplicate?: (section: CourseSection) => void;
  onArchive?: (section: CourseSection) => void;
  onDelete?: (section: CourseSection) => void;
  onRestore?: (section: CourseSection) => void;
}) {
  const isDeleted = !!section.deletedAt;
  const isPublished = section.status === "published";

  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="خيارات القسم"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-studio-border bg-studio-surface text-studio-fg-muted transition-colors hover:bg-studio-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="w-48">
        <AppDropdownMenuItem onClick={() => onEdit?.(section)}>
          <Pencil className="h-4 w-4" />
          تعديل
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={() => onDuplicate?.(section)}>
          <Copy className="h-4 w-4" />
          نسخ
        </AppDropdownMenuItem>
        <AppDropdownMenuSeparator />
        {!isPublished && !isDeleted && (
          <AppDropdownMenuItem onClick={() => onArchive?.(section)}>
            <Archive className="h-4 w-4" />
            نشر
          </AppDropdownMenuItem>
        )}
        {isPublished && !isDeleted && (
          <AppDropdownMenuItem onClick={() => onArchive?.(section)}>
            <Archive className="h-4 w-4" />
            أرشفة
          </AppDropdownMenuItem>
        )}
        {isDeleted && (
          <AppDropdownMenuItem onClick={() => onRestore?.(section)}>
            <RotateCcw className="h-4 w-4" />
            استعادة
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem
          onClick={() => onDelete?.(section)}
          className="text-studio-danger focus:text-studio-danger"
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </AppDropdownMenuItem>
      </AppDropdownMenuContent>
    </AppDropdownMenu>
  );
}

function CourseStudioSectionOverview({
  section,
  lecture,
  breadcrumb,
  onAddContent,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onRestore,
  className,
}: CourseStudioSectionOverviewProps) {
  const displayDuration = section.durationMinutes
    ? `${section.durationMinutes} دقيقة`
    : "—";
  const visibility = visibilityLabel(section);
  const isDeleted = !!section.deletedAt;

  const crumbs = breadcrumb ?? [
    { label: "الدورة" },
    ...(lecture ? [{ label: lecture.title }] : []),
    { label: section.title },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("mx-auto w-full max-w-3xl p-6 md:p-8", className)}
    >
      <motion.nav
        variants={itemVariants}
        aria-label="مسار التنقل"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-studio-fg-muted"
      >
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronLeft className="h-3 w-3 rotate-180 rtl:rotate-0 text-studio-fg-subtle" />}
            <span className={cn(i === crumbs.length - 1 && "font-medium text-studio-fg")}>
              {crumb.label}
            </span>
          </span>
        ))}
      </motion.nav>

      <motion.div variants={itemVariants} className="mb-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-4 ring-studio-bg",
                "bg-studio-accent-soft",
              )}
              style={
                section.color
                  ? { backgroundColor: `${section.color}20` }
                  : undefined
              }
            >
              <Layers className="h-7 w-7 text-studio-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-bold text-studio-fg">
                  {section.title}
                </h1>
                <StudioStatusBadge status={section.status} />
              </div>
              {section.description && (
                <p className="mt-1 text-sm text-studio-fg-muted line-clamp-2">
                  {section.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <StudioButton
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={onAddContent}
              aria-label="إضافة محتوى"
            >
              إضافة محتوى
            </StudioButton>
            <StudioButton
              variant="secondary"
              size="sm"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => onEdit?.(section)}
              aria-label="تعديل القسم"
            >
              تعديل
            </StudioButton>
            <StudioButton
              variant="ghost"
              size="sm"
              icon={<Copy className="h-4 w-4" />}
              onClick={() => onDuplicate?.(section)}
              aria-label="نسخ القسم"
            >
              نسخ
            </StudioButton>
            {isDeleted ? (
              <StudioButton
                variant="soft"
                size="sm"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => onRestore?.(section)}
                aria-label="استعادة القسم"
              >
                استعادة
              </StudioButton>
            ) : (
              <StudioButton
                variant="ghost"
                size="sm"
                icon={<Archive className="h-4 w-4" />}
                onClick={() => onArchive?.(section)}
                aria-label="أرشفة القسم"
              >
                أرشفة
              </StudioButton>
            )}
            <StudioButton
              variant="ghost"
              size="icon"
              icon={<Trash2 className="h-4 w-4 text-studio-danger" />}
              onClick={() => onDelete?.(section)}
              aria-label="حذف القسم"
            />
            <SectionContextMenu
              section={section}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onArchive={onArchive}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-studio-soft px-2.5 py-0.5 text-xs text-studio-fg">
            <Eye className="h-3.5 w-3.5 text-studio-fg-muted" />
            {visibility.label}
          </span>
          {section.freePreview && (
            <span className="inline-flex items-center gap-1 rounded-full bg-studio-success/10 px-2.5 py-0.5 text-xs text-studio-success">
              <Eye className="h-3.5 w-3.5" />
              معاينة مجانية
            </span>
          )}
          {section.locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-studio-warning/10 px-2.5 py-0.5 text-xs text-studio-warning">
              <Lock className="h-3.5 w-3.5" />
              مقفل
            </span>
          )}
          {isDeleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-studio-fg-subtle/30 px-2.5 py-0.5 text-xs text-studio-fg-muted">
              <Archive className="h-3.5 w-3.5" />
              مؤرشف (محذوف)
            </span>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-studio-fg-muted">
          نظرة عامة
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={FileText}
            label="عدد المحتوى"
            value={section.lessonsCount}
          />
          <MetricCard
            icon={Clock}
            label="المدة التقديرية"
            value={displayDuration}
          />
          <MetricCard
            icon={Eye}
            label="الظهور"
            value={visibility.label}
          />
          <MetricCard
            icon={Layers}
            label="الترتيب"
            value={section.order}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="outline" padding="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-studio-border pb-3">
              <span className="text-sm text-studio-fg-muted">المعلومات</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-studio-fg-subtle" />
                <div>
                  <p className="text-xs text-studio-fg-muted">تاريخ الإنشاء</p>
                  <p className="text-sm font-medium text-studio-fg">
                    {new Date(section.createdAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-studio-fg-subtle" />
                <div>
                  <p className="text-xs text-studio-fg-muted">آخر تحديث</p>
                  <p className="text-sm font-medium text-studio-fg">
                    {new Date(section.updatedAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-studio-fg-subtle" />
                <div>
                  <p className="text-xs text-studio-fg-muted">المدة التقديرية</p>
                  <p className="text-sm font-medium text-studio-fg">{displayDuration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-studio-fg-subtle" />
                <div>
                  <p className="text-xs text-studio-fg-muted">الترتيب</p>
                  <p className="text-sm font-medium text-studio-fg">{section.order}</p>
                </div>
              </div>
            </div>
          </div>
        </StudioSurfaceCard>
      </motion.div>

      {!isDeleted && onAddContent && (
        <motion.div variants={itemVariants} className="mt-6">
          <StudioButton
            variant="secondary"
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={onAddContent}
          >
            إضافة محتوى
          </StudioButton>
        </motion.div>
      )}
    </motion.div>
  );
}

export { CourseStudioSectionOverview, visibilityLabel };
