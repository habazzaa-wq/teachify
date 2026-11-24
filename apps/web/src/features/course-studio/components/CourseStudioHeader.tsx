"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioDropdown } from "@/components/studio/overlays/StudioDropdown";

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
  onPublish?: () => void;
  onQuickAction?: (action: string) => void;
}

const headerMotion = {
  initial: { y: -8, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
};

const visibilityLabel: Record<string, string> = {
  private: "خاص",
  public: "عام",
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
  onPublish,
  onQuickAction,
}: CourseStudioHeaderProps) {
  return (
    <motion.header
      {...headerMotion}
      className="atlas-header shrink-0 px-3 pb-2.5 pt-3 sm:px-5 md:px-6"
      role="banner"
      aria-label="رأس الاستوديو"
    >
      <div className="flex items-center gap-2.5 md:gap-4">
        <div className="atlas-brand-mark h-10 w-10 shrink-0 md:h-11 md:w-11">
          <GraduationCap className="h-5 w-5 md:h-[22px] md:w-[22px]" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="atlas-eyebrow hidden sm:block">Course Studio</p>
            <span className="hidden h-3 w-px bg-studio-border sm:block" aria-hidden="true" />
            <span className="text-[11px] font-medium text-studio-fg-muted">مساحة تحرير الدورة</span>
            {courseStatus && <StudioStatusBadge status={courseStatus} />}
          </div>
          <h1 className="atlas-title mt-1 truncate text-base md:text-lg" title={courseName}>
            {courseName}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            {isSaving && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-studio-warning">
                <Clock className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
                جارٍ الحفظ
              </span>
            )}
            {!isSaving && isSaved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-studio-success">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                محفوظ
              </span>
            )}
            <span className="h-4 w-px bg-studio-border" aria-hidden="true" />
          </div>

          <StudioButton
            variant="ghost"
            size="icon"
            onClick={onToggleNavigator}
            aria-label={navigatorOpen ? "إغلاق المستكشف" : "فتح المستكشف"}
            aria-pressed={navigatorOpen}
            className="atlas-icon-btn h-11 w-11 md:h-10 md:w-10"
          >
            {navigatorOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </StudioButton>

          <StudioButton
            variant="ghost"
            size="icon"
            onClick={onToggleInspector}
            aria-label={inspectorOpen ? "إغلاق الخصائص" : "فتح الخصائص"}
            aria-pressed={inspectorOpen}
            className="atlas-icon-btn h-11 w-11 md:h-10 md:w-10"
          >
            {inspectorOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </StudioButton>

          {onPublish && (
            <StudioButton
              variant="primary"
              size="sm"
              onClick={onPublish}
              icon={<Send className="h-3.5 w-3.5" />}
              aria-label="نشر الدورة"
              className="atlas-primary-btn h-10 rounded-xl px-3 text-xs font-semibold md:px-4"
            >
              نشر الدورة
            </StudioButton>
          )}

          <StudioDropdown
            trigger={
              <StudioButton
                variant="ghost"
                size="icon"
                aria-label="إجراءات سريعة"
                className="atlas-icon-btn h-11 w-11 md:h-10 md:w-10"
              >
                <MoreHorizontal className="h-4 w-4" />
              </StudioButton>
            }
            items={[
              { label: "تعديل الدورة", value: "edit", icon: <Pencil className="h-4 w-4" /> },
              { label: "معاينة", value: "preview", icon: <Eye className="h-4 w-4" /> },
              { label: "الإحصائيات", value: "analytics", icon: <BarChart3 className="h-4 w-4" /> },
              { separator: true } as const,
              { label: "حذف الدورة", value: "delete", danger: true, icon: <Trash2 className="h-4 w-4" /> },
            ]}
            onSelect={(item) => onQuickAction?.(item.value ?? item.label)}
            align="end"
          />
        </div>
      </div>

      <div className="atlas-meta-strip mt-2.5 flex items-center gap-3 overflow-x-auto pt-2 text-[11px] md:gap-5 md:text-xs">
        {typeof studentsCount === "number" && (
          <span className="atlas-meta-item">
            <Users className="h-3.5 w-3.5 text-studio-accent" aria-hidden="true" />
            {studentsCount} طالب
          </span>
        )}
        {visibility && (
          <span className="atlas-meta-item">
            <Eye className="h-3.5 w-3.5 text-studio-accent" aria-hidden="true" />
            {visibilityLabel[visibility] ?? visibility}
          </span>
        )}
        {lastEdited && (
          <span className="atlas-meta-item">
            <Clock className="h-3.5 w-3.5 text-studio-accent" aria-hidden="true" />
            {lastEdited}
          </span>
        )}
        <span className="atlas-meta-item ms-auto shrink-0">
          {isSaving ? (
            <span className="text-studio-warning">جارٍ الحفظ…</span>
          ) : isSaved ? (
            <span className="text-studio-success">كل التغييرات محفوظة</span>
          ) : null}
        </span>
      </div>
    </motion.header>
  );
}

export { CourseStudioHeader };
