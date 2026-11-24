"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  ListTree,
  Plus,
  Send,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { cn } from "@/lib/cn";

interface CourseStudioHeaderProps {
  courseName?: string;
  courseStatus?: string;
  visibility?: string;
  studentsCount?: number;
  lastEdited?: string;
  isSaving?: boolean;
  isSaved?: boolean;
  navigatorOpen?: boolean;
  inspectorOpen?: boolean;
  onToggleNavigator?: () => void;
  onToggleInspector?: () => void;
  onAdd?: () => void;
  onPublish?: () => void;
}

const headerMotion = {
  initial: { y: -8, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
};

const visibilityLabel: Record<string, string> = {
  private: "خاص",
  public: "عام",
  unlisted: "غير مدرج",
  preview: "معاينة",
};

function CourseStudioHeader({
  courseName = "عنوان الدورة",
  courseStatus,
  visibility,
  studentsCount,
  lastEdited,
  isSaving,
  isSaved,
  navigatorOpen,
  inspectorOpen,
  onToggleNavigator,
  onToggleInspector,
  onAdd,
  onPublish,
}: CourseStudioHeaderProps) {
  return (
    <motion.header {...headerMotion} className="nova-header cw-header shrink-0 px-3 pb-2.5 pt-3 sm:px-4" role="banner" aria-label="أدوات تحرير الدورة">
      <div className="cw-header-row flex items-center gap-3">
        <div className="nova-brand-mark flex h-10 w-10 shrink-0 items-center justify-center sm:h-11 sm:w-11">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="nova-eyebrow">مساحة التحرير</p>
            {courseStatus && <StudioStatusBadge status={courseStatus} />}
          </div>
          <h2 className="nova-title mt-0.5 truncate text-base md:text-lg" title={courseName}>{courseName}</h2>
        </div>

        <div className="cw-header-actions flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className={cn(
            "cw-save-chip hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold xl:inline-flex",
            isSaving
              ? "border-studio-warning/30 bg-studio-warning/10 text-studio-warning"
              : isSaved
                ? "border-studio-success/25 bg-studio-success/10 text-studio-success"
                : "border-studio-border bg-white/70 text-studio-fg-muted",
          )}>
            {isSaving ? <Clock className="h-3.5 w-3.5 animate-pulse" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {isSaving ? "جارٍ الحفظ" : isSaved ? "محفوظ" : "جاهز"}
          </span>

          <StudioButton
            variant="ghost"
            size="icon"
            onClick={onToggleNavigator}
            aria-label={navigatorOpen ? "إخفاء المخطط" : "إظهار المخطط"}
            aria-pressed={navigatorOpen}
            className="nova-icon-btn cw-desktop-only h-10 w-10"
          >
            <ListTree className="h-4 w-4" />
          </StudioButton>
          <StudioButton
            variant="ghost"
            size="icon"
            onClick={onToggleInspector}
            aria-label={inspectorOpen ? "إخفاء الخصائص" : "إظهار الخصائص"}
            aria-pressed={inspectorOpen}
            className="nova-icon-btn cw-desktop-only h-10 w-10"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </StudioButton>

          {onAdd && (
            <StudioButton
              variant="primary"
              size="sm"
              onClick={onAdd}
              icon={<Plus className="h-4 w-4" />}
              className="cw-header-add cw-desktop-only h-10 rounded-lg px-3"
            >
              محتوى جديد
            </StudioButton>
          )}

          {onPublish && (
            <StudioButton
              variant="primary"
              size="sm"
              onClick={onPublish}
              icon={<Send className="h-3.5 w-3.5" />}
              aria-label="نشر الدورة"
              className="nova-primary-btn cw-publish h-10 rounded-lg px-3"
            >
              نشر
            </StudioButton>
          )}
        </div>
      </div>

      <div className="nova-meta-strip cw-meta-strip mt-2 flex items-center gap-3 overflow-x-auto pt-2 text-[11px] sm:gap-4">
        {typeof studentsCount === "number" && (
          <span className="nova-meta-item"><Users className="h-3.5 w-3.5" aria-hidden="true" />{studentsCount} طالب</span>
        )}
        {visibility && (
          <span className="nova-meta-item"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{visibilityLabel[visibility] ?? visibility}</span>
        )}
        {lastEdited && (
          <span className="nova-meta-item"><Clock className="h-3.5 w-3.5" aria-hidden="true" />آخر تحديث: {lastEdited}</span>
        )}
      </div>
    </motion.header>
  );
}

export { CourseStudioHeader };
