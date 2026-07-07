"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { AppButton } from "@/components/ui";

interface MediaErrorStateProps {
  onRetry?: () => void;
}

function MediaErrorState({ onRetry }: MediaErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">حدث خطأ</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        تعذر تحميل ملفات الوسائط. يرجى المحاولة مرة أخرى.
      </p>
      {onRetry && (
        <AppButton variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </AppButton>
      )}
    </div>
  );
}

export { MediaErrorState };
