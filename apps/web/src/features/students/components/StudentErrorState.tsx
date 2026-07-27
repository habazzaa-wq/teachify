"use client";

import { AlertTriangle } from "lucide-react";
import { AppButton } from "@/components/ui";

interface StudentErrorStateProps {
  onRetry: () => void;
}

function StudentErrorState({ onRetry }: StudentErrorStateProps) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">حدث خطأ</h3>
      <p className="text-sm text-muted-foreground mb-4">
        فشل في تحميل بيانات الطلاب. حاول مرة أخرى.
      </p>
      <AppButton variant="outline" size="sm" onClick={onRetry}>
        إعادة المحاولة
      </AppButton>
    </div>
  );
}

export { StudentErrorState };
