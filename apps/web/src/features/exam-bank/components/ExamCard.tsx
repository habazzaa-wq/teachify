"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Building2,
  Globe,
  Star,
  Pin,
  MoreHorizontal,
  Copy,
  Archive as ArchiveIcon,
  Trash2,
  Send,
  Clock,
  ListChecks,
  Award,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  AppCheckbox,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  PermissionGuard,
} from "@/components/ui";
import {
  StudioSurfaceCard,
  StudioStatusChip,
  StudioChip,
  StudioButton,
} from "@/components/studio";
import { studioAnimationVariants } from "@/components/studio";
import { cn } from "@/lib/cn";
import { VISIBILITY_CONFIG } from "@/features/exam-bank/constants";
import type { Exam, ExamStatus, ExamVisibility, ViewMode } from "@/features/exam-bank/types";

interface ExamCardProps {
  exam: Exam;
  viewMode: ViewMode;
  selected?: boolean;
  onSelect?: (exam: Exam, selected: boolean) => void;
  onClick?: (exam: Exam) => void;
  onTogglePin?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  selectable?: boolean;
}

const VISIBILITY_ICON: Record<ExamVisibility, LucideIcon> = {
  private: Lock,
  organization: Building2,
  public: Globe,
};

const STATUS_TO_CHIP: Record<ExamStatus, "active" | "inactive" | "pending" | "suspended" | "archived"> = {
  published: "active",
  draft: "pending",
  archived: "archived",
};

function formatRelativeTime(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "الآن";
  if (diff < hour) return `قبل ${Math.floor(diff / minute)} دقيقة`;
  if (diff < day) return `قبل ${Math.floor(diff / hour)} ساعة`;
  if (diff < 30 * day) return `قبل ${Math.floor(diff / day)} يوم`;
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function ExamCardBase({
  exam,
  viewMode,
  selected = false,
  onSelect,
  onClick,
  onTogglePin,
  onToggleFavorite,
  onDuplicate,
  onArchive,
  onDelete,
  onPublish,
  selectable = true,
}: ExamCardProps) {
  const VisibilityIcon = VISIBILITY_ICON[exam.visibility];
  const visibilityLabel = VISIBILITY_CONFIG[exam.visibility]?.label ?? "";

  const handleClick = useCallback(() => onClick?.(exam), [exam, onClick]);

  const handleSelect = useCallback(
    (checked: boolean) => onSelect?.(exam, checked),
    [exam, onSelect],
  );

  const handleStop = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  const [relativeTime, setRelativeTime] = useState(() =>
    exam.updatedAt
      ? new Date(exam.updatedAt).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "",
  );

  useEffect(() => {
    setRelativeTime(formatRelativeTime(exam.updatedAt));
  }, [exam.updatedAt]);

  const meta = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-studio-fg-muted">
      {exam.duration ? (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {exam.duration} د
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1">
        <ListChecks className="h-3.5 w-3.5" />
        {exam.questionCount} سؤال
      </span>
      <span className="inline-flex items-center gap-1">
        <Award className="h-3.5 w-3.5" />
        {exam.totalPoints} نقطة
      </span>
      <span className="inline-flex items-center gap-1">
        <Target className="h-3.5 w-3.5" />
        نجاح {exam.passingScore}
      </span>
    </div>
  );

  return (
    <motion.div
      layout
      {...studioAnimationVariants.fadeInUp}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer",
        selected && "z-10",
      )}
    >
      <StudioSurfaceCard
        hoverable
        padding="none"
        className={cn(
          "overflow-hidden border",
          selected
            ? "border-studio-accent ring-1 ring-studio-accent/30 bg-studio-accent-soft/20"
            : "border-studio-border",
        )}
      >
        {/* Banner */}
        <div className="relative flex items-center justify-between gap-2 border-b border-studio-border bg-studio-soft/50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {exam.category ? (
              <StudioChip variant="accent" className="max-w-[9rem] truncate">
                {exam.category}
              </StudioChip>
            ) : null}
            <StudioStatusChip status={STATUS_TO_CHIP[exam.status]} />
          </div>

          <div className="flex items-center gap-1">
            {exam.featured ? (
              <StudioChip variant="warning" className="hidden sm:inline-flex">
                مميز
              </StudioChip>
            ) : null}
            <span
              className="inline-flex items-center gap-1 text-[11px] text-studio-fg-muted"
              title={visibilityLabel}
            >
              <VisibilityIcon className="h-3.5 w-3.5" />
            </span>

            {selectable ? (
              <div onClick={handleStop} className="opacity-0 transition-opacity group-hover:opacity-100">
                <AppCheckbox
                  checked={selected}
                  onCheckedChange={(v) => handleSelect(v === true)}
                  aria-label="تحديد"
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <h3 className="flex-1 truncate text-sm font-semibold text-studio-fg">
                <button
                  type="button"
                  onClick={handleClick}
                  className="text-start hover:underline focus-visible:underline focus:outline-none"
                  title={exam.title}
                >
                  {exam.title}
                </button>
              </h3>
            </div>
            {exam.description ? (
              <p className="line-clamp-2 text-xs text-studio-fg-muted">{exam.description}</p>
            ) : null}
          </div>

          {viewMode === "grid" ? meta : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-studio-fg-muted">
              {exam.duration ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {exam.duration} د
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" />
                {exam.questionCount} سؤال
              </span>
              <span className="inline-flex items-center gap-1">
                <Award className="h-3.5 w-3.5" />
                {exam.totalPoints} نقطة
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-studio-border/60 pt-3">
            <span className="text-[11px] text-studio-fg-subtle">
              {relativeTime}
            </span>

            <div className="flex items-center gap-1" onClick={handleStop}>
              <StudioButton
                variant="ghost"
                size="icon"
                aria-label={exam.pinned ? "إلغاء التثبيت" : "تثبيت"}
                aria-pressed={exam.pinned}
                className="h-7 w-7"
                onClick={() => onTogglePin?.(exam.id)}
              >
                <Pin className={cn("h-3.5 w-3.5", exam.pinned && "fill-studio-accent text-studio-accent")} />
              </StudioButton>
              <StudioButton
                variant="ghost"
                size="icon"
                aria-label={exam.favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                aria-pressed={exam.favorite}
                className="h-7 w-7"
                onClick={() => onToggleFavorite?.(exam.id)}
              >
                <Star className={cn("h-3.5 w-3.5", exam.favorite && "fill-amber-400 text-amber-400")} />
              </StudioButton>

              <AppDropdownMenu>
                <AppDropdownMenuTrigger asChild>
                  <StudioButton variant="ghost" size="icon" className="h-7 w-7" aria-label="المزيد">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </StudioButton>
                </AppDropdownMenuTrigger>
                <AppDropdownMenuContent align="end" className="w-44">
                  {exam.status !== "published" ? (
                    <PermissionGuard permission="exams.publish">
                      <AppDropdownMenuItem onClick={() => onPublish?.(exam.id)}>
                        <Send className="h-4 w-4" />
                        نشر
                      </AppDropdownMenuItem>
                    </PermissionGuard>
                  ) : null}
                  <PermissionGuard permission="exams.create">
                    <AppDropdownMenuItem onClick={() => onDuplicate?.(exam.id)}>
                      <Copy className="h-4 w-4" />
                      نسخ
                    </AppDropdownMenuItem>
                  </PermissionGuard>
                  {exam.status !== "archived" ? (
                    <PermissionGuard permission="exams.archive">
                      <AppDropdownMenuItem onClick={() => onArchive?.(exam.id)}>
                        <ArchiveIcon className="h-4 w-4" />
                        أرشفة
                      </AppDropdownMenuItem>
                    </PermissionGuard>
                  ) : null}
                  <AppDropdownMenuSeparator />
                  <PermissionGuard permission="exams.delete">
                    <AppDropdownMenuItem
                      className="text-studio-danger focus:text-studio-danger"
                      onClick={() => onDelete?.(exam.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </AppDropdownMenuItem>
                  </PermissionGuard>
                </AppDropdownMenuContent>
              </AppDropdownMenu>
            </div>
          </div>
        </div>
      </StudioSurfaceCard>
    </motion.div>
  );
}

export const ExamCard = memo(ExamCardBase);
export default ExamCard;
