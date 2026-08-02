"use client";

import { memo } from "react";
import { Award, Sparkles } from "lucide-react";

interface CertificateBannerProps {
  certificateEligible: boolean;
}

function CertificateBannerInner({ certificateEligible }: CertificateBannerProps) {
  if (!certificateEligible) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-background to-primary/5 p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
          <Award className="h-5 w-5" />
        </span>
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
            مبروك! أنت مؤهل للحصول على شهادة إتمام الدورة
            <Sparkles className="h-4 w-4 text-amber-500" />
          </h2>
          <p className="mt-1 max-w-lg text-xs font-semibold leading-relaxed text-muted-foreground">
            اجتزت الاختبار بنجاح، وستتمكن من استلام شهادتك من صفحة الدورة بعد اكتمال متطلباتها.
          </p>
        </div>
      </div>
    </div>
  );
}

const CertificateBanner = memo(CertificateBannerInner);

export { CertificateBanner };
