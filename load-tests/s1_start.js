// S1: Session-start contention.
// Exercises the P1.1 / P1.2 path: many concurrent starts against the same
// exam-backed lesson. With P1, no shared exam row is locked and each user gets
// exactly one active attempt. Watch for 422 "lesson not accessible" (auth/env)
// vs 200/201 and for any deadlock/timeout spikes that would indicate residual
// row-lock contention on MySQL.

import { scenario } from "k6/options";
import { sleep } from "k6";
import { shared, authHeaders, startSession, checkSession } from "./common.js";

export const options = {
  scenarios: {
    start: {
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
    http_req_duration: ["p(95)<1500"],
    http_req_failed: ["rate<0.02"],
  },
};

export default function () {
  const res = startSession();
  checkSession(res);
  sleep(1);
}
