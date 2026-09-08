"use client";

import { FileText, Users } from "lucide-react";
import { StudioChip, StudioEmptyState } from "@/components/studio";
import { cn } from "@/lib/cn";
import { formatDateTime } from "../mappers";
import type { GradingQueueItem, GradingStatus } from "../types";

const STATUS_META: Partial<Record<GradingStatus, { label: string; variant: "warning" | "danger" | "accent" }>> = {
  pending_manual_review: { label: "بانتظار المراجعة", variant: "warning" },
  partially_graded: { label: "تصحيح جزئي", variant: "danger" },
  auto_graded: { label: "تصحيح آلي", variant: "accent" },
};

interface QueueListProps {
  items: GradingQueueItem[];
  selectedId: string | null;
  loading: boolean;
  resolveTitle?: (item: GradingQueueItem) => string;
  onSelect: (id: string) => void;
}

export function QueueList({ items, selectedId, loading, resolveTitle, onSelect }: QueueListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-studio-soft" aria-hidden />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <StudioEmptyState
        icon={<FileText className="h-6 w-6 text-studio-fg-muted" />}
        title="لا توجد إجابات للمراجعة"
        description="اكتملت مراجعة جميع إجابات هذا الاختبار."
      />
    );
  }

  return (
    <div className="space-y-2" role="listbox" aria-label="إجابات بانتظار المراجعة">
      {items.map((item, index) => {
        const status = STATUS_META[item.gradingStatus];
        const selected = item.id === selectedId;
        const title = resolveTitle?.(item);
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(item.id)}
            className={cn(
              "w-full rounded-xl border p-3 text-start transition-colors",
              selected
                ? "border-studio-accent-border bg-studio-accent-soft/40 ring-1 ring-studio-accent/30"
                : "border-studio-border bg-studio-surface hover:border-studio-accent-border/60 hover:bg-studio-soft/50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-studio-soft text-xs font-semibold text-studio-fg-muted">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium text-studio-fg">
                  {item.student?.name ?? "طالب"}
                </span>
              </span>
              {status && (
                <StudioChip variant={status.variant} size="sm">
                  {status.label}
                </StudioChip>
              )}
            </div>

            {title && <p className="mt-2 truncate text-xs text-studio-fg-muted">{title}</p>}

            <div className="mt-2 flex items-center gap-2 text-xs text-studio-fg-muted">
              {item.pageCount !== null && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {item.pageCount} صفحة
                </span>
              )}
              <span className="ms-auto font-medium text-studio-fg-muted">
                {item.points} نقطة
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-studio-fg-muted/80">
              <Users className="h-3 w-3" />
              {formatDateTime(item.answeredAt)}
            </p>
          </button>
        );
      })}
    </div>
  );
}