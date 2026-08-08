import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TenantNotFoundPage() {
  const baseDomain = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? "academy.test";
  const platformUrl =
    process.env.NODE_ENV === "production"
      ? `https://${baseDomain}`
      : `http://${baseDomain}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="mb-2 text-4xl font-bold text-foreground">الأكاديمية غير موجودة</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        عذراً، لم نتمكن من العثور على الأكاديمية المطلوبة أو أنها غير نشطة حالياً.
      </p>
      <Link
        href={platformUrl}
        className="rounded-md bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
