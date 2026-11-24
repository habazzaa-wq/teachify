 "use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/api";
import {
  AppButton, AppCard, AppCardContent, AppCardDescription, AppCardHeader, AppCardTitle,
  AppDivider, AppErrorState, AppInput, AppLoadingState, AppPage, AppPageHeader, AppSwitch,
} from "@/components/ui";

export default function GoogleAuthSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tenant-google-auth-settings"],
    queryFn: async () => (await api.get("/tenant/google-auth-settings")).data?.data ?? null,
  });

  const [form, setForm] = useState({
    is_enabled: false,
    client_id: "",
    client_secret: "",
  });

  useEffect(() => {
    if (data) {
      setForm((f) => ({
        ...f,
        is_enabled: !!data.isEnabled,
        client_id: data.clientId || "",
        client_secret: "",
      }));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        is_enabled: !!form.is_enabled,
        client_id: form.client_id.trim(),
      };
      if (form.client_secret.trim()) payload.client_secret = form.client_secret.trim();
      return (await api.put("/tenant/google-auth-settings", payload)).data;
    },
    onSuccess: () => {
      toast.success("تم حفظ إعدادات تسجيل الدخول بجوجل");
      qc.invalidateQueries({ queryKey: ["tenant-google-auth-settings"] });
      setForm((f) => ({ ...f, client_secret: "" }));
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || "فشل حفظ الإعدادات";
      const status = e?.response?.status;
      toast.error(status ? `${msg} (${status})` : msg);
    },
  });

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;

  return (
    <AppPage maxWidth="lg">
      <AppPageHeader
        title="تسجيل الدخول بجوجل"
        description="فعّل تسجيل الدخول/إنشاء الحساب عبر Google لطلاب الأكاديمية من النماذج العامة."
      />
      <AppDivider className="mb-8" />

      <div className="space-y-6">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>إعدادات Google OAuth</AppCardTitle>
            <AppCardDescription>
              Client ID يُستخدم في واجهة الطالب. Client Secret اختياري لهذا التدفق الحالي، لكنه يُحفظ مشفّرًا إذا أدخلته للاستخدام المستقبلي.
            </AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <div className="text-sm font-medium">تفعيل تسجيل الدخول بجوجل</div>
                <div className="text-xs text-muted-foreground">الحالة: {data?.status === "active" ? "مفعّل" : "غير مفعّل"}</div>
              </div>
              <AppSwitch checked={!!form.is_enabled} onCheckedChange={(v: boolean) => setForm({ ...form, is_enabled: v })} />
            </div>

            <Field
              label="Google Client ID"
              value={form.client_id}
              onChange={(v) => setForm({ ...form, client_id: v })}
              placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
              dir="ltr"
            />
            <Field
              label="Google Client Secret (اختياري)"
              type="password"
              value={form.client_secret}
              onChange={(v) => setForm({ ...form, client_secret: v })}
              placeholder={data?.clientSecretConfigured ? "مهيأ - اكتب قيمة جديدة للتغيير" : "اتركه فارغًا إذا لم تحتاجه"}
              dir="ltr"
            />

            <div className="flex gap-2 justify-end">
              <AppButton onClick={() => save.mutate()} loading={save.isPending}>حفظ</AppButton>
            </div>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <AppCardTitle>من أين تجيب البيانات؟</AppCardTitle>
            <AppCardDescription>خطوات إعداد Google لأول مرة</AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <ol className="list-decimal pe-5 space-y-2">
              <li>ادخل إلى <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-primary underline">Google Cloud Console</a> وسجّل الدخول بحساب Google.</li>
              <li>من أعلى الصفحة اختر مشروعًا موجودًا أو اضغط <b>Create Project</b> لإنشاء مشروع جديد.</li>
              <li>اذهب إلى <b>APIs &amp; Services → OAuth consent screen</b>. اختر <b>External</b> (عادةً) ثم أكمل بيانات التطبيق الأساسية (اسم التطبيق، البريد، إلخ) واحفظ.</li>
              <li>اذهب إلى <b>APIs &amp; Services → Credentials</b> ثم <b>Create Credentials → OAuth client ID</b>.</li>
              <li>اختر نوع التطبيق <b>Web application</b>.</li>
              <li>في <b>Authorized JavaScript origins</b> أضف دومين الأكاديمية الذي يعمل عليه الفورم العام، مثل: <code dir="ltr" className="px-1 py-0.5 rounded bg-muted">https://your-domain.com</code> وأيضًا <code dir="ltr" className="px-1 py-0.5 rounded bg-muted">http://localhost:3000</code> أثناء التطوير إذا احتجت.</li>
              <li>بعد الإنشاء انسخ <b>Client ID</b> وضعه في الحقل أعلاه. يمكنك أيضًا نسخ <b>Client Secret</b> وحفظه (اختياري حاليًا).</li>
              <li>(اختياري لقراءة تاريخ الميلاد من Google) من <b>APIs &amp; Services → Library</b> فعّل <b>Google People API</b>. بدونها تسجيل الدخول سيعمل، لكن تاريخ الميلاد قد لا يُجلب.</li>
            </ol>
            <div className="rounded-xl border bg-muted/20 p-3 text-xs">
              ملاحظة: بعد حفظ Client ID، زر Google سيظهر تلقائيًا في فورم تسجيل الدخول وإنشاء حساب الطالب العام. إذا كان حساب Google جديدًا أو لا يوجد رقم هاتف، سيُطلب من الطالب إدخال رقم الهاتف لإكمال التسجيل.
            </div>
          </AppCardContent>
        </AppCard>
      </div>
    </AppPage>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", dir }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; dir?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <AppInput type={type} dir={dir} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
    </div>
  );
}
