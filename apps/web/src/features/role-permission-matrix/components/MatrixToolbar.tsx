"use client";

import { Search, RefreshCw, Save, RotateCcw, Copy, Download, Printer, GitBranch } from "lucide-react";
import {
  AppButton,
  AppInput,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppTooltip,
  AppTooltipContent,
  AppTooltipTrigger,
} from "@/components/ui";
import { MODULE_OPTIONS, RISK_LEVEL_OPTIONS } from "../constants";
import type { PermissionModule, RiskLevel } from "../types";

interface MatrixToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  moduleFilter: PermissionModule | "all";
  onModuleChange: (value: PermissionModule | "all") => void;
  riskFilter: RiskLevel | "all";
  onRiskChange: (value: RiskLevel | "all") => void;
  onRefresh: () => void;
  refreshing?: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onClone: () => void;
  onCopy: () => void;
  onExport: () => void;
  onPrint: () => void;
  saving?: boolean;
}

function MatrixToolbar({
  search,
  onSearchChange,
  moduleFilter,
  onModuleChange,
  riskFilter,
  onRiskChange,
  onRefresh,
  refreshing,
  hasChanges,
  onSave,
  onDiscard,
  onClone,
  onCopy,
  onExport,
  onPrint,
  saving,
}: MatrixToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="بحث عن صلاحية..."
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

      <div className="flex items-center gap-1 border-s ps-3 border-border">
        <AppTooltip>
          <AppTooltipTrigger asChild>
            <AppButton variant="outline" size="sm" className="h-9" onClick={onRefresh} loading={refreshing}>
              <RefreshCw className="h-4 w-4" />
            </AppButton>
          </AppTooltipTrigger>
          <AppTooltipContent>تحديث</AppTooltipContent>
        </AppTooltip>

        <AppTooltip>
          <AppTooltipTrigger asChild>
            <AppButton
              variant="default"
              size="sm"
              className="h-9"
              onClick={onSave}
              disabled={!hasChanges}
              loading={saving}
            >
              <Save className="h-4 w-4" />
              حفظ التغييرات
            </AppButton>
          </AppTooltipTrigger>
          <AppTooltipContent>حفظ التغييرات</AppTooltipContent>
        </AppTooltip>

        <AppTooltip>
          <AppTooltipTrigger asChild>
            <AppButton
              variant="outline"
              size="sm"
              className="h-9"
              onClick={onDiscard}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4" />
              تجاهل
            </AppButton>
          </AppTooltipTrigger>
          <AppTooltipContent>تجاهل التغييرات</AppTooltipContent>
        </AppTooltip>

        <AppTooltip>
          <AppTooltipTrigger asChild>
            <AppButton variant="outline" size="sm" className="h-9" onClick={onClone}>
              <GitBranch className="h-4 w-4" />
              استنساخ
            </AppButton>
          </AppTooltipTrigger>
          <AppTooltipContent>استنساخ من دور</AppTooltipContent>
        </AppTooltip>

        <AppTooltip>
          <AppTooltipTrigger asChild>
            <AppButton variant="outline" size="sm" className="h-9" onClick={onCopy}>
              <Copy className="h-4 w-4" />
              نسخ
            </AppButton>
          </AppTooltipTrigger>
          <AppTooltipContent>نسخ الصلاحيات</AppTooltipContent>
        </AppTooltip>

        <AppTooltip>
          <AppTooltipTrigger asChild>
            <AppButton variant="outline" size="sm" className="h-9" onClick={onExport}>
              <Download className="h-4 w-4" />
              تصدير
            </AppButton>
          </AppTooltipTrigger>
          <AppTooltipContent>تصدير CSV</AppTooltipContent>
        </AppTooltip>

        <AppTooltip>
          <AppTooltipTrigger asChild>
            <AppButton variant="outline" size="sm" className="h-9" onClick={onPrint}>
              <Printer className="h-4 w-4" />
            </AppButton>
          </AppTooltipTrigger>
          <AppTooltipContent>طباعة</AppTooltipContent>
        </AppTooltip>
      </div>
    </div>
  );
}

export { MatrixToolbar };
