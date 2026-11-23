"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Award, Plus, Save, Trash2, CheckCircle2, XCircle, Send, Eye, Palette, FileCheck2,
  ClipboardList, Link2, FolderOpen, ExternalLink,
} from "lucide-react";
import { api } from "@/services/api";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useInstructorAuthStore } from "@/features/instructors/store";
import { instructorApi } from "@/features/instructors/api";
import { useCourses } from "@/features/courses/hooks";
import { useExams } from "@/features/exam-bank/hooks";
import {
  AppDialog, AppDialogContent, AppDialogHeader, AppDialogTitle, AppDialogDescription, AppDialogFooter,
} from "@/components/ui";
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
import { isInstructorCertificatesPath } from "../services";
import {
  DEFAULT_CERTIFICATE_DESIGN,
  type CertificateApplication,
  type CertificateRequirement,
  type CertificateRequirementType,
  type CertificateTemplate,
  type CertificateTemplateDesign,
  type CertificateTemplateStatus,
  type CourseCertificateRule,
  type IssuedCertificate,
} from "../types";
import { CertificateViewDialog } from "./CertificateViewDialog";
import { ImageUploadField } from "./ImageUploadField";
import { resolveCertificateDesign } from "./CertificatePreview";

type Tab = "templates" | "applications" | "rules";

type TemplateEditorState =
  | { mode: "create" }
  | { mode: "edit"; template: CertificateTemplate }
  | null;

function apiErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: unknown } } })?.response;
  const message = response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  return error instanceof Error && error.message ? error.message : fallback;
}

interface CourseOption {
  id: number | string;
  title: string;
}

interface ExamOption {
  id: number | string;
  title: string;
}

interface RequirementSnapshotItem {
  id: number;
  title: string | null;
  type: string;
}

const emptyDesign: CertificateTemplateDesign = { ...DEFAULT_CERTIFICATE_DESIGN };

interface RuleForm {
  enabled: boolean;
  certificate_template_id: string;
  minimum_completion_percentage: number;
  require_course_completion: boolean;
  show_instructor_signature: boolean;
  manager_signature_name: string;
  manager_signature_title: string;
  manager_signature_url: string;
  instructor_signature_url: string;
  requirements: CertificateRequirement[];
}

function ruleToForm(rule: CourseCertificateRule | null): RuleForm {
  if (!rule) {
    return {
      enabled: false,
      certificate_template_id: "",
      minimum_completion_percentage: 100,
      require_course_completion: true,
      show_instructor_signature: false,
      manager_signature_name: "",
      manager_signature_title: "",
      manager_signature_url: "",
      instructor_signature_url: "",
      requirements: [],
    };
  }

  return {
    enabled: !!rule.enabled,
    certificate_template_id: rule.certificate_template_id ? String(rule.certificate_template_id) : "",
    minimum_completion_percentage: rule.minimum_completion_percentage ?? 100,
    require_course_completion: !!rule.require_course_completion,
    show_instructor_signature: !!rule.show_instructor_signature,
    manager_signature_name: rule.manager_signature_name ?? "",
    manager_signature_title: rule.manager_signature_title ?? "",
    manager_signature_url: rule.manager_signature_url ?? "",
    instructor_signature_url: rule.instructor_signature_url ?? "",
    requirements: rule.requirements ?? [],
  };
}

function useAdminCourses() {
  return useQuery({
    queryKey: ["admin-courses-for-certificates"],
    queryFn: async (): Promise<CourseOption[]> => {
      const { data: json } = await api.get("/courses?per_page=100");
      const data = json.data ?? json.courses?.data ?? json.courses ?? [];
      return Array.isArray(data) ? (data as CourseOption[]) : [];
    },
  });
}

export function TeacherCertificatesPage() {
  const [tab, setTab] = useState<Tab>("applications");
  const { tenant } = useActiveTenant();
  const pathname = usePathname();
  const storedInstructorToken = useInstructorAuthStore((state) => state.accessToken);
  // Only treat an instructor token as active inside the instructor workspace.
  // A stale token in localStorage must not hide the admin-only templates tab.
  const instructorToken = isInstructorCertificatesPath(pathname) ? storedInstructorToken : null;
  const platformName = tenant?.name ?? "المنصة";
  const platformLogo = tenant?.branding?.logo ?? tenant?.branding?.logo_image ?? null;

  const tabs: Array<[Tab, string, typeof Award]> = [
    ["applications", "طلبات الشهادات", FileCheck2],
    ["rules", "شروط الشهادات", Award],
  ];
  if (!instructorToken) tabs.splice(1, 0, ["templates", "قوالب الشهادات", Palette]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Award className="h-7 w-7 text-amber-600" /> الشهادات</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة قوالب الشهادات، شروط الاستحقاق، ومراجعة طلبات الطلاب.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border ${tab === id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "templates" && !instructorToken && <TemplatesSection platformName={platformName} platformLogo={platformLogo} />}
      {tab === "applications" && <ApplicationsSection platformName={platformName} platformLogo={platformLogo} />}
      {tab === "rules" && <RulesSection instructorToken={instructorToken} />}
    </div>
  );
}

function TemplatesSection({ platformName, platformLogo }: { platformName: string; platformLogo: string | null }) {
  const { data: templates = [], isLoading, isError, error, refetch } = useCertificateTemplates();
  const create = useCreateCertificateTemplate();
  const update = useUpdateCertificateTemplate();
  const updateStatus = useUpdateCertificateTemplateStatus();
  const remove = useDeleteCertificateTemplate();
  // `null` means "no editor open". A new template is { mode: "create" }, so it
  // can no longer be confused with "nothing selected" (the old bug).
  const [editor, setEditor] = useState<TemplateEditorState>(null);
  const [form, setForm] = useState<{ name: string; slug: string; status: CertificateTemplateStatus; design: CertificateTemplateDesign }>({
    name: "", slug: "", status: "draft", design: { ...emptyDesign },
  });
  const [previewCert, setPreviewCert] = useState<IssuedCertificate | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openNew = () => {
    setSaveError(null);
    setEditor({ mode: "create" });
    setForm({ name: "قالب شهادة جديد", slug: "", status: "draft", design: { ...emptyDesign, signatureName: platformName } });
  };

  const openEdit = (template: CertificateTemplate) => {
    setSaveError(null);
    setEditor({ mode: "edit", template });
    setForm({
      name: template.name,
      slug: template.slug,
      status: template.status,
      design: resolveCertificateDesign(template.template_data),
    });
  };

  const closeEditor = () => {
    setEditor(null);
    setSaveError(null);
  };

  const save = async () => {
    setSaveError(null);
    const payload = { name: form.name, slug: form.slug || undefined, template_data: form.design };
    try {
      if (editor?.mode === "edit") {
        await update.mutateAsync({ id: editor.template.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      closeEditor();
      setForm({ name: "", slug: "", status: "draft", design: { ...emptyDesign } });
    } catch (saveFailure: unknown) {
      setSaveError(apiErrorMessage(saveFailure, "تعذّر حفظ القالب، حاول مرة أخرى."));
    }
  };

  const preview = () => {
    setPreviewCert({
      id: 0,
      tenant_id: 0,
      course_id: 0,
      course_completion_id: 0,
      tenant_user_id: 0,
      certificate_template_id: editor?.mode === "edit" ? Number(editor.template.id) : null,
      certificate_number: "CERT-PREVIEW",
      reference_number: "REF-PREVIEW",
      issued_at: new Date().toISOString(),
      status: "issued",
      course: { id: 0, title: "اسم الدورة التدريبية" },
      student: { id: 0, user: { id: 0, name: "اسم الطالب", email: "" } },
      template: {
        id: editor?.mode === "edit" ? Number(editor.template.id) : 0,
        tenant_id: 0,
        name: form.name,
        slug: form.slug,
        status: form.status,
        template_data: form.design,
        created_at: "",
        updated_at: "",
      },
      verification: { id: 0, verification_code: "PREVIEW-CODE" },
      completion: { id: 0, completion_percent: 100, completed_at: new Date().toISOString() },
      snapshot_data: {
        course_title: "اسم الدورة التدريبية",
        instructor_name: "اسم المدرب",
        student_name: "اسم الطالب",
        certificate_number: "CERT-PREVIEW",
        reference_number: "REF-PREVIEW",
        verification_code: "PREVIEW-CODE",
        issued_at: new Date().toISOString(),
        design: form.design,
        show_instructor_signature: false,
      },
    });
  };

  const setDesign = (key: keyof CertificateTemplateDesign, value: string | boolean | null) => {
    setForm((current) => ({
      ...current,
      design: { ...current.design, [key]: value } as CertificateTemplateDesign,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">قوالب الشهادات</h2>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> قالب جديد</button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">جارٍ تحميل القوالب...</div>
      ) : isError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3 text-sm">
          <div className="font-bold text-amber-900">تعذّر تحميل قوالب الشهادات.</div>
          <div className="text-amber-800">
            تأكد من تسجيل الدخول بحساب مالك/أدمن التينانت، ومن مزامنة الصلاحيات
            (<code className="font-mono">php artisan db:seed --class=IdentityAccessSeeder</code>).
          </div>
          {error instanceof Error && <div className="text-xs text-amber-700">{error.message}</div>}
          <button onClick={() => void refetch()} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100">
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.slug}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${template.status === "active" ? "bg-green-100 text-green-700" : template.status === "draft" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                  {template.status === "active" ? "مفعّل" : template.status === "draft" ? "مسودة" : "مؤرشف"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openEdit(template)} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-muted">تعديل</button>
                {template.status !== "active"
                  ? <button onClick={() => updateStatus.mutate({ id: template.id, status: "active" })} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-muted">تفعيل</button>
                  : <button onClick={() => updateStatus.mutate({ id: template.id, status: "archived" })} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-muted">أرشفة</button>}
                <button
                  onClick={() => setPreviewCert({
                    id: Number(template.id),
                    tenant_id: 0,
                    course_id: 0,
                    course_completion_id: 0,
                    tenant_user_id: 0,
                    certificate_template_id: Number(template.id),
                    certificate_number: "CERT-PREVIEW",
                    reference_number: "REF-PREVIEW",
                    issued_at: new Date().toISOString(),
                    status: "issued",
                    course: { id: 0, title: "اسم الدورة التدريبية" },
                    student: { id: 0, user: { id: 0, name: "اسم الطالب", email: "" } },
                    template,
                    verification: { id: 0, verification_code: "PREVIEW-CODE" },
                    completion: { id: 0, completion_percent: 100, completed_at: new Date().toISOString() },
                    snapshot_data: { design: template.template_data, show_instructor_signature: false },
                  })}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-muted"
                >
                  معاينة
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("حذف القالب؟")) remove.mutate(template.id);
                  }}
                  className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-50"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
          {!templates.length && (
            <div className="rounded-2xl border border-dashed p-6 text-center space-y-3 md:col-span-2 xl:col-span-3">
              <div className="text-sm font-bold">لا توجد قوالب شهادات بعد.</div>
              <div className="text-xs text-muted-foreground">أنشئ أول قالب ثم فعّله، بعدها تقدر تربطه بدوراتك من تب «شروط الشهادات».</div>
              <button onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                <Plus className="h-4 w-4" /> قالب جديد
              </button>
            </div>
          )}
        </div>
      )}

      {editor !== null && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold">{editor.mode === "edit" ? "تعديل القالب" : "قالب جديد"}</h3>
              {editor.mode === "create" && (
                <p className="text-xs text-muted-foreground mt-1">القالب الجديد هيبقى «مسودة» لحد ما تضغط «تفعيل» بعد الحفظ.</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={preview} className="rounded-lg border px-3 py-2 text-sm font-bold"><Eye className="inline h-4 w-4 ml-1" />معاينة</button>
              <button onClick={closeEditor} className="rounded-lg border px-3 py-2 text-sm font-bold">إلغاء</button>
              <button
                onClick={() => void save()}
                disabled={create.isPending || update.isPending}
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-60"
              >
                <Save className="inline h-4 w-4 ml-1" />{create.isPending || update.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{saveError}</div>
          )}
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
          <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
            <div>
              <div className="text-sm font-bold">الصور والشعارات</div>
              <p className="text-xs text-muted-foreground mt-1">ارفع الصور من جهازك مباشرة (لوجو، ختم، توقيعات). بتتخزن في مكتبة وسائط المنصة وتُحفظ داخل القالب تلقائيًا.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ImageUploadField
                label="شعار المنصة"
                value={form.design.logoUrl}
                onChange={(url) => setDesign("logoUrl", url)}
                hint="يفضّل PNG بخلفية شفافة، مربع أو أفقي."
              />
              <ImageUploadField
                label="ختم الشهادة"
                value={form.design.sealUrl}
                onChange={(url) => setDesign("sealUrl", url)}
                hint="صورة دائرية شفافة تظهر أعلى الشهادة."
              />
              <ImageUploadField
                label="توقيع المدير"
                value={form.design.signatureImageUrl}
                onChange={(url) => setDesign("signatureImageUrl", url)}
                shape="wide"
                hint="PNG شفاف لتوقيع المدير الموقّع."
              />
              <ImageUploadField
                label="توقيع المدرب"
                value={form.design.instructorSignatureUrl}
                onChange={(url) => setDesign("instructorSignatureUrl", url)}
                shape="wide"
                hint="بيظهر فقط لو مفعّل في شروط الدورة."
              />
            </div>
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
  const [reviewTarget, setReviewTarget] = useState<CertificateApplication | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>({});
  const applications = data?.data ?? [];

  const openReview = (app: CertificateApplication) => {
    setReviewTarget(app);
    setReviewNote("");
    setDecisions({});
  };

  const submitReview = async (decision: "approve" | "reject") => {
    if (!reviewTarget) return;
    if (decision === "approve") {
      const requirement_reviews = Object.fromEntries(
        Object.entries(decisions).map(([id, value]) => [id, { status: value }]),
      );
      await approve.mutateAsync({
        id: reviewTarget.id,
        payload: { admin_note: reviewNote || undefined, issue_and_send: true, requirement_reviews },
      });
    } else {
      await reject.mutateAsync({ id: reviewTarget.id, payload: { admin_note: reviewNote || undefined } });
    }
    setReviewTarget(null);
  };

  const submissions = reviewTarget?.submissions ?? {};
  const snapshot = reviewTarget?.metadata?.requirement_snapshot;
  const requirementSnapshot: RequirementSnapshotItem[] = Array.isArray(snapshot)
    ? (snapshot as RequirementSnapshotItem[])
    : [];

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
                const hasLinks = Object.keys(app.submissions ?? {}).length > 0;
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
                          <button onClick={() => openReview(app)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
                            <Eye className="h-3.5 w-3.5" />مراجعة{hasLinks ? " الروابط" : ""}
                          </button>
                        )}
                        {app.status === "approved" && !cert && (
                          <button onClick={() => issue.mutateAsync(app.id)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"><Send className="h-3.5 w-3.5" />إصدار وإرسال</button>
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

      <AppDialog open={!!reviewTarget} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <AppDialogContent className="max-w-2xl">
          <AppDialogHeader>
            <AppDialogTitle>مراجعة طلب الشهادة</AppDialogTitle>
            <AppDialogDescription>راجع روابط الاختبار/المشروع المقدمة من الطالب، ثم وافق على الطلب أو ارفضه.</AppDialogDescription>
          </AppDialogHeader>

          <div className="space-y-3 py-2">
            {Object.keys(submissions).length === 0 && (
              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                لا توجد روابط مرفقة بهذا الطلب (ربما اكتفى الطالب بالاختبار من بنك الاختبارات).
              </div>
            )}
            {Object.entries(submissions).map(([id, url]) => {
              const requirement = requirementSnapshot.find((item) => String(item.id) === id);
              return (
                <div key={id} className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm">{requirement?.title ?? "متطلب الشهادة"}</div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted">{requirement?.type === "project" ? "مشروع" : "اختبار"}</span>
                  </div>
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary break-all">
                    <Link2 className="h-3.5 w-3.5" /> {url} <ExternalLink className="h-3 w-3" />
                  </a>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setDecisions((current) => ({ ...current, [id]: "approved" }))}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${decisions[id] !== "rejected" ? "bg-green-600 text-white" : "border"}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> مقبول
                    </button>
                    <button
                      onClick={() => setDecisions((current) => ({ ...current, [id]: "rejected" }))}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${decisions[id] === "rejected" ? "bg-red-600 text-white" : "border"}`}
                    >
                      <XCircle className="h-3.5 w-3.5" /> مرفوض
                    </button>
                  </div>
                </div>
              );
            })}
            <label className="block text-sm font-medium">
              ملاحظة للطالب (اختياري)
              <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
            </label>
          </div>

          <AppDialogFooter className="gap-2">
            <button onClick={() => setReviewTarget(null)} className="rounded-lg border px-4 py-2 text-sm font-bold">إلغاء</button>
            <button
              onClick={() => submitReview("reject")}
              disabled={reject.isPending || approve.isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" /> رفض الطلب
            </button>
            <button
              onClick={() => submitReview("approve")}
              disabled={approve.isPending || reject.isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" /> موافقة وإصدار
            </button>
          </AppDialogFooter>
        </AppDialogContent>
      </AppDialog>

      <CertificateViewDialog certificate={previewCert} platformName={platformName} platformLogoUrl={platformLogo} onClose={() => setPreviewCert(null)} />
    </div>
  );
}

const requirementIcons: Record<CertificateRequirementType, typeof ClipboardList> = {
  exam_bank: ClipboardList,
  exam_link: Link2,
  project: FolderOpen,
};

function useCertificateExams(instructorToken: string | null): ExamOption[] {
  const tenantExams = useExams({ status: "published", perPage: 100 });
  const instructorExams = useQuery({
    queryKey: ["instructor-exams-for-certificates", instructorToken],
    queryFn: async (): Promise<ExamOption[]> => {
      if (!instructorToken) return [];
      const response = await instructorApi.listExams(instructorToken);
      return (response.data ?? []).map((exam) => ({ id: exam.id, title: exam.title }));
    },
    enabled: !!instructorToken,
  });

  if (instructorToken) return instructorExams.data ?? [];
  return (tenantExams.data?.data ?? []).map((exam) => ({ id: exam.id, title: exam.title }));
}

function RulesSection({ instructorToken }: { instructorToken: string | null }) {
  const tenantCourses = useAdminCourses();
  const courseQuery = useCourses(undefined, instructorToken);
  const { data: templates = [] } = useCertificateTemplates();
  const exams = useCertificateExams(instructorToken);
  const [courseId, setCourseId] = useState<string>("");
  const { data: rule, isLoading } = useCourseCertificateRule(courseId || null);
  const courses: CourseOption[] = instructorToken
    ? (courseQuery.data?.data ?? [])
    : (tenantCourses.data ?? []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">شروط الشهادات للدورات</h2>
      <div className="rounded-2xl border bg-card p-5 space-y-5">
        <label className="text-sm font-medium block">اختر الدورة
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">-- اختر دورة --</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </label>

        {courseId && isLoading && <div className="text-sm text-muted-foreground">جارٍ التحميل...</div>}

        {courseId && !isLoading && (
          <RuleFormPanel
            key={`${courseId}:${rule?.id ?? "new"}`}
            courseId={courseId}
            rule={rule ?? null}
            templates={templates}
            exams={exams}
          />
        )}
      </div>
    </div>
  );
}

function RuleFormPanel({
  courseId,
  rule,
  templates,
  exams,
}: {
  courseId: string;
  rule: CourseCertificateRule | null;
  templates: CertificateTemplate[];
  exams: ExamOption[];
}) {
  const updateRule = useUpdateCourseCertificateRule();
  const [form, setForm] = useState<RuleForm>(() => ruleToForm(rule));

  const addRequirement = (type: CertificateRequirementType) => {
    setForm((current) => ({
      ...current,
      requirements: [
        ...current.requirements,
        {
          id: -(Date.now() + current.requirements.length),
          type,
          title: type === "project" ? "مشروع التسليم" : type === "exam_link" ? "اختبار خارجي" : "اختبار الشهادة",
          description: null,
          exam_id: type === "exam_bank" && exams[0] ? Number(exams[0].id) : null,
          exam_title: null,
          exam_link: null,
          required_score: type === "exam_bank" ? 70 : null,
          sort_order: current.requirements.length,
        },
      ],
    }));
  };

  const patchRequirement = (id: number, patch: Partial<CertificateRequirement>) => {
    setForm((current) => ({
      ...current,
      requirements: current.requirements.map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
  };

  const save = async () => {
    await updateRule.mutateAsync({
      courseId,
      payload: {
        enabled: form.enabled,
        certificate_template_id: form.certificate_template_id ? Number(form.certificate_template_id) : null,
        minimum_completion_percentage: Number(form.minimum_completion_percentage),
        require_course_completion: form.require_course_completion,
        show_instructor_signature: form.show_instructor_signature,
        manager_signature_name: form.manager_signature_name || null,
        manager_signature_title: form.manager_signature_title || null,
        manager_signature_url: form.manager_signature_url || null,
        instructor_signature_url: form.instructor_signature_url || null,
        requirements: form.requirements.map((item, index) => ({
          id: item.id > 0 ? item.id : undefined,
          type: item.type,
          title: item.title,
          description: item.description,
          exam_id: item.type === "exam_bank" ? item.exam_id : null,
          exam_link: item.type === "exam_link" ? item.exam_link : null,
          required_score: item.type === "exam_bank" ? Number(item.required_score ?? 70) : null,
          sort_order: index,
        })),
      },
    });
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> تفعيل الشهادة لهذه الدورة</label>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.require_course_completion} onChange={(e) => setForm({ ...form, require_course_completion: e.target.checked })} /> يتطلب إكمال الدورة</label>
        <label className="text-sm font-medium">القالب
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.certificate_template_id} onChange={(e) => setForm({ ...form, certificate_template_id: e.target.value })}>
            <option value="">-- اختر قالبًا --</option>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.name} ({template.status})</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">نسبة الإكمال المطلوبة (%)
          <input type="number" min={1} max={100} className="mt-1 w-full rounded-lg border px-3 py-2" value={form.minimum_completion_percentage} onChange={(e) => setForm({ ...form, minimum_completion_percentage: Number(e.target.value) })} />
        </label>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-bold text-sm">المتطلبات (اختبار ومشروع معًا ممكن)</div>
          <div className="flex flex-wrap gap-2">
            {(["exam_bank", "exam_link", "project"] as CertificateRequirementType[]).map((type) => {
              const Icon = requirementIcons[type];
              const label = type === "exam_bank" ? "اختبار من المكتبة" : type === "exam_link" ? "لينك اختبار" : "مشروع";
              return (
                <button key={type} onClick={() => addRequirement(type)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-muted">
                  <Icon className="h-3.5 w-3.5" /><Plus className="h-3 w-3" /> {label}
                </button>
              );
            })}
          </div>
        </div>

        {form.requirements.length === 0 && <div className="text-xs text-muted-foreground">لم تضف أي متطلب بعد. أضف اختبارًا ومشروعًا مثلًا.</div>}

        {form.requirements.map((req, index) => {
          const Icon = requirementIcons[req.type];
          return (
            <div key={req.id} className="rounded-xl border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold"><Icon className="h-4 w-4" /> المتطلب {index + 1}</div>
                <button
                  onClick={() => setForm((current) => ({ ...current, requirements: current.requirements.filter((item) => item.id !== req.id) }))}
                  className="text-red-600 hover:text-red-700"
                  aria-label="حذف المتطلب"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs font-medium">نوع المتطلب
                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={req.type}
                    onChange={(e) => patchRequirement(req.id, { type: e.target.value as CertificateRequirementType })}
                  >
                    <option value="exam_bank">اختبار من المكتبة</option>
                    <option value="exam_link">لينك اختبار خارجي</option>
                    <option value="project">مشروع (لينك)</option>
                  </select>
                </label>
                <label className="text-xs font-medium md:col-span-2">العنوان
                  <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={req.title ?? ""} onChange={(e) => patchRequirement(req.id, { title: e.target.value })} />
                </label>
              </div>
              {req.type === "exam_bank" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-medium">الاختبار
                    <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={req.exam_id ?? ""} onChange={(e) => patchRequirement(req.id, { exam_id: Number(e.target.value) })}>
                      <option value="">-- اختر اختبارًا --</option>
                      {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-medium">درجة النجاح المطلوبة (%)
                    <input type="number" min={0} max={100} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={req.required_score ?? 70} onChange={(e) => patchRequirement(req.id, { required_score: Number(e.target.value) })} />
                  </label>
                </div>
              )}
              {req.type === "exam_link" && (
                <label className="text-xs font-medium block">لينك الاختبار (يُفتح ويُراجع يدويًا)
                  <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" dir="ltr" placeholder="https://..." value={req.exam_link ?? ""} onChange={(e) => patchRequirement(req.id, { exam_link: e.target.value })} />
                </label>
              )}
              <label className="text-xs font-medium block">وصف للطالب (اختياري)
                <textarea rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={req.description ?? ""} onChange={(e) => patchRequirement(req.id, { description: e.target.value })} />
              </label>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="font-bold text-sm">التوقيعات والشهادة</div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.show_instructor_signature} onChange={(e) => setForm({ ...form, show_instructor_signature: e.target.checked })} />
          إظهار توقيع المدرب على الشهادة
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium">اسم المدير الموقّع
            <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.manager_signature_name} onChange={(e) => setForm({ ...form, manager_signature_name: e.target.value })} />
          </label>
          <label className="text-xs font-medium">صفة المدير الموقّع
            <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.manager_signature_title} onChange={(e) => setForm({ ...form, manager_signature_title: e.target.value })} />
          </label>
          <ImageUploadField
            label="صورة توقيع المدير"
            value={form.manager_signature_url || null}
            onChange={(url) => setForm({ ...form, manager_signature_url: url ?? "" })}
            shape="wide"
            hint="بتُستخدم في كل شهادات الدورة."
          />
          <ImageUploadField
            label="صورة توقيع المدرب"
            value={form.instructor_signature_url || null}
            onChange={(url) => setForm({ ...form, instructor_signature_url: url ?? "" })}
            shape="wide"
            hint="بتظهر فقط لو «إظهار توقيع المدرب» مفعّل."
          />
        </div>
      </div>

      <button onClick={save} disabled={updateRule.isPending} className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold disabled:opacity-60">
        <Save className="inline h-4 w-4 ml-1" />حفظ الشروط
      </button>
    </>
  );
}
