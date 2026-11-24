"use client";

import { motion } from "framer-motion";
import {
  Archive,
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  Clock,
  Copy,
  Eye,
  FileText,
  Layers,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioSurfaceCard } from "@/components/studio/surfaces/StudioSurfaceCard";
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

function ActionChip({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  tone?: "danger";
}) {
  return (
    <button type="button" className="nova-action-chip" data-tone={tone} onClick={onClick}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
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
      className={cn("nova-page", className)}
    >
      <motion.nav
        variants={itemVariants}
        aria-label="مسار التنقل"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] text-studio-fg-muted"
      >
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronLeft className="h-3 w-3 rotate-180 text-studio-fg-subtle rtl:rotate-0" />}
            <span className={cn(i === crumbs.length - 1 && "font-extrabold text-studio-fg")}>{crumb.label}</span>
          </span>
        ))}
      </motion.nav>

      <motion.section variants={itemVariants} className="nova-editorial-hero p-5 sm:p-7" data-mark="02">
        <div className="relative z-[1] flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="nova-hero-index h-14 w-14 text-xl"
              style={section.color ? { background: section.color } : undefined}
            >
              <Layers className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="nova-section-label">وحدة تعليمية</p>
                <StudioStatusBadge status={section.status} />
                {isDeleted && (
                  <span className="rounded-full bg-studio-soft px-2 py-0.5 text-[10px] font-bold text-studio-fg-muted">مؤرشف</span>
                )}
              </div>
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-studio-fg sm:text-3xl">{section.title}</h1>
              {section.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-studio-fg-muted">{section.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold text-studio-fg-muted">
                  <Eye className="h-3.5 w-3.5" />
                  {visibility.label}
                </span>
                {section.freePreview && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-studio-success/10 px-3 py-1 text-[11px] font-bold text-studio-success">
                    <Eye className="h-3.5 w-3.5" /> معاينة مجانية
                  </span>
                )}
                {section.locked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-studio-warning/10 px-3 py-1 text-[11px] font-bold text-studio-warning">
                    <Lock className="h-3.5 w-3.5" /> مقفل
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="nova-action-strip relative z-[1] lg:max-w-[320px] lg:justify-end">
            {onAddContent && !isDeleted && (
              <StudioButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={onAddContent} className="nova-primary-btn">
                إضافة محتوى
              </StudioButton>
            )}
            <ActionChip icon={Pencil} label="تعديل" onClick={() => onEdit?.(section)} />
            <ActionChip icon={Copy} label="نسخ" onClick={() => onDuplicate?.(section)} />
            {isDeleted ? (
              <ActionChip icon={RotateCcw} label="استعادة" onClick={() => onRestore?.(section)} />
            ) : (
              <ActionChip icon={Archive} label="أرشفة" onClick={() => onArchive?.(section)} />
            )}
            <ActionChip icon={Trash2} label="حذف" tone="danger" onClick={() => onDelete?.(section)} />
          </div>
        </div>
      </motion.section>

      <motion.div variants={itemVariants} className="nova-stat-ribbon my-5">
        <div className="nova-stat-chip">
          <span><FileText className="h-4 w-4" /></span>
          <span><small>وحدات المحتوى</small><strong>{section.lessonsCount}</strong></span>
        </div>
        <div className="nova-stat-chip">
          <span><Clock className="h-4 w-4" /></span>
          <span><small>المدة التقديرية</small><strong className="text-sm">{displayDuration}</strong></span>
        </div>
        <div className="nova-stat-chip">
          <span><Eye className="h-4 w-4" /></span>
          <span><small>الظهور</small><strong className="text-sm">{visibility.label}</strong></span>
        </div>
        <div className="nova-stat-chip">
          <span><ArrowUpDown className="h-4 w-4" /></span>
          <span><small>الترتيب</small><strong>{section.order}</strong></span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="elevated" padding="md" className="nova-card">
          <p className="nova-section-label mb-4">بطاقة القسم</p>
          <div className="nova-meta-grid">
            {([
              { label: "تاريخ الإنشاء", value: new Date(section.createdAt).toLocaleDateString("ar-SA"), icon: CalendarDays },
              { label: "آخر تحديث", value: new Date(section.updatedAt).toLocaleDateString("ar-SA"), icon: CalendarDays },
              { label: "المدة التقديرية", value: displayDuration, icon: Clock },
              { label: "الترتيب", value: String(section.order), icon: ArrowUpDown },
            ] as const).map(({ label, value, icon: Icon }) => (
              <div key={label} className="nova-meta-tile">
                <span className="nova-mini-label flex items-center gap-1.5">
                  <Icon className="h-3 w-3" /> {label}
                </span>
                <span className="nova-mini-value">{value}</span>
              </div>
            ))}
          </div>
        </StudioSurfaceCard>
      </motion.div>
    </motion.div>
  );
}

export { CourseStudioSectionOverview, visibilityLabel };
