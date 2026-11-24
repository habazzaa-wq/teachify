"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Layers,
  Plus,
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
  onSelectSection?: (id: string) => void;
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

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <motion.div variants={itemVariants} className="nova-stat-chip">
      <span><Icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        <small>{label}</small>
        <strong className="truncate">{value}</strong>
      </span>
    </motion.div>
  );
}

function CourseStudioLectureOverview({
  lecture,
  sections,
  onAddSection,
  onSelectSection,
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
      className={cn("nova-page", className)}
    >
      <motion.section variants={itemVariants} className="nova-editorial-hero p-5 sm:p-7" data-mark="01">
        <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="nova-hero-index h-14 w-14 text-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="nova-section-label">ملف المحاضرة</p>
                <StudioStatusBadge status={lecture.status} />
              </div>
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-studio-fg sm:text-3xl">
                {lecture.title}
              </h1>
              {lecture.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-studio-fg-muted">
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
              className="nova-primary-btn shrink-0"
            >
              قسم جديد
            </StudioButton>
          )}
        </div>
      </motion.section>

      <motion.div variants={itemVariants} className="nova-stat-ribbon my-5">
        <StatChip icon={Layers} label="الأقسام" value={sectionList.length} />
        <StatChip icon={FileText} label="وحدات المحتوى" value={totalContent} />
        <StatChip icon={Clock} label="المدة التقديرية" value={displayDuration} />
      </motion.div>

      <motion.section variants={itemVariants} className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="nova-section-label">مسار المحاضرة</p>
            <h2 className="text-base font-extrabold text-studio-fg">الأقسام داخل هذه المحاضرة</h2>
          </div>
          <span className="rounded-full border border-studio-border bg-white/80 px-3 py-1 text-[11px] font-bold text-studio-fg-muted">
            {sectionList.length} قسم
          </span>
        </div>

        {sectionList.length === 0 ? (
          <div className="nova-empty-card flex flex-col items-center gap-3 p-10 text-center">
            <div className="nova-hero-icon h-14 w-14"><Layers className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-bold text-studio-fg">لا توجد أقسام بعد</p>
              <p className="mt-1 text-xs text-studio-fg-muted">
                ابدأ بإضافة قسم لتنظيم المحتوى التعليمي داخل المحاضرة.
              </p>
            </div>
            {onAddSection && (
              <StudioButton onClick={onAddSection} variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} className="nova-primary-btn">
                إنشاء أول قسم
              </StudioButton>
            )}
          </div>
        ) : (
          <div className="nova-timeline cw-section-timeline">
            {sectionList.map((section, index) => (
              <motion.div
                key={section.id}
                variants={itemVariants}
                className="nova-timeline-item"
              >
                <span className="nova-step-bubble">{String(index + 1).padStart(2, "0")}</span>
                <button
                  type="button"
                  onClick={() => onSelectSection?.(section.id)}
                  className="nova-story-card w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
                  aria-label={`فتح القسم ${section.title}`}
                >
                  <div className="nova-story-card-head">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="nova-hero-icon h-10 w-10 rounded-xl"><Layers className="h-4 w-4" /></span>
                      <span className="min-w-0">
                        <span className="nova-mini-label">قسم {String(index + 1).padStart(2, "0")}</span>
                        <span className="block truncate text-sm font-extrabold text-studio-fg">{section.title}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StudioStatusBadge status={section.status} />
                      <ArrowLeft className="h-4 w-4 text-studio-fg-subtle" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="nova-story-card-body">
                    <span>
                      <span className="nova-mini-label">وحدات المحتوى</span>
                      <span className="nova-mini-value">{section.lessonsCount} عنصر</span>
                    </span>
                    <span>
                      <span className="nova-mini-label">المدة</span>
                      <span className="nova-mini-value">{section.durationMinutes ? `${section.durationMinutes} دقيقة` : "—"}</span>
                    </span>
                    <span>
                      <span className="nova-mini-label">الترتيب</span>
                      <span className="nova-mini-value">{section.order}</span>
                    </span>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="elevated" padding="md" className="nova-card">
          <p className="nova-section-label mb-4">بطاقة المحاضرة</p>
          <div className="nova-meta-grid">
            {[
              ["الترتيب", String(lecture.order)],
              ["الحالة", lecture.status ?? "—"],
              ["تاريخ الإنشاء", new Date(lecture.createdAt).toLocaleDateString("ar-SA")],
              ["آخر تحديث", new Date(lecture.updatedAt).toLocaleDateString("ar-SA")],
            ].map(([label, value]) => (
              <div key={label} className="nova-meta-tile">
                <span className="nova-mini-label">{label}</span>
                <span className="nova-mini-value">{value}</span>
              </div>
            ))}
          </div>
        </StudioSurfaceCard>
      </motion.div>
    </motion.div>
  );
}

export { CourseStudioLectureOverview };
