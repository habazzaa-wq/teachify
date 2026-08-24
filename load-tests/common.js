/**
 * k6 load-test plan for the Teachify P1 (Exam Concurrency) changes.
 *
 * These scripts target the exam-session HTTP surface that P1 was designed to
 * protect: starting sessions, autosaving answers, submitting, and reading
 * results under concurrency. They are NOT wired into CI and require a running
 * API instance + a test tenant seeded with a published exam-backed lesson.
 *
 * MySQL-level lock behavior (the thing P1 removes) can only be validated here,
 * against a real MySQL backend. The SQLite test suite cannot reproduce it.
 *
 * Shared environment variables (all required unless marked optional):
 *   BASE_URL       e.g. http://localhost:8000
 *   X_TENANT_ID    tenant id header value
 *   AUTH_TOKEN     a valid bearer token for a student role in the tenant
 *   LESSON_ID      lesson id whose attached exam should be exercised
 *   COURSE_ID      course id (used by S1 enroll step if needed) (optional)
 *   TARGET_VUS     optional ramp VUs (default per-script)
 *   DURATION       optional load duration, e.g. 2m (default per-script)
 *
 * Run example:
 *   k6 run -e BASE_URL=http://localhost:8000 -e X_TENANT_ID=1 \
 *          -e AUTH_TOKEN=<token> -e LESSON_ID=12 load-tests/s1_start.js
 */

import http from "k6/http";
import { check } from "k6";

export const shared = {
  baseUrl: __ENV.BASE_URL || "http://localhost:8000",
  tenantId: __ENV.X_TENANT_ID || "1",
  token: __ENV.AUTH_TOKEN || "",
  lessonId: __ENV.LESSON_ID || "1",
  courseId: __ENV.COURSE_ID || "1",
  targetVUs: parseInt(__ENV.TARGET_VUS || "50", 10),
  duration: __ENV.DURATION || "1m",
};

export function authHeaders() {
  return {
    "X-Tenant-ID": shared.tenantId,
    Authorization: `Bearer ${shared.token}`,
    "Content-Type": "application/json",
  };
}

export function startSession() {
  return http.post(
    `${shared.baseUrl}/api/v1/lessons/${shared.lessonId}/exam-sessions/start`,
    {},
    { headers: authHeaders() },
  );
}

export function checkSession(res) {
  check(res, {
    "start status 200/201": (r) => r.status === 200 || r.status === 201,
  });
  return res.json("data.attempt.id");
}
