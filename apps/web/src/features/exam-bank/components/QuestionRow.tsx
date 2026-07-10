"use client";

import { memo, useCallback, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Copy, Archive, Upload, Trash2 } from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  AppCheckbox,
  PermissionGuard,
} from "@/components/ui";
import { StudioSurfaceCard, StudioStatusChip, StudioChip } from "@/components/studio";
import { cn } from "@/lib/cn";
import {
  QUESTION_TYPE_CONFIG,
  DIFFICULTY_CONFIG,
} from "@/features/exam-bank/constants";
import type { Question, QuestionStatus } from "@/features/exam-bank/types";

type StudioStatus = "active" | "pending" | "archived";

function statusToStudioStatus(status: QuestionStatus): StudioStatus {
  if (status === "published") return "active";
  if (status === "draft") return "pending";
  return "archived";
}

function difficultyToChipVariant(color: string) {
  if (color === "success") return "success" as const;
  if (color === "warning") return "warning" as const;
  return "danger" as const;
}

interface QuestionRowProps {
  question: Question;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: () => void;
  onClick?: (question: Question) => void;
  onToggleSelect?: (selected: boolean, e?: MouseEvent) => void;
  onDuplicate?: (question: Question) => void;
  onArchive?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onPublish?: (question: Question) => void;
}

function QuestionRowBase({
  question,
  selected,
  selectable = true,
  onSelect,
  onClick,
  onToggleSelect,
  onDuplicate,
  onArchive,
  onDelete,
  onPublish,
}: QuestionRowProps) {
  const typeCfg = QUESTION_TYPE_CONFIG[question.type];
  const TypeIcon = typeCfg.icon;
  const difficultyCfg = DIFFICULTY_CONFIG[question.difficulty];
  const isArchived = question.status === "archived";
  const isPublished = question.status === "published";

  const handleCardClick = useCallback(() => {
    if (onClick) onClick(question);
    else onSelect?.();
  }, [onClick, onSelect, question]);

  const handleToggle = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onToggleSelect?.(!selected, e);
    },
    [onToggleSelect, selected],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className={cn("group relative", selected && "z-10")}
    >
      <StudioSurfaceCard
        hoverable
        padding="none"
        className={cn(
          "overflow-hidden",
          selected && "ring-1 ring-studio-accent border-studio-accent",
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-3 p-4">
          {selectable && (
            <div
              className="mt-0.5"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AppCheckbox
                checked={!!selected}
                onClick={handleToggle}
                aria-label="تحديد السؤال"
              />
            </div>
          )}

          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              typeCfg.bg,
              typeCfg.color,
            )}
          >
            <TypeIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={handleCardClick}
                className="line-clamp-2 text-start text-sm font-semibold text-studio-fg hover:underline focus-visible:underline focus:outline-none"
              >
                {question.title}
              </button>

              <div
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <AppDropdownMenu>
                  <AppDropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg"
                      aria-label="خيارات السؤال"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </AppDropdownMenuTrigger>
                  <AppDropdownMenuContent align="end" className="w-44">
                    {onDuplicate && (
                      <PermissionGuard permission="questions.create">
                        <AppDropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate(question);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          نسخ
                        </AppDropdownMenuItem>
                      </PermissionGuard>
                    )}
                    {!isPublished && onPublish && (
                      <PermissionGuard permission="questions.publish">
                        <AppDropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPublish(question);
                          }}
                        >
                          <Upload className="h-4 w-4" />
                          نشر
                        </AppDropdownMenuItem>
                      </PermissionGuard>
                    )}
                    {!isArchived && onArchive && (
                      <PermissionGuard permission="questions.archive">
                        <AppDropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchive(question);
                          }}
                        >
                          <Archive className="h-4 w-4" />
                          أرشفة
                        </AppDropdownMenuItem>
                      </PermissionGuard>
                    )}
                    {onDelete && (
                      <>
                        <AppDropdownMenuSeparator />
                        <PermissionGuard permission="questions.delete">
                          <AppDropdownMenuItem
                            className="text-studio-danger focus:text-studio-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(question);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </AppDropdownMenuItem>
                        </PermissionGuard>
                      </>
                    )}
                  </AppDropdownMenuContent>
                </AppDropdownMenu>
              </div>
            </div>

            {question.description && (
              <p className="mt-1 line-clamp-2 text-xs text-studio-fg-muted">
                {question.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StudioChip variant="accent" size="sm" className="gap-1">
                <TypeIcon className="h-3 w-3" />
                {typeCfg.label}
              </StudioChip>
              <StudioChip
                variant={difficultyToChipVariant(difficultyCfg.color)}
                size="sm"
              >
                {difficultyCfg.label}
              </StudioChip>
              <StudioStatusChip status={statusToStudioStatus(question.status)} />
              <StudioChip variant="default" size="sm">
                {question.points} نقطة
              </StudioChip>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-studio-fg-muted">
              {question.category?.name && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-studio-fg-subtle" />
                  {question.category.name}
                </span>
              )}
              {question.tags.length > 0 && (
                <span className="truncate">
                  {question.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
                  {question.tags.length > 3 && ` +${question.tags.length - 3}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </StudioSurfaceCard>
    </motion.div>
  );
}

export const QuestionRow = memo(QuestionRowBase);
export default QuestionRow;
