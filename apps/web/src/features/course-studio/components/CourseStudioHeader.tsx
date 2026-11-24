"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  ListTree,
  MoreHorizontal,
  Pencil,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioDropdown } from "@/components/studio/overlays/StudioDropdown";
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
    <motion.header {...headerMotion} className="nova-header shrink-0 px-3 pb-2.5 pt-3 sm:px-5 md:px-6" role="banner" aria-label="رأس الاستوديو">
      <div className="flex items-center gap-3 md:gap-5">
        <div className="nova-brand-mark h-11 w-11 shrink-0 md:h-12 md:w-12">
          <Sparkles className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="nova-eyebrow">Studio Nova</p>
            <span className="hidden h-3 w-px bg-studio-border sm:block" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-studio-fg-muted">منصة تحرير المنهج</span>
            {courseStatus && <StudioStatusBadge status={courseStatus} />}
          </div>
          <h1 className="nova-title mt-1 truncate text-lg md:text-xl" title={courseName}>{courseName}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <span className={cn(
            "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold lg:inline-flex",
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
            className="nova-icon-btn h-11 w-11"
          >
            <ListTree className="h-4 w-4" />
          </StudioButton>
          <StudioButton
            variant="ghost"
            size="icon"
            onClick={onToggleInspector}
            aria-label={inspectorOpen ? "إخفاء الخصائص" : "إظهار الخصائص"}
            aria-pressed={inspectorOpen}
            className="nova-icon-btn h-11 w-11"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </StudioButton>

          {onPublish && (
            <StudioButton
              variant="primary"
              size="sm"
              onClick={onPublish}
              icon={<Send className="h-3.5 w-3.5" />}
              aria-label="نشر الدورة"
              className="nova-primary-btn h-10 rounded-xl px-3 text-xs md:px-4"
            >
              نشر الدورة
            </StudioButton>
          )}

          <StudioDropdown
            trigger={
              <StudioButton variant="ghost" size="icon" aria-label="إجراءات سريعة" className="nova-icon-btn h-11 w-11">
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

      <div className="nova-meta-strip mt-2.5 flex items-center gap-3 overflow-x-auto pt-2 text-[11px] md:gap-5 md:text-xs">
        {typeof studentsCount === "number" && (
          <span className="nova-meta-item"><Users className="h-3.5 w-3.5 text-studio-accent" />{studentsCount} طالب</span>
        )}
        {visibility && (
          <span className="nova-meta-item"><Eye className="h-3.5 w-3.5 text-studio-accent" />{visibilityLabel[visibility] ?? visibility}</span>
        )}
        {lastEdited && (
          <span className="nova-meta-item"><Clock className="h-3.5 w-3.5 text-studio-accent" />{lastEdited}</span>
        )}
        <span className="nova-meta-item ms-auto shrink-0 text-studio-fg-subtle">اسحب البطاقات لإعادة الترتيب</span>
      </div>
    </motion.header>
  );
}

export { CourseStudioHeader };
