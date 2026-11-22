"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppButton, AppInput, AppTextarea } from "@/components/ui";
import { courseSessionsApi } from "../api";
import { useCourseSessions, useCreateCourseSession, useDeleteCourseSession, useMarkAttendance, useSessionAction, useSessionEnrollments, useUpdateCourseSession } from "../hooks/useCourseSessions";
import type { AttendanceStatus, CourseSession, SessionType } from "../types";

const typeLabels: Record<SessionType, string> = { live: "مباشر", field: "ميداني", offline: "حضوري" };
const statusLabels: Record<string, string> = { draft: "مسودة", scheduled: "مجدول", cancelled: "ملغي", completed: "مكتمل" };
const attendanceStatuses: AttendanceStatus[] = ["pending", "present", "absent", "late", "excused"];

function toLocalInput(utc?: string) {
  if (!utc) return "";
  const d = new Date(utc);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toUtcIso(local: string) { return new Date(local).toISOString(); }

export function CourseSessionsPanel({ courseId }: { courseId: string }) {
  const { data, isLoading } = useCourseSessions(courseId);
  const createSession = useCreateCourseSession(courseId);
  const updateSession = useUpdateCourseSession(courseId);
  const deleteSession = useDeleteCourseSession(courseId);
  const action = useSessionAction(courseId);
  const [editing, setEditing] = useState<CourseSession | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ title: "", description: "", session_type: "live", status: "draft", starts_at: "", ends_at: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", meeting_url: "", location_name: "", location_address: "", location_maps_url: "" });

  const sessions = data?.data ?? [];
  const reset = () => setForm({ title: "", description: "", session_type: "live", status: "draft", starts_at: "", ends_at: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", meeting_url: "", location_name: "", location_address: "", location_maps_url: "" });

  const startEdit = (s: CourseSession) => {
    setEditing(s);
    setForm({ title: s.title, description: s.description ?? "", session_type: s.sessionType, status: s.status, starts_at: toLocalInput(s.startsAtUtc), ends_at: toLocalInput(s.endsAtUtc), timezone: s.timezone || "UTC", meeting_url: s.meetingUrl ?? "", location_name: s.locationName ?? "", location_address: s.locationAddress ?? "", location_maps_url: s.locationMapsUrl ?? "" });
    setOpenForm(true);
  };

  const submit = async () => {
    const payload = {
      title: form.title,
      description: form.description || null,
      session_type: form.session_type,
      status: form.status,
      starts_at_utc: toUtcIso(form.starts_at),
      ends_at_utc: toUtcIso(form.ends_at),
      timezone: form.timezone || "UTC",
      meeting_url: form.meeting_url || null,
      location_name: form.location_name || null,
      location_address: form.location_address || null,
      location_maps_url: form.location_maps_url || null,
    };
    try {
      if (editing) await updateSession.mutateAsync({ sessionId: editing.id, payload });
      else await createSession.mutateAsync(payload as any);
      toast.success(editing ? "تم تحديث الجلسة" : "تم إنشاء الجلسة");
      setOpenForm(false); setEditing(null); reset();
    } catch (e: any) { toast.error(e?.response?.data?.message || "فشل حفظ الجلسة"); }
  };

  return (
    <section className="mx-auto mt-6 max-w-6xl rounded-xl border bg-background p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">الجلسات</h2>
          <p className="text-sm text-muted-foreground">إدارة الجلسات المباشرة والميدانية والحضورية</p>
        </div>
        <AppButton onClick={() => { reset(); setEditing(null); setOpenForm(true); }}>إضافة جلسة</AppButton>
      </div>

      {openForm && (
        <div className="mb-4 grid gap-3 rounded-lg border p-4 md:grid-cols-2">
          <label className="text-sm">العنوان<AppInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="text-sm">النوع
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value })}>
              <option value="live">مباشر</option><option value="field">ميداني</option><option value="offline">حضوري</option>
            </select>
          </label>
          <label className="text-sm">الحالة
            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">مسودة</option><option value="scheduled">مجدول</option>
            </select>
          </label>
          <label className="text-sm">المنطقة الزمنية<AppInput value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></label>
          <label className="text-sm">البداية<AppInput type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
          <label className="text-sm">النهاية<AppInput type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></label>
          <label className="text-sm md:col-span-2">الوصف<AppTextarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          {form.session_type === "live" && <label className="text-sm md:col-span-2">رابط الاجتماع<AppInput value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} /></label>}
          {form.session_type !== "live" && <>
            <label className="text-sm">اسم المكان<AppInput value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} /></label>
            <label className="text-sm">رابط الخريطة<AppInput value={form.location_maps_url} onChange={(e) => setForm({ ...form, location_maps_url: e.target.value })} /></label>
            <label className="text-sm md:col-span-2">العنوان<AppInput value={form.location_address} onChange={(e) => setForm({ ...form, location_address: e.target.value })} /></label>
          </>}
          <div className="md:col-span-2 flex gap-2">
            <AppButton onClick={submit} loading={createSession.isPending || updateSession.isPending}>حفظ</AppButton>
            <AppButton variant="ghost" onClick={() => { setOpenForm(false); setEditing(null); }}>إلغاء</AppButton>
          </div>
        </div>
      )}

      {isLoading ? <div className="text-sm text-muted-foreground">جاري التحميل...</div> : sessions.length === 0 ? <div className="text-sm text-muted-foreground">لا توجد جلسات</div> : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{s.title} <span className="text-xs text-muted-foreground">({typeLabels[s.sessionType]} / {statusLabels[s.status] || s.status})</span></div>
                  <div className="text-xs text-muted-foreground">{new Date(s.startsAtUtc).toLocaleString()} - {new Date(s.endsAtUtc).toLocaleString()} ({s.timezone})</div>
                  {s.meetingUrl && <a className="text-xs text-primary underline" href={s.meetingUrl} target="_blank" rel="noreferrer">رابط الاجتماع</a>}
                  {s.locationName && <div className="text-xs text-muted-foreground">{s.locationName} {s.locationAddress ? `- ${s.locationAddress}` : ""}</div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <AppButton variant="outline" onClick={() => startEdit(s)}>تعديل</AppButton>
                  {s.status === "draft" && <AppButton variant="outline" onClick={() => action.mutate({ sessionId: s.id, action: "schedule" })}>جدولة</AppButton>}
                  {s.status === "scheduled" && <AppButton variant="outline" onClick={() => action.mutate({ sessionId: s.id, action: "complete" })}>إكمال</AppButton>}
                  {(s.status === "draft" || s.status === "scheduled") && <AppButton variant="outline" onClick={() => { const reason = prompt("سبب الإلغاء (اختياري)"); action.mutate({ sessionId: s.id, action: "cancel", reason: reason || undefined }); }}>إلغاء الجلسة</AppButton>}
                  <AppButton variant="outline" onClick={() => setAttendanceSessionId(attendanceSessionId === s.id ? null : s.id)}>الحضور</AppButton>
                  <AppButton variant="ghost" onClick={() => { if (confirm("حذف الجلسة؟")) deleteSession.mutate(s.id); }}>حذف</AppButton>
                </div>
              </div>
              {attendanceSessionId === s.id && <SessionAttendancePanel courseId={courseId} sessionId={s.id} />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SessionAttendancePanel({ courseId, sessionId }: { courseId: string; sessionId: string }) {
  const { data, isLoading } = useSessionEnrollments(courseId, sessionId);
  const mark = useMarkAttendance(courseId, sessionId);
  const rows = data?.data ?? [];
  return (
    <div className="mt-3 rounded-md border p-3">
      <div className="mb-2 text-sm font-medium">الحضور</div>
      {isLoading ? <div className="text-xs text-muted-foreground">جاري التحميل...</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-right text-muted-foreground"><th className="p-2">الطالب</th><th className="p-2">الحالة</th><th className="p-2">ملاحظة</th><th className="p-2">إجراء</th></tr></thead>
            <tbody>
              {rows.map((r: any) => <AttendanceRow key={r.id} row={r} onMark={(status, note) => mark.mutate({ tenantUserId: r.tenantUserId, status, note })} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AttendanceRow({ row, onMark }: { row: any; onMark: (status: AttendanceStatus, note?: string) => void }) {
  const [status, setStatus] = useState<AttendanceStatus>((row.attendance?.status ?? "pending") as AttendanceStatus);
  const [note, setNote] = useState<string>(row.attendance?.note ?? "");
  return (
    <tr className="border-t">
      <td className="p-2">{row.student?.name || row.tenantUserId}</td>
      <td className="p-2">
        <select className="rounded border px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)}>
          {attendanceStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td className="p-2"><input className="w-full rounded border px-2 py-1" value={note} onChange={(e) => setNote(e.target.value)} /></td>
      <td className="p-2"><AppButton variant="outline" onClick={() => onMark(status, note)}>حفظ</AppButton></td>
    </tr>
  );
}
