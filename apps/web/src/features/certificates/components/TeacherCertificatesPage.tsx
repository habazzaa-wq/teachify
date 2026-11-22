"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Plus, Save, Trash2, CheckCircle2, XCircle, Send, Eye, Palette, FileCheck2 } from "lucide-react";
import { api } from "@/services/api";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import {
  useCertificateTemplates,
  useCreateCertificateTemplate,
  useUpdateCertificateTemplate,
  useUpdateCertificateTemplateStatus,
  useDeleteCertificateTemplate,
  useCertificateApplications,
  useApproveCertificateApplication,
  useRejectCertificateApplication,
  useIssueCertificateApplication,
  useCourseCertificateRule,
  useUpdateCourseCertificateRule,
} from "../hooks";
import { DEFAULT_CERTIFICATE_DESIGN, type CertificateApplication, type CertificateTemplate, type CertificateTemplateDesign, type IssuedCertificate } from "../types";
import { CertificateViewDialog } from "./CertificateViewDialog";
import { resolveCertificateDesign } from "./CertificatePreview";

type Tab = "templates" | "applications" | "rules";

function useAdminCourses() {
  return useQuery({
    queryKey: ["admin-courses-for-certificates"],
    queryFn: async () => {
      const { data: json } = await api.get("/courses?per_page=100");
      const data = json.data ?? json.courses?.data ?? json.courses ?? [];
      return Array.isArray(data) ? data : [];
    },
  });
}

const emptyDesign: CertificateTemplateDesign = { ...DEFAULT_CERTIFICATE_DESIGN };

export function TeacherCertificatesPage() {
  const [tab, setTab] = useState<Tab>("applications");
  const { tenant } = useActiveTenant();
  const platformName = (tenant as any)?.name ?? (tenant as any)?.profile?.name ?? "المنصة";
  const platformLogo = (tenant as any)?.branding?.logo_url ?? (tenant as any)?.branding?.logo ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Award className="h-7 w-7 text-amber-600" /> الشهادات</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة قوالب الشهادات، قواعد الاستحقاق، وطلبات الطلاب.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {([
            ["applications", "طلبات الشهادات", FileCheck2],
            ["templates", "قوالب الشهادات", Palette],
            ["rules", "قواعد الدورات", Award],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border ${tab === id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "templates" && <TemplatesSection platformName={platformName} platformLogo={platformLogo} />}
      {tab === "applications" && <ApplicationsSection platformName={platformName} platformLogo={platformLogo} />}
      {tab === "rules" && <RulesSection />}
    </div>
  );
}

function TemplatesSection({ platformName, platformLogo }: { platformName: string; platformLogo: string | null }) {
  const { data: templates = [], isLoading } = useCertificateTemplates();
  const create = useCreateCertificateTemplate();
  const update = useUpdateCertificateTemplate();
  const updateStatus = useUpdateCertificateTemplateStatus();
  const remove = useDeleteCertificateTemplate();
  const [editing, setEditing] = useState<CertificateTemplate | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", status: "draft" as any, design: { ...emptyDesign } });
  const [previewCert, setPreviewCert] = useState<IssuedCertificate | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "قالب شهادة جديد", slug: "", status: "draft", design: { ...emptyDesign, signatureName: platformName } });
  };
  const openEdit = (t: CertificateTemplate) => {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, status: t.status, design: resolveCertificateDesign(t.template_data) });
  };
  const save = async () => {
    const payload = { name: form.name, slug: form.slug || undefined, template_data: form.design };
    if (editing) await update.mutateAsync({ id: editing.id, payload });
    else await create.mutateAsync(payload as any);
    setEditing(null);
    setForm({ name: "", slug: "", status: "draft", design: { ...emptyDesign } });
  };
  const preview = () => {
    setPreviewCert({
      id: 0, tenant_id: 0, course_id: 0, course_completion_id: 0, tenant_user_id: 0, certificate_template_id: typeof editing?.id === "number" ? editing.id : null,
      certificate_number: "CERT-PREVIEW", issued_at: new Date().toISOString(), status: "issued",
      course: { id: 0, title: "اسم الدورة التدريبية" },
      student: { id: 0, user: { id: 0, name: "اسم الطالب", email: "" } },
      template: { id: editing?.id ?? 0, tenant_id: 0, name: form.name, slug: form.slug, status: form.status, template_data: form.design, created_at: "", updated_at: "" },
      verification: { id: 0, verification_code: "PREVIEW-CODE" },
      completion: { id: 0, completion_percent: 100, completed_at: new Date().toISOString() },
    });
  };

  const setDesign = (k: keyof CertificateTemplateDesign, v: any) => setForm((f) => ({ ...f, design: { ...f.design, [k]: v } }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">قوالب الشهادات</h2>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> قالب جديد</button>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">جارٍ التحميل...</div> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.slug}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${t.status === "active" ? "bg-green-100 text-green-700" : t.status === "draft" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{t.status === "active" ? "مفعّل" : t.status === "draft" ? "مسودة" : "مؤرشف"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openEdit(t)} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-muted">تعديل</button>
                {t.status !== "active" ? <button onClick={() => updateStatus.mutate({ id: t.id, status: "active" })} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-muted">تفعيل</button> : <button onClick={() => updateStatus.mutate({ id: t.id, status: "archived" })} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-muted">أرشفة</button>}
                <button onClick={() => { if (confirm("حذف القالب؟")) remove.mutate(t.id); }} className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-50">حذف</button>
              </div>
            </div>
          ))}
          {!templates.length && <div className="text-sm text-muted-foreground">لا توجد قوالب بعد. أنشئ قالبًا لتفعيل الشهادات.</div>}
        </div>
      )}

      {(editing !== null || (form.name && form.name !== "" && editing === null && form.slug !== undefined && (create.isPending || update.isPending || form.name === "قالب شهادة جديد"))) && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-bold">{editing ? "تعديل القالب" : "قالب جديد"}</h3><div className="flex gap-2"><button onClick={preview} className="rounded-lg border px-3 py-2 text-sm font-bold"><Eye className="inline h-4 w-4 ml-1" />معاينة</button><button onClick={save} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold"><Save className="inline h-4 w-4 ml-1" />حفظ</button></div></div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium">اسم القالب<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="text-sm font-medium">Slug<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
            <label className="text-sm font-medium">نمط الحدود<select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.borderStyle} onChange={(e) => setDesign("borderStyle", e.target.value)}><option value="classic">كلاسيكي</option><option value="modern">حديث</option><option value="minimal">بسيط</option></select></label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium">العنوان<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.titleText} onChange={(e) => setDesign("titleText", e.target.value)} /></label>
            <label className="text-sm font-medium">النص الفرعي<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.subtitleText} onChange={(e) => setDesign("subtitleText", e.target.value)} /></label>
            <label className="text-sm font-medium">نص الإنجاز<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.bodyText} onChange={(e) => setDesign("bodyText", e.target.value)} /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium">نص التذييل<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.footerText} onChange={(e) => setDesign("footerText", e.target.value)} /></label>
            <label className="text-sm font-medium">اسم الموقّع<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.signatureName} onChange={(e) => setDesign("signatureName", e.target.value)} /></label>
            <label className="text-sm font-medium">صفة الموقّع<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.signatureTitle} onChange={(e) => setDesign("signatureTitle", e.target.value)} /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium">رابط الشعار (Logo URL)<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.logoUrl ?? ""} onChange={(e) => setDesign("logoUrl", e.target.value || null)} /></label>
            <label className="text-sm font-medium">رابط الختم (Seal URL)<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.sealUrl ?? ""} onChange={(e) => setDesign("sealUrl", e.target.value || null)} /></label>
            <label className="text-sm font-medium">رابط صورة التوقيع<input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.design.signatureImageUrl ?? ""} onChange={(e) => setDesign("signatureImageUrl", e.target.value || null)} /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm font-medium">لون الخلفية<input type="color" className="mt-1 h-10 w-full rounded-lg border px-1 py-1" value={form.design.backgroundColor} onChange={(e) => setDesign("backgroundColor", e.target.value)} /></label>
            <label className="text-sm font-medium">اللون الأساسي<input type="color" className="mt-1 h-10 w-full rounded-lg border px-1 py-1" value={form.design.accentColor} onChange={(e) => setDesign("accentColor", e.target.value)} /></label>
            <label className="text-sm font-medium">لون النص<input type="color" className="mt-1 h-10 w-full rounded-lg border px-1 py-1" value={form.design.secondaryColor} onChange={(e) => setDesign("secondaryColor", e.target.value)} /></label>
            <label className="text-sm font-medium flex items-center gap-2 mt-6"><input type="checkbox" checked={form.design.showQr} onChange={(e) => setDesign("showQr", e.target.checked)} /> إظهار QR للتحقق</label>
          </div>
        </div>
      )}

      <CertificateViewDialog certificate={previewCert} platformName={platformName} platformLogoUrl={platformLogo} onClose={() => setPreviewCert(null)} />
    </div>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: "قيد المراجعة", approved: "تمت الموافقة", rejected: "مرفوض", issued: "تم الإصدار", cancelled: "ملغي" };
  return map[status] ?? status;
}

function ApplicationsSection({ platformName, platformLogo }: { platformName: string; platformLogo: string | null }) {
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = useCertificateApplications(status ? { status } : undefined);
  const approve = useApproveCertificateApplication();
  const reject = useRejectCertificateApplication();
  const issue = useIssueCertificateApplication();
  const [previewCert, setPreviewCert] = useState<IssuedCertificate | null>(null);
  const applications = data?.data ?? [];

  const onApprove = async (app: CertificateApplication) => {
    const note = prompt("ملاحظة للطالب (اختياري):") ?? undefined;
    await approve.mutateAsync({ id: app.id, payload: { admin_note: note, issue_and_send: true } });
  };
  const onReject = async (app: CertificateApplication) => {
    const note = prompt("سبب الرفض / ملاحظة:") ?? undefined;
    await reject.mutateAsync({ id: app.id, payload: { admin_note: note } });
  };
  const onIssue = async (app: CertificateApplication) => {
    await issue.mutateAsync(app.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h2 className="text-lg font-bold">طلبات الشهادات</h2>
        <select className="rounded-lg border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="pending">قيد المراجعة</option>
          <option value="approved">تمت الموافقة</option>
          <option value="issued">تم الإصدار</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">جارٍ التحميل...</div> : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-right">
              <tr>
                <th className="p-3">الطالب</th>
                <th className="p-3">الدورة</th>
                <th className="p-3">التقدم</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const cert = (app.issuedCertificate ?? app.issued_certificate) as IssuedCertificate | undefined;
                return (
                  <tr key={app.id} className="border-t align-top">
                    <td className="p-3">
                      <div className="font-bold">{app.student?.user?.name ?? "-"}</div>
                      <div className="text-xs text-muted-foreground">{app.student?.user?.email ?? ""}</div>
                    </td>
                    <td className="p-3">{app.course?.title ?? "-"}</td>
                    <td className="p-3 font-bold">{app.progress_percent_at_apply}%</td>
                    <td className="p-3"><span className="rounded-full bg-muted px-2 py-1 text-xs font-bold">{statusLabel(app.status)}</span></td>
                    <td className="p-3 text-xs text-muted-foreground">{app.applied_at ? new Date(app.applied_at).toLocaleString("ar-EG") : "-"}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {app.status === "pending" && (
                          <>
                            <button onClick={() => onApprove(app)} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white"><CheckCircle2 className="h-3.5 w-3.5" />موافقة وإصدار</button>
                            <button onClick={() => onReject(app)} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white"><XCircle className="h-3.5 w-3.5" />رفض</button>
                          </>
                        )}
                        {app.status === "approved" && !cert && (
                          <button onClick={() => onIssue(app)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"><Send className="h-3.5 w-3.5" />إصدار وإرسال</button>
                        )}
                        {cert && (
                          <button onClick={() => setPreviewCert(cert)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold"><Eye className="h-3.5 w-3.5" />عرض الشهادة</button>
                        )}
                      </div>
                      {app.admin_note && <div className="text-xs text-muted-foreground mt-2">ملاحظة: {app.admin_note}</div>}
                    </td>
                  </tr>
                );
              })}
              {!applications.length && (
                <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>لا توجد طلبات شهادات.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <CertificateViewDialog certificate={previewCert} platformName={platformName} platformLogoUrl={platformLogo} onClose={() => setPreviewCert(null)} />
    </div>
  );
}

function RulesSection() {
  const { data: courses = [] } = useAdminCourses();
  const { data: templates = [] } = useCertificateTemplates();
  const [courseId, setCourseId] = useState<string>("");
  const { data: rule, isLoading } = useCourseCertificateRule(courseId || null);
  const updateRule = useUpdateCourseCertificateRule();
  const [form, setForm] = useState({ enabled: false, certificate_template_id: "", minimum_completion_percentage: 100, require_course_completion: true, require_quiz_pass: false, require_assignment_pass: false });

  useMemo(() => {
    if (rule) {
      setForm({
        enabled: !!rule.enabled,
        certificate_template_id: rule.certificate_template_id ? String(rule.certificate_template_id) : "",
        minimum_completion_percentage: rule.minimum_completion_percentage ?? 100,
        require_course_completion: !!rule.require_course_completion,
        require_quiz_pass: !!rule.require_quiz_pass,
        require_assignment_pass: !!rule.require_assignment_pass,
      });
    } else if (courseId) {
      setForm({ enabled: false, certificate_template_id: "", minimum_completion_percentage: 100, require_course_completion: true, require_quiz_pass: false, require_assignment_pass: false });
    }
  }, [rule, courseId]);

  const save = async () => {
    if (!courseId) return;
    await updateRule.mutateAsync({
      courseId,
      payload: {
        ...form,
        certificate_template_id: form.certificate_template_id ? Number(form.certificate_template_id) : null,
        minimum_completion_percentage: Number(form.minimum_completion_percentage),
      },
    });
    alert("تم حفظ قاعدة الشهادة.");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">قواعد الشهادات للدورات</h2>
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <label className="text-sm font-medium block">اختر الدورة
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">-- اختر دورة --</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>

        {courseId && (
          <>
            {isLoading ? <div className="text-sm text-muted-foreground">جارٍ التحميل...</div> : (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> تفعيل الشهادة لهذه الدورة</label>
                <label className="text-sm font-medium">القالب
                  <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.certificate_template_id} onChange={(e) => setForm({ ...form, certificate_template_id: e.target.value })}>
                    <option value="">-- اختر قالبًا --</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.status})</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">نسبة الإكمال المطلوبة (%)
                  <input type="number" min={1} max={100} className="mt-1 w-full rounded-lg border px-3 py-2" value={form.minimum_completion_percentage} onChange={(e) => setForm({ ...form, minimum_completion_percentage: Number(e.target.value) })} />
                </label>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.require_course_completion} onChange={(e) => setForm({ ...form, require_course_completion: e.target.checked })} /> يتطلب إكمال الدورة</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.require_quiz_pass} onChange={(e) => setForm({ ...form, require_quiz_pass: e.target.checked })} /> يتطلب اجتياز الاختبارات</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.require_assignment_pass} onChange={(e) => setForm({ ...form, require_assignment_pass: e.target.checked })} /> يتطلب اجتياز الواجبات</label>
                </div>
              </div>
            )}
            <button onClick={save} disabled={updateRule.isPending} className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold disabled:opacity-60"><Save className="inline h-4 w-4 ml-1" />حفظ القاعدة</button>
          </>
        )}
      </div>
    </div>
  );
}
