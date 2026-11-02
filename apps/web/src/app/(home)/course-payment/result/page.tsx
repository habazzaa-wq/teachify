"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { publicCourseService } from "@/features/public-course/services";

function CoursePaymentResult() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const result = useQuery({
    queryKey: ["direct-course-payment", reference],
    queryFn: () => publicCourseService.getDirectPaymentStatus(reference!),
    enabled: Boolean(reference),
    refetchInterval: 3000,
    retry: 2,
  });

  const payment = result.data;
  const isPaid = payment?.status === "paid";
  const isFailed = payment?.status === "failed" || payment?.status === "expired";

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center px-4 py-12">
      <section className="w-full rounded-3xl border border-border/60 bg-card p-8 text-center shadow-xl">
        {!reference ? (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-4 text-xl font-bold">تعذر التحقق من عملية الدفع</h1>
            <p className="mt-2 text-sm text-muted-foreground">رابط النتيجة لا يحتوي على رقم العملية.</p>
            <Link href="/courses" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
              تصفح الدورات
            </Link>
          </>
        ) : result.isPending || (payment?.status === "pending") ? (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-bold">جارٍ تأكيد الدفع</h1>
            <p className="mt-2 text-sm text-muted-foreground">قد يستغرق تأكيد العملية لحظات، لا تغلق الصفحة.</p>
          </>
        ) : result.isError ? (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-4 text-xl font-bold">تعذر التحقق من الدفع</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {result.error instanceof Error ? result.error.message : "حاول تحديث الصفحة بعد قليل."}
            </p>
            <button type="button" onClick={() => void result.refetch()} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
              إعادة المحاولة
            </button>
          </>
        ) : isPaid ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-4 text-xl font-bold">تم الدفع والاشتراك بنجاح</h1>
            <p className="mt-2 text-sm text-muted-foreground">أصبح محتوى الدورة متاحاً في حسابك.</p>
            {payment.courseSlug && (
              <Link href={`/courses/${encodeURIComponent(payment.courseSlug)}`} className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
                ابدأ التعلم
              </Link>
            )}
          </>
        ) : isFailed ? (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-xl font-bold">لم تكتمل عملية الدفع</h1>
            <p className="mt-2 text-sm text-muted-foreground">{payment?.failureReason ?? "يمكنك العودة للدورة والمحاولة مرة أخرى."}</p>
            {payment?.courseSlug && (
              <Link href={`/courses/${encodeURIComponent(payment.courseSlug)}`} className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
                العودة إلى الدورة
              </Link>
            )}
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-bold">بانتظار تأكيد بوابة الدفع</h1>
            <p className="mt-2 text-sm text-muted-foreground">سيتم تحديث حالة العملية تلقائياً.</p>
          </>
        )}
      </section>
    </main>
  );
}

export default function CoursePaymentResultPage() {
  return (
    <Suspense fallback={<main className="min-h-[65vh]" />}>
      <CoursePaymentResult />
    </Suspense>
  );
}
