"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { courseSessionsApi, type SessionPayload } from "../api";
import type { AttendanceStatus } from "../types";

const key = (courseId: string) => ["course-sessions", courseId];
export function useCourseSessions(courseId: string) {
  return useQuery({ queryKey: key(courseId), queryFn: () => courseSessionsApi.list(courseId), enabled: !!courseId });
}
export function useCreateCourseSession(courseId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: SessionPayload) => courseSessionsApi.create(courseId, payload), onSuccess: () => qc.invalidateQueries({ queryKey: key(courseId) }) });
}
export function useUpdateCourseSession(courseId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ sessionId, payload }: { sessionId: string; payload: Partial<SessionPayload> }) => courseSessionsApi.update(courseId, sessionId, payload), onSuccess: () => qc.invalidateQueries({ queryKey: key(courseId) }) });
}
export function useDeleteCourseSession(courseId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (sessionId: string) => courseSessionsApi.remove(courseId, sessionId), onSuccess: () => qc.invalidateQueries({ queryKey: key(courseId) }) });
}
export function useSessionAction(courseId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ sessionId, action, reason }: { sessionId: string; action: "schedule" | "cancel" | "complete"; reason?: string }) => {
    if (action === "schedule") return courseSessionsApi.schedule(courseId, sessionId);
    if (action === "cancel") return courseSessionsApi.cancel(courseId, sessionId, reason);
    return courseSessionsApi.complete(courseId, sessionId);
  }, onSuccess: () => qc.invalidateQueries({ queryKey: key(courseId) }) });
}
export function useSessionEnrollments(courseId: string, sessionId: string | null) {
  return useQuery({ queryKey: ["course-session-enrollments", courseId, sessionId], queryFn: () => courseSessionsApi.enrollments(courseId, sessionId!), enabled: !!courseId && !!sessionId });
}
export function useMarkAttendance(courseId: string, sessionId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ tenantUserId, status, note }: { tenantUserId: string; status: AttendanceStatus; note?: string }) => courseSessionsApi.markAttendance(courseId, sessionId, tenantUserId, status, note), onSuccess: () => { qc.invalidateQueries({ queryKey: ["course-session-enrollments", courseId, sessionId] }); qc.invalidateQueries({ queryKey: key(courseId) }); } });
}
