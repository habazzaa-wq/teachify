"use client";

import { motion } from "framer-motion";
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
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

const easeCurve = [0.22, 1, 0.36, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeCurve } },
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
    <motion.div variants={itemVariants} className="atlas-metric">
      <div className="flex items-center gap-3">
        <div className="atlas-metric-icon">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-studio-fg-muted">{label}</p>
          <p className="truncate text-base font-bold leading-tight text-studio-fg">{value}</p>
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
          className="atlas-icon-btn flex h-9 w-9 items-center justify-center border border-studio-border bg-studio-surface"
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
        {!isDeleted && (
          <AppDropdownMenuItem onClick={() => onArchive?.(section)}>
            <Archive className="h-4 w-4" />
            {isPublished ? "أرشفة" : "نشر"}
          </AppDropdownMenuItem>
        )}
        {isDeleted && (
          <AppDropdownMenuItem onClick={() => onRestore?.(section)}>
            <RotateCcw className="h-4 w-4" />
            استعادة
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem onClick={() => onDelete?.(section)} className="text-studio-danger focus:text-studio-danger">
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
  const displayDuration = section.durationMinutes ? `${section.durationMinutes} دقيقة` : "—";
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
      className={cn("atlas-page mx-auto w-full max-w-6xl", className)}
    >
      <motion.nav
        variants={itemVariants}
        aria-label="مسار التنقل"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] text-studio-fg-muted"
      >
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronLeft className="h-3 w-3 rotate-180 text-studio-fg-subtle rtl:rotate-0" />}
            <span className={cn(i === crumbs.length - 1 && "font-semibold text-studio-fg")}>{crumb.label}</span>
          </span>
        ))}
      </motion.nav>

      <motion.div variants={itemVariants} className="mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="atlas-hero-icon h-14 w-14 shrink-0"
              style={section.color ? { backgroundColor: `${section.color}20` } : undefined}
            >
              <Layers className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="atlas-section-label">وحدة تعليمية</p>
                <StudioStatusBadge status={section.status} />
                {isDeleted && (
                  <span className="rounded-full bg-studio-soft px-2 py-0.5 text-[10px] font-semibold text-studio-fg-muted">
                    مؤرشف
                  </span>
                )}
              </div>
              <h1 className="truncate text-2xl font-bold tracking-tight text-studio-fg">{section.title}</h1>
              {section.description && (
                <p className="mt-1 line-clamp-2 text-sm text-studio-fg-muted">{section.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StudioButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={onAddContent}>
              إضافة محتوى
            </StudioButton>
            <StudioButton variant="secondary" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={() => onEdit?.(section)}>
              تعديل
            </StudioButton>
            <StudioButton variant="ghost" size="sm" icon={<Copy className="h-4 w-4" />} onClick={() => onDuplicate?.(section)}>
              نسخ
            </StudioButton>
            {isDeleted ? (
              <StudioButton variant="soft" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => onRestore?.(section)}>
                استعادة
              </StudioButton>
            ) : (
              <StudioButton variant="ghost" size="sm" icon={<Archive className="h-4 w-4" />} onClick={() => onArchive?.(section)}>
                أرشفة
              </StudioButton>
            )}
            <StudioButton variant="ghost" size="icon" icon={<Trash2 className="h-4 w-4 text-studio-danger" />} onClick={() => onDelete?.(section)} aria-label="حذف القسم" />
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-studio-soft px-2.5 py-0.5 text-[11px] font-medium text-studio-fg">
            <Eye className="h-3.5 w-3.5 text-studio-fg-muted" />
            {visibility.label}
          </span>
          {section.freePreview && (
            <span className="inline-flex items-center gap-1 rounded-full bg-studio-success/10 px-2.5 py-0.5 text-[11px] font-medium text-studio-success">
              <Eye className="h-3.5 w-3.5" />
              معاينة مجانية
            </span>
          )}
          {section.locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-studio-warning/10 px-2.5 py-0.5 text-[11px] font-medium text-studio-warning">
              <Lock className="h-3.5 w-3.5" />
              مقفل
            </span>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={FileText} label="وحدات المحتوى" value={section.lessonsCount} />
        <MetricCard icon={Clock} label="المدة التقديرية" value={displayDuration} />
        <MetricCard icon={Eye} label="الظهور" value={visibility.label} />
        <MetricCard icon={Layers} label="الترتيب" value={section.order} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="elevated" padding="md" className="atlas-card">
          <div className="border-b border-studio-border pb-3">
            <p className="atlas-section-label">بيانات القسم</p>
          </div>
          <dl className="grid gap-x-6 gap-y-3 pt-4 sm:grid-cols-2">
            {([
              { label: "تاريخ الإنشاء", value: new Date(section.createdAt).toLocaleDateString("ar-SA"), icon: CalendarDays },
              { label: "آخر تحديث", value: new Date(section.updatedAt).toLocaleDateString("ar-SA"), icon: CalendarDays },
              { label: "المدة التقديرية", value: displayDuration, icon: Clock },
              { label: "الترتيب", value: String(section.order), icon: ArrowUpDown },
            ] as const).map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-studio-border/60 pb-2 last:border-0">
                <dt className="flex items-center gap-2 text-xs text-studio-fg-muted">
                  <Icon className="h-3.5 w-3.5 text-studio-fg-subtle" />
                  {label}
                </dt>
                <dd className="text-sm font-semibold text-studio-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </StudioSurfaceCard>
      </motion.div>

      {!isDeleted && onAddContent && (
        <motion.div variants={itemVariants} className="mt-5">
          <StudioButton variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={onAddContent}>
            إضافة المزيد من المحتوى
          </StudioButton>
        </motion.div>
      )}
    </motion.div>
  );
}

export { CourseStudioSectionOverview, visibilityLabel };
