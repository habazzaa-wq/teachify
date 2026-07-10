"use client";

import { cn } from "@/lib/cn";
import { StudioChip, type ChipVariant } from "./StudioChip";

export type StatusType = "active" | "inactive" | "pending" | "suspended" | "archived";

const statusConfig: Record<StatusType, { label: string; variant: ChipVariant }> = {
  active: { label: "نشط", variant: "success" },
  inactive: { label: "غير نشط", variant: "default" },
  pending: { label: "قيد الانتظار", variant: "warning" },
  suspended: { label: "موقوف", variant: "danger" },
  archived: { label: "مؤرشف", variant: "default" },
};

interface StudioStatusChipProps {
  status: StatusType;
  className?: string;
}

export function StudioStatusChip({ status, className }: StudioStatusChipProps) {
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <StudioChip variant={config.variant} size="sm" className={cn("gap-1.5", className)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          config.variant === "success" && "bg-studio-success",
          config.variant === "warning" && "bg-studio-warning",
          config.variant === "danger" && "bg-studio-danger",
          config.variant === "default" && "bg-studio-fg-muted",
        )}
      />
      {config.label}
    </StudioChip>
  );
}
