"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppButton, AppCard, AppCardContent, AppCardHeader, AppCardTitle, AppLoadingState, AppErrorState, AppSwitch } from "@/components/ui";
import { api } from "@/services/api";
import { toast } from "sonner";

const TYPES = [
  { type: "session.scheduled", label: "جدولة جلسة" },
  { type: "session.rescheduled", label: "إعادة جدولة جلسة" },
  { type: "session.cancelled", label: "إلغاء جلسة" },
  { type: "session.reminder", label: "تذكير بجلسة" },
];

export default function StudentNotificationSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["notification-preferences"], queryFn: async () => (await api.get("/notification-preferences")).data?.preferences ?? [] });
  const [prefs, setPrefs] = useState<Record<string, any>>({});
  useEffect(() => {
    const map: Record<string, any> = {};
    for (const t of TYPES) map[t.type] = { notification_type: t.type, in_app_enabled: true, email_enabled: false, whatsapp_enabled: false };
    for (const p of data ?? []) map[p.notification_type] = { ...map[p.notification_type], ...p };
    setPrefs(map);
  }, [data]);
  const save = useMutation({
    mutationFn: async () => (await api.put("/notification-preferences", { preferences: Object.values(prefs) })).data,
    onSuccess: () => { toast.success("تم حفظ التفضيلات"); qc.invalidateQueries({ queryKey: ["notification-preferences"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "فشل الحفظ"),
  });
  if (isLoading) return <AppLoadingState />;
  if (isError) return <AppErrorState onRetry={() => refetch()} />;
  return (
    <div className="mx-auto max-w-3xl p-4">
      <AppCard>
        <AppCardHeader><AppCardTitle>تفضيلات الإشعارات</AppCardTitle></AppCardHeader>
        <AppCardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">تفعيل إشعارات واتساب يعني موافقتك على استلام رسائل متعلقة بالجلسات على واتساب. يمكنك إيقافها في أي وقت.</p>
          {TYPES.map((t) => (
            <div key={t.type} className="flex items-center justify-between rounded-lg border p-3">
              <div className="font-medium">{t.label}</div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">داخل التطبيق <AppSwitch checked={!!prefs[t.type]?.in_app_enabled} onCheckedChange={(v) => setPrefs({ ...prefs, [t.type]: { ...prefs[t.type], in_app_enabled: v } })} /></label>
                <label className="flex items-center gap-2">واتساب <AppSwitch checked={!!prefs[t.type]?.whatsapp_enabled} onCheckedChange={(v) => setPrefs({ ...prefs, [t.type]: { ...prefs[t.type], whatsapp_enabled: v } })} /></label>
              </div>
            </div>
          ))}
          <div className="flex justify-end"><AppButton onClick={() => save.mutate()} loading={save.isPending}>حفظ</AppButton></div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}
