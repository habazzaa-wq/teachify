"use client";

import { Search, RefreshCw, ArrowUpDown } from "lucide-react";
import { AppButton, AppInput, AppSelect, AppSelectTrigger, AppSelectValue, AppSelectContent, AppSelectItem } from "@/components/ui";
import { STATUS_OPTIONS, SORT_OPTIONS } from "../constants";
import type { TenantStatus } from "../types";

interface TenantsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: TenantStatus | "all";
  onStatusChange: (value: TenantStatus | "all") => void;
  sort: string;
  onSortChange: (value: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

function TenantsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sort,
  onSortChange,
  onRefresh,
  refreshing,
}: TenantsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="بحث عن مؤسسة..."
          className="ps-9 h-9"
        />
      </div>

      <AppSelect
        value={statusFilter}
        onValueChange={(val) => onStatusChange(val as TenantStatus | "all")}
      >
        <AppSelectTrigger className="h-9 w-[140px]">
          <AppSelectValue placeholder="الحالة" />
        </AppSelectTrigger>
        <AppSelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect value={sort} onValueChange={onSortChange}>
        <AppSelectTrigger className="h-9 w-[150px]">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <AppSelectValue placeholder="ترتيب" />
        </AppSelectTrigger>
        <AppSelectContent>
          {SORT_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppButton variant="outline" size="sm" className="h-9 gap-2" onClick={onRefresh} loading={refreshing}>
        <RefreshCw className="h-4 w-4" />
        تحديث
      </AppButton>
    </div>
  );
}

export { TenantsToolbar };
