// S3: Submit contention.
// Exercises P1.3: submit() takes a short freeze lock then grades OUTSIDE the
// lock, releasing the freeze on exception. This is the hot path that previously
// held the exam row lock. Watch for 200 OK, "grading"/"submitted" terminal
// status, and absence of 409/500 storms indicating lock contention on MySQL.

import { sleep } from "k6";
import { check } from "k6";
import { shared, authHeaders, startSession, checkSession } from "./common.js";

export const options = {
  scenarios: {
    submit: {
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
    http_req_duration: ["p(95)<2000"],
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

  const res = http.post(
    `${shared.baseUrl}/api/v1/exam-sessions/${attemptId}/submit`,
    {},
    { headers: authHeaders() },
  );
  check(res, {
    "submit ok": (r) => r.status === 200,
    "terminal status": (r) => {
      const s = r.json("data.attempt.status");
      return s === "submitted" || s === "grading";
    },
  });
  sleep(1);
}
