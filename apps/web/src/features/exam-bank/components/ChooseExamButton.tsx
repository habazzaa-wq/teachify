"use client";

import { useState, useCallback } from "react";
import { ClipboardList } from "lucide-react";
import { StudioButton } from "@/components/studio";
import { ExamPicker } from "./ExamPicker";
import type { ExamPickerResult } from "./ExamPicker";
import type { ExamStatus } from "@/features/exam-bank/types";

interface ChooseExamButtonProps {
  mode?: "single" | "multi";
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "soft" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  allowedStatuses?: ExamStatus[];
  onSelect: (result: ExamPickerResult) => void;
}

function ChooseExamButton({
  mode = "single",
  label = "اختيار اختبار",
  variant = "secondary",
  size = "sm",
  allowedStatuses,
  onSelect,
}: ChooseExamButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (result: ExamPickerResult) => {
      onSelect(result);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    <>
      <StudioButton
        type="button"
        variant={variant}
        size={size}
        icon={<ClipboardList className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        {label}
      </StudioButton>
      <ExamPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelect}
        mode={mode}
        allowedStatuses={allowedStatuses}
      />
    </>
  );
}

export { ChooseExamButton };
export type { ChooseExamButtonProps };
