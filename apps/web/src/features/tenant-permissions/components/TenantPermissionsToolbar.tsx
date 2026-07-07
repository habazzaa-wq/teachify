"use client";

import { Search, RefreshCw, ArrowUpDown } from "lucide-react";
import { AppButton, AppInput, AppSelect, AppSelectTrigger, AppSelectValue, AppSelectContent, AppSelectItem } from "@/components/ui";
import { MODULE_OPTIONS, RISK_LEVEL_OPTIONS, SYSTEM_OPTIONS, DATE_OPTIONS, SORT_OPTIONS } from "../constants";
import type { PermissionModule, RiskLevel } from "../types";

interface TenantPermissionsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  moduleFilter: PermissionModule | "all";
  onModuleChange: (value: PermissionModule | "all") => void;
  riskFilter: RiskLevel | "all";
  onRiskChange: (value: RiskLevel | "all") => void;
  systemFilter: string;
  onSystemChange: (value: string) => void;
  dateCreatedFilter: string;
  onDateCreatedChange: (value: string) => void;
  dateUpdatedFilter: string;
  onDateUpdatedChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

function TenantPermissionsToolbar({
  search,
  onSearchChange,
  moduleFilter,
  onModuleChange,
  riskFilter,
  onRiskChange,
  systemFilter,
  onSystemChange,
  dateCreatedFilter,
  onDateCreatedChange,
  dateUpdatedFilter,
  onDateUpdatedChange,
  sort,
  onSortChange,
  onRefresh,
  refreshing,
}: TenantPermissionsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="بحث بالمفتاح أو الاسم أو الوصف..."
          className="ps-9 h-9"
        />
      </div>

      <AppSelect
        value={moduleFilter}
        onValueChange={(val) => onModuleChange(val as PermissionModule | "all")}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="الوحدة" />
        </AppSelectTrigger>
        <AppSelectContent>
          {MODULE_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={riskFilter}
        onValueChange={(val) => onRiskChange(val as RiskLevel | "all")}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="المخاطرة" />
        </AppSelectTrigger>
        <AppSelectContent>
          {RISK_LEVEL_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={systemFilter}
        onValueChange={onSystemChange}
      >
        <AppSelectTrigger className="h-9 w-[135px]">
          <AppSelectValue placeholder="النظام" />
        </AppSelectTrigger>
        <AppSelectContent>
          {SYSTEM_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={dateCreatedFilter}
        onValueChange={onDateCreatedChange}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="تاريخ الإنشاء" />
        </AppSelectTrigger>
        <AppSelectContent>
          {DATE_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={dateUpdatedFilter}
        onValueChange={onDateUpdatedChange}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="تاريخ التحديث" />
        </AppSelectTrigger>
        <AppSelectContent>
          {DATE_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect value={sort} onValueChange={onSortChange}>
        <AppSelectTrigger className="h-9 w-[130px]">
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

      <AppButton variant="outline" size="sm" className="h-9" onClick={onRefresh} loading={refreshing}>
        <RefreshCw className="h-4 w-4" />
        تحديث
      </AppButton>
    </div>
  );
}

export { TenantPermissionsToolbar };
