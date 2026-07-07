"use client";

import { memo } from "react";
import {
  Eye,
  Pencil,
  Copy,
  Archive,
  Play,
  Pause,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
} from "@/components/ui";
import type { PremiumPlan } from "../types";

interface PlanRowActionsProps {
  plan: PremiumPlan;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}

const PlanRowActions = memo(function PlanRowActions({
  plan,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onActivate,
  onDeactivate,
  onDelete,
}: PlanRowActionsProps) {
  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="خيارات الباقة"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="w-48">
        <AppDropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4" />
          عرض
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          تعديل
        </AppDropdownMenuItem>
        <AppDropdownMenuItem onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
          نسخ
        </AppDropdownMenuItem>
        <AppDropdownMenuSeparator />
        {plan.status !== "archived" && (
          <AppDropdownMenuItem onClick={onArchive}>
            <Archive className="h-4 w-4" />
            أرشفة
          </AppDropdownMenuItem>
        )}
        {plan.status !== "active" && plan.status !== "archived" && (
          <AppDropdownMenuItem onClick={onActivate}>
            <Play className="h-4 w-4" />
            تفعيل
          </AppDropdownMenuItem>
        )}
        {plan.status === "active" && (
          <AppDropdownMenuItem onClick={onDeactivate}>
            <Pause className="h-4 w-4" />
            إيقاف
          </AppDropdownMenuItem>
        )}
        {plan.status === "archived" && (
          <AppDropdownMenuItem onClick={onActivate}>
            <Play className="h-4 w-4" />
            إعادة تفعيل
          </AppDropdownMenuItem>
        )}
        <AppDropdownMenuSeparator />
        <AppDropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </AppDropdownMenuItem>
      </AppDropdownMenuContent>
    </AppDropdownMenu>
  );
});

export { PlanRowActions };
