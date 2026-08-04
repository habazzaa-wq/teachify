"use client";

import Link from "next/link";
import { AppButton } from "@/components/ui/AppButton";
import { getPlatformDomain } from "@/lib/domain";

export function TenantNotFound() {
  const platformDomain = getPlatformDomain();

  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center"
    >
      <svg
        width="160"
        height="120"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground"
        aria-hidden="true"
      >
        <rect
          x="20"
          y="20"
          width="120"
          height="80"
          rx="8"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <rect
          x="40"
          y="40"
          width="80"
          height="8"
          rx="4"
          fill="currentColor"
          opacity="0.3"
        />
        <rect
          x="40"
          y="56"
          width="60"
          height="6"
          rx="3"
          fill="currentColor"
          opacity="0.2"
        />
        <rect
          x="40"
          y="68"
          width="40"
          height="6"
          rx="3"
          fill="currentColor"
          opacity="0.15"
        />
        <path
          d="M60 92 L80 76 L100 92"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="3"
          fill="currentColor"
          opacity="0.5"
        />
        <line
          x1="30"
          y1="10"
          x2="130"
          y2="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="30"
          y1="10"
          x2="35"
          y2="18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="120"
          y1="10"
          x2="125"
          y2="18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">
          البيئة التعليمية غير موجودة
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          لم نتمكن من العثور على البيئة التعليمية المطلوبة. قد يكون الرابط غير
          صحيح أو تم إلغاء الاشتراك.
        </p>
      </div>

      <AppButton asChild variant="outline">
        <Link href={`https://${platformDomain}`}>
          العودة إلى المنصة
        </Link>
      </AppButton>
    </div>
  );
}
