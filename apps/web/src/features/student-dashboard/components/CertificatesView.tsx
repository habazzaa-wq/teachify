"use client";

import { useState } from "react";
import { Award, Printer, CheckCircle2, Clock3, XCircle, BadgeCheck } from "lucide-react";
import type { ContinueLearningItem } from "../types";
import { useMyCertificates, useMyCertificateApplications, useApplyForCertificate, useEnrollmentCertificateEligibility } from "@/features/certificates/hooks";
import type { IssuedCertificate } from "@/features/certificates/types";
import { CertificateViewDialog } from "@/features/certificates/components/CertificateViewDialog";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useBrandTheme } from "./StudentCard";
import { BRAND_PRIMARY, BRAND_SECONDARY } from "../constants";
import { formatNumber } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";

export function CertificatesView({ courses }: { courses: ContinueLearningItem[] }) {
  const t = useBrandTheme();
  const { tenant } = useActiveTenant();
  const platformName = (tenant as any)?.name ?? (tenant as any)?.profile?.name ?? "المنصة";
  const platformLogo = (tenant as any)?.branding?.logo_url ?? (tenant as any)?.branding?.logo ?? null;
  const { data: certificates = [], isLoading } = useMyCertificates();
  const { data: applications = [] } = useMyCertificateApplications();
  const [selected, setSelected] = useState<IssuedCertificate | null>(null);

  return (
    <div className="space-y-8">
      <SectionHeader index={7} eyebrow="اعتمادك" title="الشهادات" subtitle="قدّم على شهادتك عندما تستوفي الشروط، واطبعها بعد اعتمادها." />

      <div className="space-y-4">
        <h3 className="text-lg font-black" style={{ color: t.ink }}>شهاداتي الصادرة</h3>
        {isLoading ? <div className="text-sm" style={{ color: t.muted }}>جارٍ التحميل...</div> : certificates.length === 0 ? (
          <div className="rounded-[1.5rem] border" style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg }}><EmptyState icon={Award} title="لا توجد شهادات صادرة بعد" description="عند اعتماد طلب الشهادة ستظهر هنا ويمكنك طباعتها." /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {certificates.map((cert) => (
              <div key={cert.id} className="rounded-[1.5rem] border p-5" style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-base" style={{ color: t.ink }}>{cert.course?.title ?? "دورة"}</div>
                    <div className="text-xs mt-1" style={{ color: t.muted }}>رقم الشهادة: {cert.certificate_number}</div>
                    <div className="text-xs mt-1" style={{ color: t.muted }}>تاريخ الإصدار: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString("ar-EG") : "-"}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${cert.status === "issued" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{cert.status === "issued" ? "صادرة" : "ملغاة"}</span>
                </div>
                {cert.status === "issued" && (
                  <button onClick={() => setSelected(cert)} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})` }}>
                    <Printer className="h-4 w-4" /> عرض / طباعة الشهادة
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black" style={{ color: t.ink }}>الأهلية والتقديم على الشهادات</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => <CourseCertificateCard key={course.enrollmentId} course={course} />)}
          {!courses.length && <div className="text-sm" style={{ color: t.muted }}>لا توجد دورات مسجّلة.</div>}
        </div>
      </div>

      {!!applications.length && (
        <div className="space-y-3">
          <h3 className="text-lg font-black" style={{ color: t.ink }}>طلبات الشهادات</h3>
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className="rounded-2xl border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3" style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg }}>
                <div>
                  <div className="font-bold" style={{ color: t.ink }}>{app.course?.title ?? "دورة"}</div>
                  <div className="text-xs" style={{ color: t.muted }}>التقدم عند التقديم: {formatNumber(app.progress_percent_at_apply)}% • {app.applied_at ? new Date(app.applied_at).toLocaleDateString("ar-EG") : ""}</div>
                  {app.admin_note && <div className="text-xs mt-1" style={{ color: t.muted }}>ملاحظة الإدارة: {app.admin_note}</div>}
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <CertificateViewDialog certificate={selected} platformName={platformName} platformLogoUrl={platformLogo} onClose={() => setSelected(null)} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    pending: { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700", icon: Clock3 },
    approved: { label: "تمت الموافقة", cls: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
    rejected: { label: "مرفوض", cls: "bg-red-100 text-red-700", icon: XCircle },
    issued: { label: "تم الإصدار", cls: "bg-green-100 text-green-700", icon: BadgeCheck },
    cancelled: { label: "ملغي", cls: "bg-gray-100 text-gray-700", icon: XCircle },
  };
  const item = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-700", icon: Clock3 };
  const Icon = item.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${item.cls}`}><Icon className="h-3.5 w-3.5" />{item.label}</span>;
}

function CourseCertificateCard({ course }: { course: ContinueLearningItem }) {
  const t = useBrandTheme();
  const { data, isLoading } = useEnrollmentCertificateEligibility(course.enrollmentId);
  const apply = useApplyForCertificate();

  const onApply = async () => {
    await apply.mutateAsync({ enrollmentId: course.enrollmentId });
  };

  return (
    <div className="rounded-[1.5rem] border p-4" style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black" style={{ color: t.ink }}>{course.courseTitle}</div>
          <div className="text-xs mt-1" style={{ color: t.muted }}>التقدم الحالي: {formatNumber(course.progressPercent)}%</div>
        </div>
        <Award className="h-5 w-5" style={{ color: BRAND_SECONDARY }} />
      </div>
      {isLoading ? <div className="text-xs mt-3" style={{ color: t.muted }}>جارٍ التحقق من الأهلية...</div> : !data ? null : (
        <div className="mt-3 space-y-2">
          <div className="text-xs" style={{ color: t.muted }}>
            {data.enabled ? `الحد الأدنى للتقديم: ${data.minimum_completion_percentage}%` : "الشهادة غير مفعّلة لهذه الدورة حالياً."}
          </div>
          {data.latest_application && <div className="text-xs" style={{ color: t.muted }}>آخر طلب: <StatusInline status={data.latest_application.status} /></div>}
          {data.has_issued_certificate && <div className="text-xs font-bold text-green-700">تم إصدار شهادتك لهذه الدورة.</div>}
          {data.can_apply && (
            <button onClick={onApply} disabled={apply.isPending} className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})` }}>
              {apply.isPending ? "جارٍ التقديم..." : "التقديم على الشهادة"}
            </button>
          )}
          {data.enabled && !data.can_apply && !data.has_issued_certificate && data.latest_application?.status === "pending" && (
            <div className="text-xs font-bold text-amber-700">طلبك قيد المراجعة من الإدارة.</div>
          )}
          {data.enabled && !data.can_apply && !data.has_issued_certificate && !data.latest_application && data.progress_percent < data.minimum_completion_percentage && (
            <div className="text-xs" style={{ color: t.muted }}>أكمل {formatNumber(Math.max(0, data.minimum_completion_percentage - data.progress_percent))}% إضافية للتقديم.</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusInline({ status }: { status: string }) {
  const labels: Record<string, string> = { pending: "قيد المراجعة", approved: "تمت الموافقة", rejected: "مرفوض", issued: "تم الإصدار", cancelled: "ملغي" };
  return <span className="font-bold">{labels[status] ?? status}</span>;
}
