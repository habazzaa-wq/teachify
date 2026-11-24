"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Layers,
  FileText,
  BookOpen,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioSurfaceCard } from "@/components/studio/surfaces/StudioSurfaceCard";
import { cn } from "@/lib/cn";
import type { CourseModule } from "@/features/course-modules/types";
import type { CourseSection } from "@/features/course-sections/types";

interface CourseStudioLectureOverviewProps {
  lecture: CourseModule;
  sections?: CourseSection[];
  onAddSection?: () => void;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const easeCurve = [0.22, 1, 0.36, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeCurve } },
};

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
          <p className="text-lg font-bold leading-tight text-studio-fg">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function CourseStudioLectureOverview({
  lecture,
  sections,
  onAddSection,
  className,
}: CourseStudioLectureOverviewProps) {
  const sectionList = sections ?? [];
  const totalContent = sectionList.reduce((sum, s) => sum + (s.lessonsCount ?? 0), 0);
  const totalDurationMinutes = sectionList.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const displayDuration = totalDurationMinutes > 0
    ? `${totalDurationMinutes} دقيقة`
    : lecture.estimatedDuration
      ? `${lecture.estimatedDuration} دقيقة`
      : "—";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("atlas-page mx-auto w-full max-w-6xl", className)}
    >
      <motion.div variants={itemVariants} className="mb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="atlas-hero-icon h-14 w-14 shrink-0">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="atlas-section-label">ملف المحاضرة</p>
                <StudioStatusBadge status={lecture.status} />
              </div>
              <h1 className="truncate text-2xl font-bold tracking-tight text-studio-fg">
                {lecture.title}
              </h1>
              {lecture.description && (
                <p className="mt-1 line-clamp-2 text-sm text-studio-fg-muted">
                  {lecture.description}
                </p>
              )}
            </div>
          </div>
          {onAddSection && (
            <StudioButton
              onClick={onAddSection}
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              className="shrink-0"
            >
              قسم جديد
            </StudioButton>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard icon={Layers} label="الأقسام" value={sectionList.length} />
        <MetricCard icon={FileText} label="وحدات المحتوى" value={totalContent} />
        <MetricCard icon={Clock} label="المدة التقديرية" value={displayDuration} />
      </motion.div>

      <motion.div variants={itemVariants} className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="atlas-section-label">الأقسام داخل هذه المحاضرة</h2>
          <span className="text-[11px] text-studio-fg-muted">{sectionList.length} قسم</span>
        </div>
        {sectionList.length === 0 ? (
          <div className="atlas-empty-card flex flex-col items-center gap-3 p-8 text-center">
            <div className="atlas-hero-icon h-14 w-14">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-studio-fg">لا توجد أقسام بعد</p>
              <p className="mt-1 text-xs text-studio-fg-muted">
                ابدأ بإضافة قسم لتنظيم المحتوى التعليمي داخل المحاضرة.
              </p>
            </div>
            {onAddSection && (
              <StudioButton onClick={onAddSection} variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                إنشاء أول قسم
              </StudioButton>
            )}
          </div>
        ) : (
          <div className="atlas-table">
            <div className="atlas-table-head" aria-hidden="true">
              <span>القسم</span>
              <span>المحتوى</span>
              <span>المدة</span>
              <span>الحالة</span>
              <span className="text-end">تفاصيل</span>
            </div>
            {sectionList.map((section, index) => (
              <div key={section.id} className="atlas-table-row">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="atlas-row-index">{index + 1}</span>
                  <span className="atlas-row-icon">
                    <Layers className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-studio-fg">{section.title}</span>
                    <span className="block text-[11px] text-studio-fg-muted">ترتيب {section.order}</span>
                  </span>
                </div>
                <span className="atlas-row-meta text-xs text-studio-fg-muted">{section.lessonsCount} عنصر</span>
                <span className="atlas-row-meta text-xs text-studio-fg-muted">
                  {section.durationMinutes ? `${section.durationMinutes} د` : "—"}
                </span>
                <span className="atlas-row-meta"><StudioStatusBadge status={section.status} /></span>
                <span className="atlas-row-actions text-studio-fg-subtle">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="elevated" padding="md" className="atlas-card">
          <div className="border-b border-studio-border pb-3">
            <p className="atlas-section-label">بيانات المحاضرة</p>
          </div>
          <dl className="grid gap-x-6 gap-y-3 pt-4 sm:grid-cols-2">
            {[
              ["الترتيب", String(lecture.order)],
              ["الحالة", lecture.status],
              ["تاريخ الإنشاء", new Date(lecture.createdAt).toLocaleDateString("ar-SA")],
              ["آخر تحديث", new Date(lecture.updatedAt).toLocaleDateString("ar-SA")],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-studio-border/60 pb-2 last:border-0">
                <dt className="text-xs text-studio-fg-muted">{label}</dt>
                <dd className="text-sm font-semibold text-studio-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </StudioSurfaceCard>
      </motion.div>
    </motion.div>
  );
}

export { CourseStudioLectureOverview };
