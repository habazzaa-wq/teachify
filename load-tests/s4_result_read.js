// S4: Result read path (claim-once + queue handoff).
// Exercises P1.2 / P1.5 read reconciliation: a GET against an attempt whose
// timer expired should flip it to "grading" and ENQUEUE the grading job rather
// than grade inline. With the sync queue in local dev the job runs inline; on
// the real queue worker it is deferred. Assert that the read returns 200 and
// status is "grading" (or already "submitted"), and that p95 stays low because
// grading is not done synchronously here.

import { sleep } from "k6";
import { check } from "k6";
import { shared, authHeaders, startSession, checkSession } from "./common.js";

export const options = {
  scenarios: {
    read: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: shared.targetVUs },
        { duration: shared.duration, target: shared.targetVUs },
        { duration: "15s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.02"],
  },
};

export default function () {
  const started = startSession();
  const attemptId = checkSession(started);
  if (!attemptId) {
    sleep(1);
    return;
  }

  const res = http.get(
    `${shared.baseUrl}/api/v1/exam-sessions/${attemptId}`,
    { headers: authHeaders() },
  );
  check(res, {
    "read ok": (r) => r.status === 200,
    "status not in_progress-after-reconcile": (r) =>
      r.json("data.attempt.status") !== "in_progress",
  });
  sleep(1);
}
