import Link from "next/link";

export default function TenantNotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="mb-2 text-4xl font-bold text-foreground">الأكاديمية غير موجودة</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        عذراً، لم نتمكن من العثور على الأكاديمية المطلوبة أو أنها غير نشطة حالياً.
      </p>
      <Link
        href="https://academy.test"
        className="rounded-md bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
