export type SessionType = "live" | "field" | "offline";
export type SessionStatus = "draft" | "scheduled" | "cancelled" | "completed";
export type AttendanceStatus = "pending" | "present" | "absent" | "late" | "excused";

export interface CourseSession {
  id: string;
  tenantId: string;
  courseId: string;
  title: string;
  description?: string | null;
  sessionType: SessionType;
  status: SessionStatus;
  startsAtUtc: string;
  endsAtUtc: string;
  timezone: string;
  meetingUrl?: string | null;
  meetingProvider?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  locationMapsUrl?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  rescheduledFromStartsAtUtc?: string | null;
  instructorTenantUserId?: string | null;
  instructor?: { id: string; name?: string; email?: string } | null;
  enrollmentsCount?: number;
  attendanceSummary?: Record<string, number> | null;
}

export interface SessionAttendanceRecord {
  id: string;
  courseSessionId: string;
  tenantUserId: string;
  status: AttendanceStatus;
  note?: string | null;
  markedAt?: string | null;
  student?: { id: string; name?: string; email?: string } | null;
  markedBy?: { id: string; name?: string; email?: string } | null;
}
