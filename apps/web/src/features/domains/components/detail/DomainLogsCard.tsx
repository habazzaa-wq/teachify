"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppBadge,
  AppPagination,
  AppEmptyState,
  AppSearchInput,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { auditService } from "@/services/api/audit.service";
import { auditKeys } from "@/services/queryKeys";
import type { PlatformDomain } from "../../types";

interface DomainLogsCardProps {
  domain: PlatformDomain;
}

const LEVEL_CONFIG = {
  info: { label: "معلومات", variant: "secondary" as const },
  warning: { label: "تحذير", variant: "warning" as const },
  error: { label: "خطأ", variant: "destructive" as const },
  debug: { label: "تصحيح", variant: "outline" as const },
};

function DomainLogsCard({ domain }: DomainLogsCardProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const auditQuery = useQuery({
    queryKey: auditKeys.list({ entity_type: "TenantDomain", entity_id: domain.id, page }),
    queryFn: () => auditService.list({ entity_type: "TenantDomain", entity_id: domain.id, page }),
  });

  const auditData = auditQuery.data;
  const logs = auditData?.data ?? [];
  const isLoading = auditQuery.isLoading;

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== "all" && log.event_type !== levelFilter) return false;
    if (search && !log.action.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="text-sm">السجلات</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-border/50 py-3 last:border-0">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </AppCardContent>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <AppCardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <AppCardTitle className="text-sm">السجلات</AppCardTitle>
          <div className="flex items-center gap-2">
            <AppSearchInput
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="بحث في السجلات..."
              className="h-8 w-48"
            />
            <select
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
              className="h-8 rounded-lg border bg-background px-2 text-xs"
              aria-label="فلتر المستوى"
            >
              <option value="all">جميع المستويات</option>
              <option value="created">إنشاء</option>
              <option value="updated">تحديث</option>
              <option value="deleted">حذف</option>
            </select>
          </div>
        </div>
      </AppCardHeader>
      <AppCardContent>
        {filteredLogs.length === 0 ? (
          <AppEmptyState
            title="لا توجد سجلات"
            description="لم يتم تسجيل أي أحداث لهذا النطاق بعد."
            icon={FileText}
            variant="compact"
          />
        ) : (
          <>
            <div className="rounded-xl border overflow-hidden">
              <AppTable>
                <AppTableHeader>
                  <AppTableRow>
                    <AppTableHead className="w-36">الوقت</AppTableHead>
                    <AppTableHead className="w-24">المصدر</AppTableHead>
                    <AppTableHead className="w-20">المستوى</AppTableHead>
                    <AppTableHead>الرسالة</AppTableHead>
                  </AppTableRow>
                </AppTableHeader>
                <AppTableBody>
                  {filteredLogs.map((log) => {
                    const levelConfig = LEVEL_CONFIG[log.event_type as keyof typeof LEVEL_CONFIG] ?? LEVEL_CONFIG.info;
                    return (
                      <AppTableRow key={log.id}>
                        <AppTableCell>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatDateTime(log.created_at)}
                          </span>
                        </AppTableCell>
                        <AppTableCell>
                          <span className="text-xs text-muted-foreground">
                            {log.user_id ? "المشرف" : "النظام"}
                          </span>
                        </AppTableCell>
                        <AppTableCell>
                          <AppBadge variant={levelConfig.variant} className="text-[10px]">
                            {levelConfig.label}
                          </AppBadge>
                        </AppTableCell>
                        <AppTableCell>
                          <span className="text-sm">{log.action}</span>
                        </AppTableCell>
                      </AppTableRow>
                    );
                  })}
                </AppTableBody>
              </AppTable>
            </div>

            {auditData && auditData.last_page > 1 && (
              <div className="mt-4 flex justify-center">
                <AppPagination
                  currentPage={page}
                  lastPage={auditData.last_page}
                  total={auditData.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </AppCardContent>
    </AppCard>
  );
}

export { DomainLogsCard };
