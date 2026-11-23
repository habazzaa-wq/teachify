"use client";

import { useMemo, useState } from "react";
import {
  Award, Printer, CheckCircle2, Clock3, XCircle, BadgeCheck, ClipboardList, FolderOpen, Link2,
  ExternalLink, ChevronDown, ChevronUp, Loader2, FileText, type LucideIcon,
} from "lucide-react";
import type { ContinueLearningItem } from "../types";
import {
  useMyCertificates, useMyCertificateApplications, useApplyForCertificate,
  useEnrollmentCertificateEligibility,
} from "@/features/certificates/hooks";
import type {
  CertificateApplicationStatus, CertificateEligibility, CertificateRequirementStatus, IssuedCertificate,
} from "@/features/certificates/types";
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
  const platformName = tenant?.name ?? "المنصة";
  const platformLogo = tenant?.branding?.logo ?? tenant?.branding?.logo_image ?? null;
  const { data: certificates = [], isLoading } = useMyCertificates();
  const { data: applications = [] } = useMyCertificateApplications();
  const [selected, setSelected] = useState<IssuedCertificate | null>(null);

  return (
    <div className="space-y-8">
      <SectionHeader index={7} eyebrow="اعتمادك" title="الشهادات" subtitle="قدّم على شهادتك بعد إكمال الدورة ومتطلبات الاختبار أو المشروع، وحمّلها بعد اعتمادها." />

      <div className="space-y-4">
        <h3 className="text-lg font-black" style={{ color: t.ink }}>شهاداتي الصادرة</h3>
        <p className="text-xs" style={{ color: t.muted }}>تبقى شهادتك متاحة للتحميل بصيغتي PDF وPNG في أي وقت.</p>
        {isLoading ? <div className="text-sm" style={{ color: t.muted }}>جارٍ التحميل...</div> : certificates.length === 0 ? (
          <div className="rounded-[1.5rem] border" style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg }}><EmptyState icon={Award} title="لا توجد شهادات صادرة بعد" description="عند اعتماد طلب الشهادة ستظهر هنا ويمكنك تنزيلها وطباعتها." /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {certificates.map((cert) => (
              <div key={cert.id} className="rounded-[1.5rem] border p-5" style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-base" style={{ color: t.ink }}>{cert.course?.title ?? "دورة"}</div>
                    <div className="text-xs mt-1" style={{ color: t.muted }}>رقم الشهادة: {cert.certificate_number}</div>
                    {cert.reference_number && <div className="text-xs mt-1" style={{ color: t.muted }}>الرقم المرجعي: {cert.reference_number}</div>}
                    <div className="text-xs mt-1" style={{ color: t.muted }}>تاريخ الإصدار: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString("ar-EG") : "-"}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${cert.status === "issued" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{cert.status === "issued" ? "صادرة" : "ملغاة"}</span>
                </div>
                {cert.status === "issued" && (
                  <button onClick={() => setSelected(cert)} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})` }}>
                    <Printer className="h-4 w-4" /> عرض / تنزيل الشهادة
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
          {courses.map((course) => <CourseCertificateCard key={course.enrollmentId} course={course} onViewCertificate={setSelected} />)}
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
                  {app.requirement_reviews && Object.values(app.requirement_reviews).some((review) => review.status === "rejected") && (
                    <div className="text-xs mt-1 font-bold text-red-700">تم رفض أحد المتطلبات المرفقة — يمكنك التقديم مرة أخرى بعد تعديله.</div>
                  )}
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
  const map: Record<string, { label: string; cls: string; icon: LucideIcon }> = {
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

function latestStatus(latest: CertificateEligibility["latest_application"]): CertificateApplicationStatus | null {
  if (!latest) return null;
  return typeof latest === "string" ? latest : latest.status;
}

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function RequirementIcon({ type }: { type: CertificateRequirementStatus["type"] }) {
  if (type === "exam_bank") return <ClipboardList className="h-4 w-4" />;
  if (type === "exam_link") return <Link2 className="h-4 w-4" />;
  return <FolderOpen className="h-4 w-4" />;
}

function CourseCertificateCard({
  course,
  onViewCertificate,
}: {
  course: ContinueLearningItem;
  onViewCertificate: (certificate: IssuedCertificate) => void;
}) {
  const t = useBrandTheme();
  const { data, isLoading, isError } = useEnrollmentCertificateEligibility(course.enrollmentId);
  const apply = useApplyForCertificate();
  const [expanded, setExpanded] = useState(false);
  const [localSubmissions, setLocalSubmissions] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const status = latestStatus(data?.latest_application ?? null);
  const requirements = useMemo(() => data?.requirements ?? [], [data?.requirements]);
  const manualRequirements = requirements.filter((requirement) => requirement.type !== "exam_bank");
  const submissions = useMemo(
    () => ({ ...(data?.submissions ?? {}), ...localSubmissions }),
    [data?.submissions, localSubmissions],
  );

  const submissionIsReady = (id: number | string) => {
    const value = submissions[String(id)]?.trim();
    return Boolean(value && isUrl(value));
  };

  const ready = Boolean(
    data?.enabled
    && !data.has_issued_certificate
    && status !== "pending"
    && status !== "approved"
    && status !== "issued"
    && data.completion_met
    && requirements.every((requirement) => requirement.type === "exam_bank"
      ? requirement.met
      : submissionIsReady(requirement.id)),
  );

  const onApply = async () => {
    setLocalError(null);
    const invalid = manualRequirements.find((requirement) => {
      const value = submissions[String(requirement.id)]?.trim();
      return !value || !isUrl(value);
    });
    if (invalid) {
      setLocalError("أدخل رابطًا صالحًا لكل متطلب يتطلب تسليم رابط.");
      setExpanded(true);
      return;
    }
    try {
      await apply.mutateAsync({ enrollmentId: course.enrollmentId, note: note.trim() || undefined, submissions });
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: unknown } } })?.response;
      const message = response?.data?.message;
      setLocalError(typeof message === "string" ? message : "تعذّر تقديم الطلب، حاول مرة أخرى.");
    }
  };

  const issuedCertificate = data?.issued_certificate;

  return (
    <div className="rounded-[1.5rem] border p-4" style={{ borderColor: t.cardBorder, backgroundColor: t.cardBg, boxShadow: t.cardShadow }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black" style={{ color: t.ink }}>{course.courseTitle}</div>
          <div className="text-xs mt-1" style={{ color: t.muted }}>التقدم الحالي: {formatNumber(course.progressPercent)}%</div>
        </div>
        <Award className="h-5 w-5" style={{ color: BRAND_SECONDARY }} />
      </div>

      {isLoading ? (
        <div className="text-xs mt-3 flex items-center gap-2" style={{ color: t.muted }}><Loader2 className="h-3.5 w-3.5 animate-spin" /> جارٍ التحقق من الأهلية...</div>
      ) : isError ? (
        <div className="text-xs mt-3 text-red-600">تعذّر جلب حالة الشهادة.</div>
      ) : !data ? null : (
        <div className="mt-3 space-y-2">
          <div className="text-xs" style={{ color: t.muted }}>
            {data.enabled ? `الحد الأدنى للتقديم: ${data.minimum_completion_percentage}%` : "الشهادة غير مفعّلة لهذه الدورة حالياً."}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ borderColor: t.cardBorder }}>
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: t.ink }}>
              {data.completion_met ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Clock3 className="h-4 w-4 text-amber-600" />}
              إكمال الدورة {formatNumber(data.progress_percent)}%
            </div>
            {requirements.length > 0 && (
              <button onClick={() => setExpanded((value) => !value)} className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: t.muted }}>
                المتطلبات ({requirements.length}) {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {expanded && requirements.length > 0 && (
            <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: t.cardBorder }}>
              {requirements.map((requirement) => (
                <RequirementRow
                  key={requirement.id}
                  requirement={requirement}
                  value={submissions[String(requirement.id)] ?? ""}
                  onChange={(value) => {
                    setLocalSubmissions((current) => ({ ...current, [String(requirement.id)]: value }));
                    setLocalError(null);
                  }}
                  disabled={status === "pending" || status === "approved" || data.has_issued_certificate}
                />
              ))}
            </div>
          )}

          {status && <div className="text-xs" style={{ color: t.muted }}>آخر طلب: <StatusInline status={status} /></div>}
          {data.has_issued_certificate && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-green-700">
              <BadgeCheck className="h-4 w-4" /> تم إصدار شهادتك لهذه الدورة.
              {issuedCertificate && (
                <button
                  onClick={() => onViewCertificate(issuedCertificate)}
                  className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-3 py-1.5 font-bold text-green-700 hover:bg-green-50"
                >
                  <FileText className="h-3.5 w-3.5" /> عرض الشهادة وتنزيلها
                </button>
              )}
            </div>
          )}

          {status === "pending" && <div className="text-xs font-bold text-amber-700">طلبك قيد المراجعة من المدرب/الإدارة.</div>}
          {status === "rejected" && <div className="text-xs font-bold text-red-700">تم رفض الطلب السابق. يمكنك تعديل الروابط والتقديم مجددًا.</div>}
          {data.reason === "requirements_required" && status !== "pending" && (
            <div className="text-xs text-amber-700">أكمل متطلبات الاختبار أو أرفق روابط التسليم للتقديم.</div>
          )}
          {!data.enabled && <div className="text-xs" style={{ color: t.muted }}>فعّل المدرب الشهادة لهذه الدورة أولًا.</div>}

          {ready && (
            <div className="space-y-2 pt-1">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="ملاحظة للمدرب (اختياري)"
                className="w-full rounded-xl border px-3 py-2 text-xs"
                style={{ borderColor: t.cardBorder }}
              />
              <button
                onClick={onApply}
                disabled={apply.isPending}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})` }}
              >
                {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                {apply.isPending ? "جارٍ التقديم..." : "التقديم على الشهادة"}
              </button>
            </div>
          )}
          {localError && <div className="text-xs font-bold text-red-700">{localError}</div>}
        </div>
      )}
    </div>
  );
}

function RequirementRow({
  requirement,
  value,
  onChange,
  disabled,
}: {
  requirement: CertificateRequirementStatus;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const typeLabel = requirement.type === "exam_bank" ? "اختبار من المكتبة" : requirement.type === "exam_link" ? "اختبار خارجي" : "مشروع";
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold">
          <RequirementIcon type={requirement.type} />
          <span>{requirement.title}</span>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{typeLabel}</span>
        </div>
        {requirement.type === "exam_bank" ? (
          requirement.met ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />
        ) : (
          value && isUrl(value) ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Clock3 className="h-4 w-4 text-amber-600" />
        )}
      </div>

      {requirement.description && <p className="text-[11px] text-muted-foreground">{requirement.description}</p>}

      {requirement.type === "exam_bank" ? (
        <div className="text-[11px] text-muted-foreground">
          {requirement.exam_title ? `الاختبار: ${requirement.exam_title} • ` : ""}
          {requirement.detail || `الدرجة المطلوبة: ${formatNumber(requirement.required_score ?? 0)}%`}
        </div>
      ) : (
        <>
          {requirement.type === "exam_link" && requirement.exam_link && (
            <a href={requirement.exam_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-primary break-all">
              رابط الاختبار المطلوب <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <input
            dir="ltr"
            type="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            placeholder={requirement.type === "project" ? "https://...رابط المشروع" : "https://...رابط نتيجة الاختبار"}
            className="w-full rounded-lg border px-3 py-2 text-xs disabled:opacity-60"
          />
          <div className="text-[10px] text-muted-foreground">يُراجع المدرب الرابط يدويًا قبل إصدار الشهادة.</div>
        </>
      )}

      {requirement.manual_status && (
        <div className={`text-[11px] font-bold ${requirement.manual_status === "approved" ? "text-green-700" : "text-red-700"}`}>
          {requirement.manual_status === "approved" ? "تمت موافقة المدرب على هذا المتطلب" : "رفض المدرب هذا المتطلب"}
        </div>
      )}
    </div>
  );
}

function StatusInline({ status }: { status: string }) {
  const labels: Record<string, string> = { pending: "قيد المراجعة", approved: "تمت الموافقة", rejected: "مرفوض", issued: "تم الإصدار", cancelled: "ملغي" };
  return <span className="font-bold">{labels[status] ?? status}</span>;
}
