"use client";

import { useRouter } from "next/navigation";
import { ClipboardCheck, FileText, RefreshCw, ArrowDownUp } from "lucide-react";
import { AppErrorState } from "@/components/ui";
import { ChevronEndIcon } from "@/components/ui/icons";
import { StudioButton, StudioChip, StudioEmptyState, StudioSurfaceCard, StudioWorkspaceHeader } from "@/components/studio";
import { useGradingOverview } from "../hooks";
import { normalizeApiError } from "@/services/api/errors";

export function GradingOverviewScreen() {
  const router = useRouter();
  const overviewQuery = useGradingOverview();
  const items = overviewQuery.data ?? [];
  const totalPending = items.reduce((sum, item) => sum + item.pendingCount, 0);
  const error = overviewQuery.isError ? normalizeApiError(overviewQuery.error) : null;

  return (
    <div className="flex h-full flex-col">
      <StudioWorkspaceHeader
        left={
          <>
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate text-base font-semibold text-studio-fg">تصحيح إجابات الطلاب</h1>
              <span className="hidden text-sm text-studio-fg-muted md:inline">·</span>
              <p className="hidden truncate text-sm text-studio-fg-muted md:block">
                الأسئلة المقالية بنتظار مراجعة المعلم
              </p>
              <StudioChip variant="warning" size="sm">
                {totalPending} بانتظار المراجعة
              </StudioChip>
            </div>
          </>
        }
        right={
          <StudioButton
            variant="ghost"
            size="icon"
            onClick={() => void overviewQuery.refetch()}
            aria-label="تحديث القائمة"
          >
            <RefreshCw className="h-4 w-4" />
          </StudioButton>
        }
      />

      {error ? (
        <div className="mx-auto flex w-full max-w-[720px] flex-1 items-center justify-center p-6">
          <AppErrorState
            title="تعذّر تحميل قائمة المراجعة"
            description={error.message}
            onRetry={() => void overviewQuery.refetch()}
          />
        </div>
      ) : overviewQuery.isLoading ? (
        <div className="mx-auto w-full max-w-[760px] space-y-2 p-4 md:p-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-studio-border bg-studio-surface"
              aria-hidden
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mx-auto flex w-full max-w-[720px] flex-1 items-center justify-center p-6">
          <StudioSurfaceCard className="flex h-full min-h-[280px] w-full items-center justify-center p-6">
            <StudioEmptyState
              icon={<ClipboardCheck className="h-6 w-6 text-studio-fg-muted" />}
              title="لا توجد إجابات بانتظار المراجعة"
              description="عندما قدّم طلابك إجابات مقالية أو صور إجابات، ستظهر اختباراتهم هنا لتصحيحها يدويًا."
            />
          </StudioSurfaceCard>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[760px] flex-1 overflow-auto p-4 md:p-5">
          <p className="mb-3 px-1 text-xs font-medium text-studio-fg-muted">
            اختر الاختبار ثم اضغط على إجابة لبدء التصحيح
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.examId}
                type="button"
                onClick={() => router.push(`/teacher/exams/${item.examId}/grading`)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-studio-border bg-studio-surface p-4 text-start transition-colors hover:border-studio-accent-border hover:bg-studio-soft/60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-studio-soft text-studio-fg-muted">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-studio-fg">
                    {item.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-studio-fg-muted">
                    <ArrowDownUp className="h-3.5 w-3.5" />
                    {item.pendingCount} إجابة بانتظار المراجعة
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-studio-fg-muted transition-colors group-hover:text-studio-accent">
                  التصحيح
                  <ChevronEndIcon className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}