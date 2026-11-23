"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  Award, BadgeCheck, CalendarDays, CheckCircle2, Home, Loader2, ShieldCheck, XCircle,
  type LucideIcon,
} from "lucide-react";
import { resolveApiBaseUrl } from "@/config/env";
import { useTenantStore } from "@/stores/tenant.store";
import type { ActiveTenant } from "@/types/tenant.types";
import { CertificatePreview } from "@/features/certificates/components/CertificatePreview";
import type { CertificateSnapshot, IssuedCertificate } from "@/features/certificates/types";

interface VerificationResult {
  valid: boolean;
  issued_at?: string | null;
  course_title?: string | null;
  learner_display_name?: string | null;
  instructor_name?: string | null;
  certificate_number?: string | null;
  reference_number?: string | null;
  certificate_status?: string | null;
  snapshot?: CertificateSnapshot | null;
}

export default function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>();
  const tenant = useTenantStore((state) => state.activeTenant);

  return (
    <VerifyCertificateContent
      key={`${code}:${tenant?.id ?? "none"}`}
      code={code}
      tenant={tenant}
    />
  );
}

function VerifyCertificateContent({ code, tenant }: { code: string; tenant: ActiveTenant | null }) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (tenant?.id) headers["X-Tenant-ID"] = String(tenant.id);

    axios
      .get<VerificationResult>(
        `${resolveApiBaseUrl()}/certificates/verify/${encodeURIComponent(code)}`,
        { headers },
      )
      .then(({ data }) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setError("تعذّر التحقق من الشهادة حالياً. تحقق من الرمز وحاول مرة أخرى.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, tenant?.id]);

  const certificate = useMemo<IssuedCertificate | null>(() => {
    if (!result?.valid) return null;
    const snapshot = result.snapshot ?? {};
    const issuedAt = result.issued_at ?? snapshot.issued_at ?? new Date().toISOString();
    const learnerName = result.learner_display_name ?? snapshot.student_name ?? "صاحب الشهادة";
    const courseTitle = result.course_title ?? snapshot.course_title ?? "دورة تدريبية";

    return {
      id: 0,
      tenant_id: 0,
      course_id: 0,
      course_completion_id: 0,
      tenant_user_id: 0,
      certificate_template_id: null,
      certificate_number: result.certificate_number ?? snapshot.certificate_number ?? "",
      reference_number: result.reference_number ?? snapshot.reference_number ?? null,
      issued_at: issuedAt,
      status: result.certificate_status === "revoked" ? "revoked" : "issued",
      snapshot_data: {
        ...snapshot,
        course_title: courseTitle,
        student_name: learnerName,
        instructor_name: result.instructor_name ?? snapshot.instructor_name ?? "",
        certificate_number: result.certificate_number ?? snapshot.certificate_number ?? "",
        reference_number: result.reference_number ?? snapshot.reference_number ?? "",
        issued_at: issuedAt,
        verification_code: code,
      },
      course: { id: 0, title: courseTitle },
      student: { id: 0, user: { id: 0, name: learnerName, email: "" } },
      verification: { id: 0, verification_code: code, verified_at: null },
    };
  }, [result, code]);

  const platformName = tenant?.name ?? "المنصة التعليمية";
  const platformLogo = tenant?.branding?.logo ?? tenant?.branding?.logo_image ?? null;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              <Home className="h-4 w-4" /> الصفحة الرئيسية
            </Link>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black">
              <ShieldCheck className="h-7 w-7 text-primary" /> التحقق من الشهادة
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">تحقق من صحة شهادة الإتمام عبر رمز التحقق أو الرقم المرجعي.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحقق من الشهادة...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-bold text-red-700">{error}</div>
        ) : !result?.valid ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center space-y-3">
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h2 className="text-xl font-black text-red-700">الشهادة غير صالحة أو غير موجودة</h2>
            <p className="text-sm text-red-700/80">تأكد من رمز التحقق الذي مسحته أو الرابط الذي فتحته.</p>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-green-200 bg-green-50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-lg font-black text-green-800">هذه شهادة صحيحة وصادرة عن المنصة</h2>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <VerificationField icon={Award} label="الدورة" value={result.course_title ?? result.snapshot?.course_title ?? "-"} />
                    <VerificationField icon={BadgeCheck} label="صاحب الشهادة" value={result.learner_display_name ?? result.snapshot?.student_name ?? "-"} />
                    <VerificationField icon={CalendarDays} label="تاريخ الإصدار" value={result.issued_at ? new Date(result.issued_at).toLocaleDateString("ar-EG") : "-"} />
                    <VerificationField
                      icon={ShieldCheck}
                      label="الرقم المرجعي"
                      value={result.reference_number ?? result.snapshot?.reference_number ?? result.certificate_number ?? "-"}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </section>

            {certificate && (
              <section className="rounded-2xl border bg-card p-3 sm:p-5">
                <h2 className="mb-3 text-lg font-black">صورة الشهادة المعتمدة</h2>
                <CertificatePreview certificate={certificate} platformName={platformName} platformLogoUrl={platformLogo} />
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function VerificationField({
  icon: Icon,
  label,
  value,
  dir,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-white/70 p-3">
      <div className="flex items-center gap-2 text-xs font-bold text-green-700">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-1 font-bold text-foreground" dir={dir}>{value}</div>
    </div>
  );
}
