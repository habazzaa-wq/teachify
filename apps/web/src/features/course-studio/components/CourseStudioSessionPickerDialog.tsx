"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Loader2 } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppButton,
  AppInput,
  AppTextarea,
} from "@/components/ui";
import { courseSessionsApi, type SessionPayload } from "@/features/course-sessions/api";
import type { CourseSession } from "@/features/course-sessions/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  courseId: string;
  onClose: () => void;
  onSelect: (session: CourseSession) => void;
}

const SESSION_TYPES = [
  { value: "live", label: "مباشرة" },
  { value: "field", label: "ميدانية" },
  { value: "offline", label: "حضورية" },
] as const;

export function CourseStudioSessionPickerDialog({ open, courseId, onClose, onSelect }: Props) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [form, setForm] = useState({
    title: "",
    description: "",
    session_type: "live" as "live" | "field" | "offline",
    starts_at_utc: "",
    ends_at_utc: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    meeting_url: "",
    location_name: "",
  });

  useEffect(() => {
    if (!open) return;
    setMode("pick");
    setLoading(true);
    courseSessionsApi
      .list(courseId, { per_page: 100 })
      .then((res) => setSessions(res.data ?? []))
      .catch(() => toast.error("فشل تحميل الجلسات"))
      .finally(() => setLoading(false));
  }, [open, courseId]);

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => (a.startsAtUtc || "").localeCompare(b.startsAtUtc || "")),
    [sessions],
  );

  const handleCreate = async () => {
    if (!form.title.trim() || !form.starts_at_utc || !form.ends_at_utc) {
      toast.error("العنوان ووقت البداية والنهاية مطلوبان");
      return;
    }
    if (form.session_type === "live" && !form.meeting_url.trim()) {
      toast.error("رابط الاجتماع مطلوب للجلسة المباشرة");
      return;
    }
    if (form.session_type !== "live" && !form.location_name.trim()) {
      toast.error("اسم المكان مطلوب لهذا النوع من الجلسات");
      return;
    }
    setCreating(true);
    try {
      const payload: SessionPayload = {
        title: form.title.trim(),
        description: form.description || null,
        session_type: form.session_type,
        // Publishing on creation is what makes the student receive the
        // notification immediately.
        status: "scheduled",
        starts_at_utc: new Date(form.starts_at_utc).toISOString(),
        ends_at_utc: new Date(form.ends_at_utc).toISOString(),
        timezone: form.timezone || "UTC",
        meeting_url: form.meeting_url || null,
        location_name: form.location_name || null,
      };
      const session = await courseSessionsApi.create(courseId, payload);
      toast.success("تم إنشاء الجلسة وإشعار الطلاب المسجلين");
      onSelect(session);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" ") : null) ||
        "فشل إنشاء الجلسة";
      toast.error(String(msg));
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AppDialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <AppDialogHeader>
          <AppDialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            إضافة جلسة للمحتوى
          </AppDialogTitle>
          <AppDialogDescription>
            اختر جلسة موجودة أو أنشئ جلسة جديدة لإضافتها كمحتوى داخل القسم.
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="flex gap-2 px-4">
          <AppButton variant={mode === "pick" ? "default" : "outline"} size="sm" onClick={() => setMode("pick")}>
            اختيار جلسة
          </AppButton>
          <AppButton variant={mode === "create" ? "default" : "outline"} size="sm" onClick={() => setMode("create")}>
            <Plus className="h-4 w-4 me-1" />
            جلسة جديدة
          </AppButton>
        </div>

        {mode === "pick" ? (
          <div className="p-4 pt-2 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-studio-fg-muted">
                <Loader2 className="h-5 w-5 animate-spin me-2" />
                جاري التحميل...
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-8 text-sm text-studio-fg-muted">لا توجد جلسات. أنشئ جلسة جديدة.</div>
            ) : (
              sorted.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s)}
                  className="w-full text-start rounded-lg border border-studio-border p-3 hover:bg-studio-accent-soft/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-studio-fg truncate">{s.title}</div>
                      <div className="text-xs text-studio-fg-muted mt-0.5">
                        {s.sessionType} · {s.status} · {s.startsAtUtc ? new Date(s.startsAtUtc).toLocaleString("ar-SA") : ""}
                      </div>
                    </div>
                    <span className="text-xs text-studio-fg-muted shrink-0">{s.timezone}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 pt-2 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">عنوان الجلسة</label>
              <AppInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الوصف</label>
              <AppTextarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نوع الجلسة</label>
              <select className="w-full rounded-md border border-studio-border bg-transparent p-2 text-sm" value={form.session_type} onChange={(e) => setForm((f) => ({ ...f, session_type: e.target.value as any }))}>
                {SESSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">البداية</label>
                <input type="datetime-local" className="w-full rounded-md border border-studio-border bg-transparent p-2 text-sm" value={form.starts_at_utc} onChange={(e) => setForm((f) => ({ ...f, starts_at_utc: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">النهاية</label>
                <input type="datetime-local" className="w-full rounded-md border border-studio-border bg-transparent p-2 text-sm" value={form.ends_at_utc} onChange={(e) => setForm((f) => ({ ...f, ends_at_utc: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المنطقة الزمنية</label>
              <AppInput value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} />
            </div>
            {form.session_type === "live" ? (
              <div>
                <label className="block text-sm font-medium mb-1">رابط الاجتماع</label>
                <AppInput value={form.meeting_url} onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))} />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">اسم المكان</label>
                <AppInput value={form.location_name} onChange={(e) => setForm((f) => ({ ...f, location_name: e.target.value }))} />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <AppButton variant="outline" onClick={onClose}>إلغاء</AppButton>
              <AppButton variant="default" onClick={handleCreate} disabled={creating}>
                {creating ? "جاري الإنشاء..." : "إنشاء وإضافة"}
              </AppButton>
            </div>
          </div>
        )}
      </AppDialogContent>
    </AppDialog>
  );
}
