"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  PanelLeftClose,
  PanelRight,
  Pencil,
  Send,
  Share2,
  Sparkles,
} from "lucide-react";
import { AppBreadcrumb, PermissionGuard } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Course } from "@/features/courses/types";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "bg-warning/10 text-warning" },
  review: { label: "قيد المراجعة", cls: "bg-blue/10 text-blue" },
  published: { label: "منشورة", cls: "bg-success/10 text-success" },
  scheduled: { label: "مجدولة", cls: "bg-secondary/10 text-secondary" },
  archived: { label: "مؤرشفة", cls: "bg-muted text-muted-foreground" },
};

function IconAction({
  onClick,
  active = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground/50 hover:bg-muted/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

interface StudioTopBarProps {
  course: Course | null | undefined;
  courseLoading: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  showPanelToggles: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onEdit: () => void;
  onShare: () => void;
  onPublish: () => void;
  publishPending: boolean;
}

/**
 * Studio chrome: breadcrumb + status on one side, panel toggles and actions on the other.
 */
const StudioTopBar = memo(function StudioTopBar({
  course,
  courseLoading,
  leftPanelOpen,
  rightPanelOpen,
  showPanelToggles,
  onToggleLeftPanel,
  onToggleRightPanel,
  onEdit,
  onShare,
  onPublish,
  publishPending,
}: StudioTopBarProps) {
  const status = course ? STATUS_META[course.status] ?? STATUS_META.draft : null;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/80 px-4 py-2 backdrop-blur-xl sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <AppBreadcrumb
          items={[
            { label: "الدورات", href: "/teacher/courses" },
            { label: courseLoading ? "..." : (course?.title ?? ""), href: "#" },
          ]}
        />
        {status && (
          <span className={cn("hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline", status.cls)}>
            {status.label}
          </span>
        )}
        {course?.featured && (
          <span className="hidden items-center gap-1 text-[10px] font-semibold text-amber sm:flex">
            <Sparkles className="h-3 w-3" />
            مميزة
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {showPanelToggles && (
          <>
            <IconAction
              onClick={onToggleLeftPanel}
              active={leftPanelOpen}
              label={leftPanelOpen ? "إخفاء المستكشف (Ctrl+B)" : "إظهار المستكشف (Ctrl+B)"}
            >
              <PanelLeftClose className="h-4 w-4" />
            </IconAction>
            <IconAction
              onClick={onToggleRightPanel}
              active={rightPanelOpen}
              label={rightPanelOpen ? "إخفاء الخصائص (Ctrl+I)" : "إظهار الخصائص (Ctrl+I)"}
            >
              <PanelRight className="h-4 w-4" />
            </IconAction>
            <div className="mx-1 h-5 w-px bg-border/40" />
          </>
        )}

        <PermissionGuard permission="courses.update">
          <IconAction onClick={onEdit} label="تعديل بيانات الدورة">
            <Pencil className="h-4 w-4" />
          </IconAction>
        </PermissionGuard>
        <IconAction onClick={onShare} label="نسخ رابط الدورة">
          <Share2 className="h-4 w-4" />
        </IconAction>

        <PermissionGuard permission="courses.publish">
          {course && course.status !== "published" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPublish}
              disabled={publishPending}
              className="ms-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <Send className="h-3.5 w-3.5" />
              نشر
            </motion.button>
          )}
        </PermissionGuard>
      </div>
    </motion.header>
  );
});

export { StudioTopBar };
