"use client";

import { ShieldAlert, RefreshCw } from "lucide-react";
import { useCommunityStore } from "../../stores/community.store";

/** Full-block overlay shown while the member is taking an exam. */
export function ExamBlockedScreen() {
  const examBlocked = useCommunityStore((s) => s.examBlocked);

  if (!examBlocked) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-xl font-black text-foreground">
          لا يمكنك دخول المنتدى أثناء أداء الامتحان
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          المنتدى مقفل حتى تنتهي جلسة الامتحان الحالية، لضمان نزاهة أداء
          الامتحانات. عد بعد انتهائك من الامتحان للانضمام إلى النقاشات.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
