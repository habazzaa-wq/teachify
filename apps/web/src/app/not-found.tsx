import Link from "next/link";
import { AppButton } from "@/components/ui/AppButton";
import { routes } from "@/constants/routes";

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <p className="text-5xl font-bold text-muted-foreground">٤٠٤</p>
      <h1 className="text-xl font-semibold">الصفحة غير موجودة</h1>
      <p className="text-sm text-muted-foreground">
        الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
      </p>
      <AppButton asChild>
        <Link href={routes.dashboard}>العودة للرئيسية</Link>
      </AppButton>
    </div>
  );
}
