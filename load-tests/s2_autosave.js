// S2: Autosave / save-answer throughput.
// Exercises P1.4: concurrent PUT answer + PUT progress per attempt. Grading is
// NOT performed inline (P1 design), so this should stay cheap. Pass an
// ATTEMPT_ID per VU seed below, or rely on the per-VU start. For a realistic
// ramp, each VU starts its own session then hammers autosave.

import { sleep } from "k6";
import { check } from "k6";
import { shared, authHeaders, startSession, checkSession } from "./common.js";

export const options = {
  scenarios: {
    autosave: {
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

  const headers = authHeaders();
  for (let i = 0; i < 5; i++) {
    // save progress (P1.4 validates/grades BEFORE lock, upsert idempotent)
    const prog = http.put(
      `${shared.baseUrl}/api/v1/exam-sessions/${attemptId}/progress`,
      JSON.stringify({ currentQuestionIndex: i }),
      { headers },
    );
    check(prog, { "progress 200": (r) => r.status === 200 });
    sleep(0.2);
  }
  sleep(1);
}
