"use client";

import { memo, useCallback } from "react";
import {
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppBadge,
  AppCheckbox,
} from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PLAN_BADGE_CONFIG, PLAN_STATUS_CONFIG } from "../constants";
import { PlanRowActions } from "./PlanRowActions";
import type { PremiumPlan } from "../types";

interface PlansTableProps {
  plans: PremiumPlan[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (plan: PremiumPlan) => void;
  onEdit: (plan: PremiumPlan) => void;
  onDuplicate: (plan: PremiumPlan) => void;
  onArchive: (plan: PremiumPlan) => void;
  onActivate: (plan: PremiumPlan) => void;
  onDeactivate: (plan: PremiumPlan) => void;
  onDelete: (plan: PremiumPlan) => void;
}

const PlansTableRow = memo(function PlansTableRow({
  plan,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  plan: PremiumPlan;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (plan: PremiumPlan) => void;
  onEdit: (plan: PremiumPlan) => void;
  onDuplicate: (plan: PremiumPlan) => void;
  onArchive: (plan: PremiumPlan) => void;
  onActivate: (plan: PremiumPlan) => void;
  onDeactivate: (plan: PremiumPlan) => void;
  onDelete: (plan: PremiumPlan) => void;
}) {
  const badgeConfig = plan.badge ? PLAN_BADGE_CONFIG[plan.badge] : null;
  const statusConfig = PLAN_STATUS_CONFIG[plan.status];
  const isChecked = selectedIds?.includes(plan.id) ?? false;

  const handleCheck = useCallback(() => {
    if (!onSelectionChange) return;
    const next = isChecked
      ? selectedIds!.filter((id) => id !== plan.id)
      : [...(selectedIds ?? []), plan.id];
    onSelectionChange(next);
  }, [plan.id, isChecked, selectedIds, onSelectionChange]);

  return (
    <AppTableRow className="group cursor-pointer" onClick={() => onEdit(plan)}>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <AppCheckbox checked={isChecked} onCheckedChange={handleCheck} />
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg border"
            style={{ backgroundColor: plan.branding.color }}
          />
        </div>
      </AppTableCell>
      <AppTableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{plan.name}</span>
        </div>
      </AppTableCell>
      <AppTableCell>
        {badgeConfig && (
          <AppBadge variant={badgeConfig.variant} className="text-[10px]">
            {badgeConfig.label}
          </AppBadge>
        )}
      </AppTableCell>
      <AppTableCell className="tabular-nums">${formatNumber(plan.monthlyPrice)}</AppTableCell>
      <AppTableCell className="tabular-nums">${formatNumber(plan.yearlyPrice)}</AppTableCell>
      <AppTableCell className="tabular-nums">
        {plan.limits.storage !== null ? `${formatNumber(plan.limits.storage)} GB` : "غير محدود"}
      </AppTableCell>
      <AppTableCell className="tabular-nums">
        {plan.limits.bandwidth !== null ? `${formatNumber(plan.limits.bandwidth)} GB` : "غير محدود"}
      </AppTableCell>
      <AppTableCell className="tabular-nums">
        {plan.limits.videos !== null ? formatNumber(plan.limits.videos) : "∞"}
      </AppTableCell>
      <AppTableCell className="tabular-nums">
        {plan.limits.courses !== null ? formatNumber(plan.limits.courses) : "∞"}
      </AppTableCell>
      <AppTableCell>
        <AppBadge variant={plan.status === "active" ? "success" : plan.status === "draft" ? "secondary" : plan.status === "hidden" ? "warning" : "outline"} className="gap-1">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            plan.status === "active" && "bg-success",
            plan.status === "draft" && "bg-muted-foreground",
            plan.status === "hidden" && "bg-warning",
            plan.status === "archived" && "bg-muted-foreground/50",
          )} />
          {statusConfig.label}
        </AppBadge>
      </AppTableCell>
      <AppTableCell className="text-xs text-muted-foreground tabular-nums">
        {formatDate(plan.createdAt)}
      </AppTableCell>
      <AppTableCell onClick={(e) => e.stopPropagation()}>
        <PlanRowActions
          plan={plan}
          onView={() => onView(plan)}
          onEdit={() => onEdit(plan)}
          onDuplicate={() => onDuplicate(plan)}
          onArchive={() => onArchive(plan)}
          onActivate={() => onActivate(plan)}
          onDeactivate={() => onDeactivate(plan)}
          onDelete={() => onDelete(plan)}
        />
      </AppTableCell>
    </AppTableRow>
  );
});

function PlansTable(props: PlansTableProps) {
  const { plans, selectedIds, onSelectionChange, ...actions } = props;
  const allSelected = plans.length > 0 && selectedIds?.length === plans.length;

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(plans.map((p) => p.id));
    }
  }, [plans, allSelected, onSelectionChange]);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <AppTable>
        <AppTableHeader>
          <AppTableRow>
            <AppTableHead className="w-10">
              <AppCheckbox
                checked={allSelected}
                onCheckedChange={toggleAll}
              />
            </AppTableHead>
            <AppTableHead className="w-12">اللون</AppTableHead>
            <AppTableHead>اسم الباقة</AppTableHead>
            <AppTableHead>الشارة</AppTableHead>
            <AppTableHead>شهري</AppTableHead>
            <AppTableHead>سنوي</AppTableHead>
            <AppTableHead>التخزين</AppTableHead>
            <AppTableHead>النطاق</AppTableHead>
            <AppTableHead>الفيديوهات</AppTableHead>
            <AppTableHead>الدورات</AppTableHead>
            <AppTableHead>الحالة</AppTableHead>
            <AppTableHead>تاريخ الإنشاء</AppTableHead>
            <AppTableHead className="w-10" />
          </AppTableRow>
        </AppTableHeader>
        <AppTableBody>
          {plans.map((plan) => (
            <PlansTableRow key={plan.id} plan={plan} selectedIds={selectedIds} onSelectionChange={onSelectionChange} {...actions} />
          ))}
        </AppTableBody>
      </AppTable>
    </div>
  );
}

export { PlansTable };
