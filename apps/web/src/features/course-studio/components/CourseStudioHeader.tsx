"use client";

import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  Send,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  CheckCircle2,
  Clock,
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
      className="flex shrink-0 items-center gap-2 border-b border-studio-border bg-studio-glass-toolbar px-3 py-2.5 backdrop-blur-xl sm:px-4 md:gap-3 md:px-6 md:py-3"
      role="banner"
      aria-label="رأس الاستوديو"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-studio-accent-soft ring-1 ring-studio-accent-border/50 md:h-10 md:w-10">
        <GraduationCap className="h-5 w-5 text-studio-accent" aria-hidden="true" />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <h2 className="truncate text-sm font-semibold text-studio-fg">
          {courseName}
        </h2>

        {courseStatus && (
          <StudioStatusBadge status={courseStatus} />
        )}

        {visibility === "private" && (
          <span className="hidden items-center gap-1 rounded-full border border-studio-border/50 bg-studio-soft px-2 py-0.5 text-[10px] text-studio-fg-muted sm:inline-flex">
            خاص
          </span>
        )}

        {typeof studentsCount === "number" && (
          <span className="hidden items-center gap-1 text-xs text-studio-fg-muted sm:inline-flex">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {studentsCount}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 md:gap-2">
        {isSaving && (
          <span className="hidden items-center gap-1.5 text-xs text-studio-warning lg:inline-flex">
            <Clock className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
            جارٍ الحفظ
          </span>
        )}

        {isSaved && (
          <span className="hidden items-center gap-1.5 text-xs text-studio-success lg:inline-flex">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            محفوظ
          </span>
        )}

        {lastEdited && (
          <span className="hidden text-xs text-studio-fg-subtle lg:inline-flex">
            {lastEdited}
          </span>
        )}

        <div className="mx-0.5 hidden h-4 w-px bg-studio-border lg:block" aria-hidden="true" />

        <StudioButton
          variant="ghost"
          size="icon"
          onClick={onToggleNavigator}
          aria-label={navigatorOpen ? "إغلاق المستكشف" : "فتح المستكشف"}
          aria-pressed={navigatorOpen}
          className="h-11 w-11 md:h-10 md:w-10"
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
          className="h-11 w-11 md:h-10 md:w-10"
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
            className="h-9 px-2.5 sm:h-8 sm:px-3"
          >
            <span className="hidden sm:inline">نشر</span>
          </StudioButton>
        )}

        <StudioDropdown
          trigger={
            <StudioButton variant="ghost" size="icon" aria-label="إجراءات سريعة" className="h-11 w-11 md:h-10 md:w-10">
              <MoreHorizontal className="h-4 w-4" />
            </StudioButton>
          }
          items={[
            { label: "تعديل الدورة", value: "edit", icon: <GraduationCap className="h-4 w-4" /> },
            { label: "معاينة", value: "preview", icon: <GraduationCap className="h-4 w-4" /> },
            { label: "الإحصائيات", value: "analytics", icon: <GraduationCap className="h-4 w-4" /> },
            { separator: true } as const,
            { label: "حذف الدورة", value: "delete", danger: true, icon: <GraduationCap className="h-4 w-4" /> },
          ]}
          onSelect={(item) => onQuickAction?.(item.value ?? item.label)}
          align="end"
        />
      </div>
    </motion.header>
  );
}

export { CourseStudioHeader };
