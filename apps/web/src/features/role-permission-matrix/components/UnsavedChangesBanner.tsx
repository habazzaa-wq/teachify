"use client";

import { AlertTriangle } from "lucide-react";
import { AppButton } from "@/components/ui";

interface UnsavedChangesBannerProps {
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
}

function UnsavedChangesBanner({ onSave, onDiscard, saving }: UnsavedChangesBannerProps) {
  return (
    <div className="sticky top-0 z-50 -mx-4 mb-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
        <p className="flex-1 text-sm font-medium">
          لديك تغييرات غير محفوظة. يرجى حفظ التغييرات أو تجاهلها.
        </p>
        <div className="flex items-center gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            disabled={saving}
          >
            تجاهل
          </AppButton>
          <AppButton
            size="sm"
            onClick={onSave}
            loading={saving}
          >
            حفظ التغييرات
          </AppButton>
        </div>
      </div>
    </div>
  );
}

export { UnsavedChangesBanner };
