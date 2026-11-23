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

export default function MailSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tenant-mail-settings"],
    queryFn: async () => (await api.get("/tenant/mail-settings")).data?.data ?? null,
  });

  const [form, setForm] = useState({
    is_enabled: false, mailer: "smtp", host: "", port: 587, username: "",
    password: "", encryption: "tls", from_address: "", from_name: "",
  });

  useEffect(() => {
    if (data) {
      setForm((f) => ({
        ...f,
        is_enabled: !!data.isEnabled,
        mailer: data.mailer || "smtp",
        host: data.host || "",
        port: data.port || 587,
        username: data.username || "",
        encryption: data.encryption || "tls",
        from_address: data.fromAddress || "",
        from_name: data.fromName || "",
        password: "",
      }));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        is_enabled: !!form.is_enabled,
        mailer: form.mailer,
        host: form.host,
        port: Number(form.port) || 587,
        username: form.username,
        encryption: form.encryption,
        from_address: form.from_address,
        from_name: form.from_name,
      };
      if (form.password) payload.password = form.password;
      return (await api.put("/tenant/mail-settings", payload)).data;
    },
    onSuccess: () => {
      toast.success("تم حفظ إعدادات البريد");
      qc.invalidateQueries({ queryKey: ["tenant-mail-settings"] });
      setForm((f) => ({ ...f, password: "" }));
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "فشل حفظ الإعدادات"),
  });

  const test = useMutation({
    mutationFn: async () => (await api.post("/tenant/mail-settings/test")).data,
    onSuccess: (res) => toast.success(res?.data?.configured ? "الإعدادات مكتملة" : "الإعدادات غير مكتملة"),
    onError: (e: any) => toast.error(e?.response?.data?.message || "فشل الاختبار"),
  });

  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;

  return (
    <AppPage maxWidth="lg">
      <AppPageHeader title="إعدادات البريد الإلكتروني" description="اضبط إعدادات SMTP لإرسال إشعارات البريد للطلاب." />
      <AppDivider className="mb-8" />
      <AppCard>
        <AppCardHeader>
          <AppCardTitle>إعدادات SMTP</AppCardTitle>
          <AppCardDescription>لن يتم عرض كلمة المرور بعد الحفظ. اتركها فارغة للإبقاء على القيمة الحالية.</AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <div className="text-sm font-medium">تفعيل البريد</div>
              <div className="text-xs text-muted-foreground">الحالة: {data?.status || "inactive"}</div>
            </div>
            <AppSwitch checked={!!form.is_enabled} onCheckedChange={(v: boolean) => setForm({ ...form, is_enabled: v })} />
          </div>

          <Field label="المضيف (SMTP Host)" value={form.host} onChange={(v) => setForm({ ...form, host: v })} placeholder="smtp.gmail.com" dir="ltr" />
          <Field label="المنفذ (Port)" value={String(form.port)} onChange={(v) => setForm({ ...form, port: Number(v) || 587 })} placeholder="587" dir="ltr" />
          <Field label="اسم المستخدم" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="user@gmail.com" dir="ltr" />
          <Field label="كلمة المرور" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder={data?.passwordConfigured ? "مهيأة - اكتب قيمة جديدة للتغيير" : "كلمة مرور SMTP / App Password"} dir="ltr" />
          <Field label="التشفير (tls/ssl)" value={form.encryption} onChange={(v) => setForm({ ...form, encryption: v })} placeholder="tls" dir="ltr" />
          <Field label="البريد المرسل (From Address)" value={form.from_address} onChange={(v) => setForm({ ...form, from_address: v })} placeholder="noreply@example.com" dir="ltr" />
          <Field label="اسم المرسل (From Name)" value={form.from_name} onChange={(v) => setForm({ ...form, from_name: v })} placeholder="أكاديمية ..." />

          <div className="flex gap-2 justify-end">
            <AppButton variant="outline" onClick={() => test.mutate()} loading={test.isPending}>اختبار الإعدادات</AppButton>
            <AppButton onClick={() => save.mutate()} loading={save.isPending}>حفظ</AppButton>
          </div>
        </AppCardContent>
      </AppCard>
    </AppPage>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", dir }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; dir?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <AppInput type={type} dir={dir} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} placeholder={placeholder} autoComplete="new-password" />
    </div>
  );
}
