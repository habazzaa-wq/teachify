"use client";

import { cn } from "@/lib/cn";
import { Check, X as XIcon } from "lucide-react";
import { StudioChip } from "./StudioChip";

interface StudioFeatureChipProps {
  label: string;
  included?: boolean;
  className?: string;
}

export function StudioFeatureChip({
  label,
  included = true,
  className,
}: StudioFeatureChipProps) {
  return (
    <StudioChip
      variant={included ? "success" : "default"}
      size="sm"
      className={cn(className)}
      icon={
        included ? (
          <Check className="h-3 w-3" />
        ) : (
          <XIcon className="h-3 w-3" />
        )
      }
    >
      {label}
    </StudioChip>
  );
}
