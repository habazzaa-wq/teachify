// S5: Mixed realistic ramp.
// Combines start -> autosave -> submit -> read in a single VU loop to emulate
// a live exam window with hundreds of concurrent students. This is the closest
// analog to production load; run it against MySQL to validate that P1 removed
// the write amplification / lock convoy that previously degraded under
// concurrency.

import { sleep } from "k6";
import { check } from "k6";
import { shared, authHeaders, startSession, checkSession } from "./common.js";

export const options = {
  scenarios: {
    mixed: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: shared.targetVUs },
        { duration: shared.duration, target: shared.targetVUs },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2500"],
    http_req_failed: ["rate<0.03"],
  },
};

export default function () {
  // start
  const started = startSession();
  const attemptId = checkSession(started);
  if (!attemptId) {
    sleep(1);
    return;
  }

  const headers = authHeaders();

  // autosave a few answers
  for (let i = 0; i < 3; i++) {
    http.put(
      `${shared.baseUrl}/api/v1/exam-sessions/${attemptId}/progress`,
      JSON.stringify({ currentQuestionIndex: i }),
      { headers },
    );
    sleep(0.5);
  }

  // submit
  const sub = http.post(
    `${shared.baseUrl}/api/v1/exam-sessions/${attemptId}/submit`,
    {},
    { headers },
  );
  check(sub, { "submit ok": (r) => r.status === 200 });

  // read result
  const rd = http.get(
    `${shared.baseUrl}/api/v1/exam-sessions/${attemptId}`,
    { headers },
  );
  check(rd, { "read ok": (r) => r.status === 200 });

  sleep(2);
}
