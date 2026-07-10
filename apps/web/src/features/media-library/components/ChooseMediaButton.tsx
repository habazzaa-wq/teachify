"use client";

/**
 * ChooseMediaButton — Reusable extension point for integrating the Media Library
 * into other modules (Course Studio, Assignments, Certificates, Announcements, ...).
 *
 * This component is intentionally decoupled from any specific consumer. It opens the
 * shared MediaPicker dialog and returns the selected asset(s) via `onSelect`.
 *
 * Usage:
 *   <ChooseMediaButton
 *     mode="single"
 *     allowedTypes={["video", "image"]}
 *     onSelect={(result) => linkAsset(result.id)}
 *     label="اختيار وسائط"
 *   />
 */

import { useState, useCallback } from "react";
import { ImagePlus } from "lucide-react";
import { AppButton } from "@/components/ui";
import { MediaPicker } from "./MediaPicker";
import type { MediaPickerResult } from "./MediaPicker";
import type { MediaType } from "../types";

interface ChooseMediaButtonProps {
  mode?: "single" | "multi";
  allowedTypes?: MediaType[];
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  onSelect: (result: MediaPickerResult) => void;
}

function ChooseMediaButton({
  mode = "single",
  allowedTypes,
  label = "اختيار وسائط",
  variant = "outline",
  size = "sm",
  onSelect,
}: ChooseMediaButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (result: MediaPickerResult) => {
      onSelect(result);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    <>
      <AppButton
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
      >
        <ImagePlus className="h-4 w-4" />
        {label}
      </AppButton>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelect}
        mode={mode}
        allowedTypes={allowedTypes}
      />
    </>
  );
}

export { ChooseMediaButton };
export type { ChooseMediaButtonProps };
