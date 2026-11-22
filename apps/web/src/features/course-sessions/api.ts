import { api } from "@/services/api";
import type { AttendanceStatus, CourseSession, SessionAttendanceRecord, SessionStatus, SessionType } from "./types";

export interface SessionPayload {
  title: string;
  description?: string | null;
  session_type: SessionType;
  status?: SessionStatus;
  starts_at_utc: string;
  ends_at_utc: string;
  timezone?: string;
  instructor_tenant_user_id?: number | null;
  meeting_url?: string | null;
  location_name?: string | null;
  location_address?: string | null;
  location_maps_url?: string | null;
  cancellation_reason?: string | null;
}

const base = (courseId: string) => `/courses/${courseId}/sessions`;

export const courseSessionsApi = {
  async list(courseId: string, params?: Record<string, any>) {
    const { data } = await api.get(base(courseId), { params });
    return data as { data: CourseSession[]; meta: any };
  },
  async create(courseId: string, payload: SessionPayload) {
    const { data } = await api.post(base(courseId), payload);
    return data.data as CourseSession;
  },
  async update(courseId: string, sessionId: string, payload: Partial<SessionPayload>) {
    const { data } = await api.put(`${base(courseId)}/${sessionId}`, payload);
    return data.data as CourseSession;
  },
  async remove(courseId: string, sessionId: string) {
    await api.delete(`${base(courseId)}/${sessionId}`);
  },
  async schedule(courseId: string, sessionId: string) {
    const { data } = await api.post(`${base(courseId)}/${sessionId}/schedule`);
    return data.data as CourseSession;
  },
  async cancel(courseId: string, sessionId: string, reason?: string) {
    const { data } = await api.post(`${base(courseId)}/${sessionId}/cancel`, { cancellation_reason: reason });
    return data.data as CourseSession;
  },
  async complete(courseId: string, sessionId: string) {
    const { data } = await api.post(`${base(courseId)}/${sessionId}/complete`);
    return data.data as CourseSession;
  },
  async enrollments(courseId: string, sessionId: string) {
    const { data } = await api.get(`${base(courseId)}/${sessionId}/enrollments`);
    return data as { data: any[]; meta: any };
  },
  async stats(courseId: string, sessionId: string) {
    const { data } = await api.get(`${base(courseId)}/${sessionId}/statistics`);
    return data.data as Record<string, number>;
  },
  async attendance(courseId: string, sessionId: string) {
    const { data } = await api.get(`${base(courseId)}/${sessionId}/attendance`);
    return data as { data: SessionAttendanceRecord[]; meta: any };
  },
  async myAttendance(courseId: string, sessionId: string) {
    const { data } = await api.get(`${base(courseId)}/${sessionId}/attendance/me`);
    return data.data as SessionAttendanceRecord | null;
  },
  async markAttendance(courseId: string, sessionId: string, tenantUserId: string, status: AttendanceStatus, note?: string) {
    const { data } = await api.post(`${base(courseId)}/${sessionId}/attendance/${tenantUserId}`, { status, note });
    return data.data as SessionAttendanceRecord;
  },
  async bulkMarkAttendance(courseId: string, sessionId: string, attendances: Array<{ tenant_user_id: number; status: AttendanceStatus; note?: string }>) {
    const { data } = await api.post(`${base(courseId)}/${sessionId}/attendance/bulk`, { attendances });
    return data.data as SessionAttendanceRecord[];
  },
};
