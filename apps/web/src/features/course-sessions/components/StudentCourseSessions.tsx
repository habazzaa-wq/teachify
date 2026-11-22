"use client";
import { useQuery } from "@tanstack/react-query";
import { courseSessionsApi } from "../api";

export function StudentCourseSessions({ courseId, isEnrolled }: { courseId: string; isEnrolled: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["student-course-sessions", courseId],
    queryFn: () => courseSessionsApi.list(courseId),
    enabled: !!courseId && isEnrolled,
  });
  if (!isEnrolled) return null;
  const sessions = data?.data ?? [];
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">الجلسات</h2>
      {isLoading ? <div className="text-sm text-muted-foreground">جاري التحميل...</div> : sessions.length === 0 ? <div className="text-sm text-muted-foreground">لا توجد جلسات متاحة.</div> : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{new Date(s.startsAtUtc).toLocaleString()} - {new Date(s.endsAtUtc).toLocaleString()} ({s.timezone})</div>
                  <div className="text-xs text-muted-foreground">{s.sessionType} / {s.status}</div>
                </div>
                {s.meetingUrl && s.sessionType === "live" && <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">رابط الجلسة</a>}
              </div>
              {s.locationName && <div className="mt-2 text-sm text-muted-foreground">{s.locationName} {s.locationAddress ? `- ${s.locationAddress}` : ""}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
