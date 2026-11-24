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
  layout?: "mobile" | "laptop" | "desktop";
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

const layoutLabel: Record<NonNullable<CourseStudioHeaderProps["layout"]>, string> = {
  mobile: "مساحة لمسية",
  laptop: "مساحة اللاب توب",
  desktop: "مساحة سطح المكتب",
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
  layout = "desktop",
  onToggleNavigator,
  onToggleInspector,
  onPublish,
  onQuickAction,
}: CourseStudioHeaderProps) {
  return (
    <motion.header
      {...headerMotion}
      className="cw3-header px-3 pb-3 pt-3 sm:px-5 lg:px-6"
      role="banner"
      aria-label="رأس الاستوديو"
    >
      <div className="flex items-center gap-3 lg:gap-5">
        <div className="cw3-brand-mark h-10 w-11 shrink-0 lg:h-12 lg:w-12">
          <GraduationCap className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="cw3-eyebrow">Course Studio</p>
            <span className="hidden h-3 w-px bg-white/25 sm:block" aria-hidden="true" />
            <span className="hidden text-[11px] font-medium text-white/75 sm:inline">
              {layoutLabel[layout]}
            </span>
            {courseStatus && <StudioStatusBadge status={courseStatus} />}
          </div>
          <h1 className="cw3-title mt-1 truncate text-base lg:text-xl" title={courseName}>
            {courseName}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
          <span className="hidden items-center gap-1.5 text-xs font-medium text-white/85 xl:flex">
            {isSaving ? (
              <>
                <Clock className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
                جارٍ الحفظ
              </>
            ) : isSaved ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                محفوظ
              </>
            ) : null}
          </span>

          <span className="hidden h-4 w-px bg-white/20 xl:block" aria-hidden="true" />

          <StudioButton
            variant="ghost"
            size="icon"
            onClick={onToggleNavigator}
            aria-label={navigatorOpen ? "إغلاق المستكشف" : "فتح المستكشف"}
            aria-pressed={navigatorOpen}
            className="cw3-icon-btn h-11 w-11 lg:h-10 lg:w-10"
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
            className="cw3-icon-btn h-11 w-11 lg:h-10 lg:w-10"
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
              className="cw3-primary-btn h-10 rounded-xl px-3 text-xs font-semibold lg:px-4"
            >
              <span className="hidden sm:inline">نشر الدورة</span>
              <span className="sm:hidden">نشر</span>
            </StudioButton>
          )}

          <StudioDropdown
            trigger={
              <StudioButton
                variant="ghost"
                size="icon"
                aria-label="إجراءات سريعة"
                className="cw3-icon-btn h-11 w-11 lg:h-10 lg:w-10"
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

      <div className="cw3-meta-strip mt-3 flex items-center gap-3 overflow-x-auto pt-2 text-[11px] lg:gap-6 lg:text-xs">
        {typeof studentsCount === "number" && (
          <span className="cw3-meta-item">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {studentsCount} طالب
          </span>
        )}
        {visibility && (
          <span className="cw3-meta-item">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {visibilityLabel[visibility] ?? visibility}
          </span>
        )}
        {lastEdited && (
          <span className="cw3-meta-item">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {lastEdited}
          </span>
        )}
        <span className="cw3-meta-item ms-auto shrink-0">
          {isSaving ? (
            <span>جارٍ الحفظ…</span>
          ) : isSaved ? (
            <span>كل التغييرات محفوظة</span>
          ) : null}
        </span>
      </div>
    </motion.header>
  );
}

export { CourseStudioHeader };
