"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppButton, AppCard, AppCardContent, AppCardDescription, AppCardHeader, AppCardTitle, AppDivider, AppErrorState, AppInput, AppLoadingState, AppPage, AppPageHeader, AppSwitch } from "@/components/ui";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function WhatsAppSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tenant-whatsapp-integration"],
    queryFn: async () => (await api.get("/tenant/whatsapp-integration")).data?.data ?? null,
  });
  const [form, setForm] = useState<any>({ is_enabled: false, phone_number_id: "", business_account_id: "", access_token: "", webhook_verify_token: "", app_secret: "", sender_display_phone: "" });
  useEffect(() => {
    if (data) {
      setForm((f: any) => ({ ...f, is_enabled: !!data.isEnabled, sender_display_phone: data.senderDisplayPhone || "", phone_number_id: "", business_account_id: "", access_token: "", webhook_verify_token: "", app_secret: "" }));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { is_enabled: !!form.is_enabled, sender_display_phone: form.sender_display_phone || null };
      if (form.phone_number_id) payload.phone_number_id = form.phone_number_id;
      if (form.business_account_id) payload.business_account_id = form.business_account_id;
      if (form.access_token) payload.access_token = form.access_token;
      if (form.webhook_verify_token) payload.webhook_verify_token = form.webhook_verify_token;
      if (form.app_secret) payload.app_secret = form.app_secret;
      return (await api.put("/tenant/whatsapp-integration", payload)).data;
    },
    onSuccess: () => { toast.success("تم حفظ إعدادات واتساب"); qc.invalidateQueries({ queryKey: ["tenant-whatsapp-integration"] }); setForm((f: any) => ({ ...f, phone_number_id: "", business_account_id: "", access_token: "", webhook_verify_token: "", app_secret: "" })); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "فشل الحفظ"),
  });

  const test = useMutation({
    mutationFn: async () => (await api.post("/tenant/whatsapp-integration/test")).data,
    onSuccess: (res) => toast.success(res?.data?.configured ? "الإعدادات مهيأة" : "الإعدادات غير مكتملة"),
    onError: (e: any) => toast.error(e?.response?.data?.message || "فشل الاختبار"),
  });

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;

  return (
    <AppPage maxWidth="lg">
      <AppPageHeader title="إعدادات واتساب" description="إعداد تكامل Meta WhatsApp Cloud API الخاص بالمستأجر." />
      <AppDivider className="mb-8" />
      <AppCard>
        <AppCardHeader>
          <AppCardTitle>Meta WhatsApp Cloud API</AppCardTitle>
          <AppCardDescription>لن يتم عرض الأسرار المخزنة بعد الحفظ. اترك الحقول فارغة للإبقاء على القيم الحالية.</AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div><div className="text-sm font-medium">تفعيل واتساب</div><div className="text-xs text-muted-foreground">الحالة: {data?.status || "inactive"}</div></div>
            <AppSwitch checked={!!form.is_enabled} onCheckedChange={(v: boolean) => setForm({ ...form, is_enabled: v })} />
          </div>
          <Field label="Phone Number ID" value={form.phone_number_id} onChange={(v) => setForm({ ...form, phone_number_id: v })} placeholder={data?.phoneNumberIdConfigured ? "مهيأ - اتركه فارغًا للإبقاء" : "أدخل Phone Number ID"} />
          <Field label="Business Account ID" value={form.business_account_id} onChange={(v) => setForm({ ...form, business_account_id: v })} placeholder={data?.businessAccountIdConfigured ? "مهيأ - اتركه فارغًا للإبقاء" : "اختياري"} />
          <Field label="Access Token" type="password" value={form.access_token} onChange={(v) => setForm({ ...form, access_token: v })} placeholder={data?.accessTokenConfigured ? "مهيأ - اتركه فارغًا للإبقاء" : "أدخل Access Token"} />
          <Field label="Webhook Verify Token" type="password" value={form.webhook_verify_token} onChange={(v) => setForm({ ...form, webhook_verify_token: v })} placeholder={data?.webhookVerifyTokenConfigured ? "مهيأ - اتركه فارغًا للإبقاء" : "أدخل Verify Token"} />
          <Field label="App Secret" type="password" value={form.app_secret} onChange={(v) => setForm({ ...form, app_secret: v })} placeholder={data?.appSecretConfigured ? "مهيأ - اتركه فارغًا للإبقاء" : "اختياري للتحقق من التوقيع"} />
          <Field label="رقم المرسل المعروض" value={form.sender_display_phone} onChange={(v) => setForm({ ...form, sender_display_phone: v })} placeholder="+20..." />
          <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
            Webhook URL: <code>/api/v1/webhooks/whatsapp/{data?.tenantId || "{tenantId}"}</code>. استخدم هذا العنوان في Meta App Dashboard مع Verify Token.
          </div>
          <div className="flex gap-2 justify-end">
            <AppButton variant="outline" onClick={() => test.mutate()} loading={test.isPending}>اختبار الإعداد</AppButton>
            <AppButton onClick={() => save.mutate()} loading={save.isPending}>حفظ</AppButton>
          </div>
        </AppCardContent>
      </AppCard>
    </AppPage>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <div className="space-y-2"><label className="text-sm font-medium">{label}</label><AppInput type={type} dir="ltr" value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} placeholder={placeholder} autoComplete="new-password" /></div>;
}
