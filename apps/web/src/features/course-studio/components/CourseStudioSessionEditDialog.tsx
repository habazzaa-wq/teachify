"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AppDialog, AppDialogContent, AppDialogHeader, AppDialogTitle, AppDialogDescription,
  AppButton, AppInput, AppTextarea,
} from "@/components/ui";
import { courseSessionsApi, type SessionPayload } from "@/features/course-sessions/api";
import type { CourseSession } from "@/features/course-sessions/types";

interface Props {
  open: boolean;
  courseId: string;
  sessionId: string | null;
  onClose: () => void;
  onSaved: (session: CourseSession) => void;
}

const SESSION_TYPES = [
  { value: "live", label: "مباشرة" },
  { value: "field", label: "ميدانية" },
  { value: "offline", label: "حضورية" },
] as const;

function toLocalInput(utc?: string | null) {
  if (!utc) return "";
  const d = new Date(utc);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CourseStudioSessionEditDialog({ open, courseId, sessionId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", session_type: "live" as "live" | "field" | "offline",
    starts_at: "", ends_at: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    meeting_url: "", location_name: "", location_address: "",
  });

  useEffect(() => {
    if (!open || !sessionId) return;
    setLoading(true);
    courseSessionsApi.get(courseId, sessionId)
      .then((s) => {
        setForm({
          title: s.title ?? "",
          description: s.description ?? "",
          session_type: (s.sessionType as any) ?? "live",
          starts_at: toLocalInput(s.startsAtUtc),
          ends_at: toLocalInput(s.endsAtUtc),
          timezone: s.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          meeting_url: s.meetingUrl ?? "",
          location_name: s.locationName ?? "",
          location_address: s.locationAddress ?? "",
        });
      })
      .catch(() => toast.error("فشل تحميل بيانات الجلسة"))
      .finally(() => setLoading(false));
  }, [open, courseId, sessionId]);

  const save = async () => {
    if (!sessionId) return;
    if (!form.title.trim() || !form.starts_at || !form.ends_at) {
      toast.error("العنوان ووقت البداية والنهاية مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<SessionPayload> = {
        title: form.title.trim(),
        description: form.description || null,
        session_type: form.session_type,
        starts_at_utc: new Date(form.starts_at).toISOString(),
        ends_at_utc: new Date(form.ends_at).toISOString(),
        timezone: form.timezone || "UTC",
        meeting_url: form.meeting_url || null,
        location_name: form.location_name || null,
        location_address: form.location_address || null,
      };
      const updated = await courseSessionsApi.update(courseId, sessionId, payload);
      toast.success("تم حفظ الجلسة");
      onSaved(updated);
    } catch (e: any) {
      const msg = e?.response?.data?.message || (e?.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" ") : null) || "فشل حفظ الجلسة";
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AppDialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <AppDialogHeader>
          <AppDialogTitle>تعديل الجلسة</AppDialogTitle>
          <AppDialogDescription>عدّل بيانات الجلسة وسيتم حفظها.</AppDialogDescription>
        </AppDialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-studio-fg-muted"><Loader2 className="h-5 w-5 animate-spin me-2" />جاري التحميل...</div>
        ) : (
          <div className="p-4 pt-2 space-y-3">
            <div><label className="block text-sm font-medium mb-1">عنوان الجلسة</label><AppInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium mb-1">الوصف</label><AppTextarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div>
              <label className="block text-sm font-medium mb-1">نوع الجلسة</label>
              <select className="w-full rounded-md border border-studio-border bg-transparent p-2 text-sm" value={form.session_type} onChange={(e) => setForm((f) => ({ ...f, session_type: e.target.value as any }))}>
                {SESSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">البداية</label><input type="datetime-local" className="w-full rounded-md border border-studio-border bg-transparent p-2 text-sm" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium mb-1">النهاية</label><input type="datetime-local" className="w-full rounded-md border border-studio-border bg-transparent p-2 text-sm" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">المنطقة الزمنية</label><AppInput value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} /></div>
            {form.session_type === "live" ? (
              <div><label className="block text-sm font-medium mb-1">رابط الاجتماع</label><AppInput value={form.meeting_url} onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))} /></div>
            ) : (
              <>
                <div><label className="block text-sm font-medium mb-1">اسم المكان</label><AppInput value={form.location_name} onChange={(e) => setForm((f) => ({ ...f, location_name: e.target.value }))} /></div>
                <div><label className="block text-sm font-medium mb-1">عنوان المكان</label><AppInput value={form.location_address} onChange={(e) => setForm((f) => ({ ...f, location_address: e.target.value }))} /></div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="outline" onClick={onClose}>إلغاء</AppButton>
              <AppButton variant="default" onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</AppButton>
            </div>
          </div>
        )}
      </AppDialogContent>
    </AppDialog>
  );
}
