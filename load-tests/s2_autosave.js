// S2: Autosave / save-answer throughput.
// Exercises P1.4 hot paths under concurrency:
//   - PUT progress (validated/graded BEFORE lock, upsert idempotent)
//   - PUT answer  (answer upsert contention the SQLite suite cannot reproduce)
// Grading is NOT performed inline (P1 design), so this stays cheap.
//
// Fix note: the progress body MUST use snake_case `current_question_index`
// (the request validator only honours that key); `currentQuestionIndex` was
// silently ignored and the index was never persisted.

import http from "k6/http";
import { sleep } from "k6";
import { check } from "k6";
import { shared, authHeaders, startSession } from "./common.js";

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
  if (started.status !== 200 && started.status !== 201) {
    sleep(1);
    return;
  }

  const body = started.json();
  const attemptId = body?.data?.attempt?.id;
  const questions = body?.data?.questions || [];
  const examQuestionId = questions.length ? questions[0].examQuestionId : null;

  if (!attemptId) {
    sleep(1);
    return;
  }

  const headers = authHeaders();
  for (let i = 0; i < 5; i++) {
    // save progress (P1.4 validates/grades BEFORE lock, upsert idempotent)
    const prog = http.put(
      `${shared.baseUrl}/api/v1/exam-sessions/${attemptId}/progress`,
      JSON.stringify({ current_question_index: i }),
      { headers },
    );
    check(prog, { "progress 200": (r) => r.status === 200 });

    // save answer (P1.4 hot path: answer upsert contention)
    if (examQuestionId) {
      const ans = http.put(
        `${shared.baseUrl}/api/v1/exam-sessions/${attemptId}/answers/${examQuestionId}`,
        JSON.stringify({ answer: `ans-${i}` }),
        { headers },
      );
      check(ans, { "answer 200": (r) => r.status === 200 });
    }
    sleep(0.2);
  }
  sleep(1);
}
