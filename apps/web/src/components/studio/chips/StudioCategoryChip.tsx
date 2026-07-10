"use client";

import { cn } from "@/lib/cn";
import { StudioChip } from "./StudioChip";

interface StudioCategoryChipProps {
  label: string;
  color?: string;
  className?: string;
}

export function StudioCategoryChip({ label, color, className }: StudioCategoryChipProps) {
  return (
    <StudioChip variant="default" size="sm" className={className}>
      {color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </StudioChip>
  );
}
