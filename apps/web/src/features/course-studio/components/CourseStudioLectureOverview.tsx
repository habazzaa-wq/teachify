"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Layers,
  FileText,
  BookOpen,
  Plus,
  Sparkles,
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
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

function MetricCard({
  icon: Icon,
  label,
  value,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  delay?: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="cw3-metric"
    >
      <div className="flex items-center gap-3">
        <div className="cw3-metric-icon">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-studio-fg-muted">{label}</p>
          <p className="text-lg font-semibold text-studio-fg">{value}</p>
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
  const hasSections = sectionList.length > 0;
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
      className={cn("cw3-page mx-auto w-full max-w-5xl", className)}
    >
      <motion.div variants={itemVariants} className="cw3-hero cw3-full">
        <div className="flex items-center gap-3">
          <div className="cw3-hero-icon h-14 w-14">
            <BookOpen className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-studio-fg">
                {lecture.title}
              </h1>
              <StudioStatusBadge status={lecture.status} />
            </div>
            {lecture.description && (
              <p className="mt-1 text-sm text-studio-fg-muted line-clamp-2">
                {lecture.description}
              </p>
            )}
          </div>
        </div>

        {!hasSections && (
          <motion.div
            variants={itemVariants}
            className="cw3-empty-card cw3-full relative overflow-hidden p-8 text-center"
          >
            <div className="absolute -inset-4 rounded-full bg-studio-accent/5 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <div className="cw3-hero-icon mx-auto mb-4 h-20 w-20 rounded-[1.75rem]">
                <Sparkles className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-studio-fg">
                لم يتم إضافة أقسام بعد
              </h3>
              <p className="mx-auto mb-6 max-w-sm text-sm text-studio-fg-muted">
                الأقسام تساعدك في تنظيم المحتوى التعليمي داخل المحاضرة. ابدأ بإضافة أول قسم.
              </p>
              {onAddSection && (
                <StudioButton
                  onClick={onAddSection}
                  variant="primary"
                  size="lg"
                  icon={<Plus className="h-4 w-4" />}
                >
                  إنشاء أول قسم
                </StudioButton>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="cw3-primary">
        <h2 className="cw3-section-label mb-3">نظرة عامة</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={Layers}
            label="عدد الأقسام"
            value={sectionList.length}
          />
          <MetricCard
            icon={FileText}
            label="عدد المحتوى"
            value={totalContent}
          />
          <MetricCard
            icon={Clock}
            label="المدة التقديرية"
            value={displayDuration}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="cw3-secondary">
        <StudioSurfaceCard variant="elevated" padding="md" className="cw3-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-studio-border pb-3">
              <span className="text-sm text-studio-fg-muted">المعلومات</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-studio-fg-muted">الترتيب</p>
                <p className="text-sm font-medium text-studio-fg">{lecture.order}</p>
              </div>
              <div>
                <p className="text-xs text-studio-fg-muted">الحالة</p>
                <p className="text-sm font-medium text-studio-fg">
                  {lecture.status === "draft"
                    ? "مسودة"
                    : lecture.status === "published"
                      ? "منشور"
                      : lecture.status === "archived"
                        ? "مؤرشف"
                        : lecture.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-studio-fg-muted">تاريخ الإنشاء</p>
                <p className="text-sm font-medium text-studio-fg">
                  {new Date(lecture.createdAt).toLocaleDateString("ar-SA")}
                </p>
              </div>
              <div>
                <p className="text-xs text-studio-fg-muted">آخر تحديث</p>
                <p className="text-sm font-medium text-studio-fg">
                  {new Date(lecture.updatedAt).toLocaleDateString("ar-SA")}
                </p>
              </div>
            </div>
          </div>
        </StudioSurfaceCard>
      </motion.div>

      {hasSections && (
        <motion.div variants={itemVariants} className="cw3-full">
          <h2 className="cw3-section-label mb-3">الأقسام</h2>
          <div className="space-y-2">
            {sectionList.map((section) => (
              <div
                key={section.id}
                className="cw3-card flex items-center gap-3 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-studio-accent-soft">
                  <Layers className="h-4 w-4 text-studio-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-studio-fg">
                    {section.title}
                  </p>
                  <p className="text-xs text-studio-fg-muted">
                    {section.lessonsCount} محتوى · {section.order}
                  </p>
                </div>
                <StudioStatusBadge status={section.status} />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {hasSections && onAddSection && (
        <motion.div variants={itemVariants} className="cw3-full mt-1">
          <StudioButton
            onClick={onAddSection}
            variant="secondary"
            size="md"
            icon={<Plus className="h-4 w-4" />}
          >
            إضافة قسم
          </StudioButton>
        </motion.div>
      )}
    </motion.div>
  );
}

export { CourseStudioLectureOverview };
