import { api } from "@/services/api";
import { resolveApiBaseUrl } from "@/config/env";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import type {
  ActiveExamAttempt,
  AntiCheatEvent,
  ExamSession,
  SaveProgressPayload,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Raw API responses have untyped shapes
export type Raw = Record<string, any>;

export function formatSession(raw: Raw): ExamSession {
  const attempt = raw.attempt ?? {};
  const exam = attempt.exam ?? {};

  return {
    attempt: {
      id: String(attempt.id),
      examId: String(attempt.examId),
      status: attempt.status,
      isOfficial: Boolean(attempt.isOfficial),
      isPractice: Boolean(attempt.isPractice),
      score: Number(attempt.score ?? 0),
      maxScore: Number(attempt.maxScore ?? 0),
      percentage:
        attempt.percentage === null || attempt.percentage === undefined
          ? null
          : Number(attempt.percentage),
      passed: Boolean(attempt.passed),
      durationSeconds:
        attempt.durationSeconds === null || attempt.durationSeconds === undefined
          ? null
          : Number(attempt.durationSeconds),
      currentQuestionIndex:
        attempt.currentQuestionIndex === null ||
        attempt.currentQuestionIndex === undefined
          ? null
          : Number(attempt.currentQuestionIndex),
      startedAt: attempt.startedAt ?? null,
      submittedAt: attempt.submittedAt ?? null,
      timerEndsAt: attempt.timerEndsAt ?? null,
      remainingSeconds:
        attempt.remainingSeconds === null || attempt.remainingSeconds === undefined
          ? null
          : Number(attempt.remainingSeconds),
      exam: {
        id: String(exam.id),
        title: exam.title ?? "",
        description: exam.description ?? null,
        duration:
          exam.duration === null || exam.duration === undefined
            ? null
            : Number(exam.duration),
        passingScore: Number(exam.passingScore ?? 0),
        totalPoints: Number(exam.totalPoints ?? 0),
        questionCount: Number(exam.questionCount ?? 0),
        shuffleQuestions: Boolean(exam.shuffleQuestions),
        showResults: Boolean(exam.showResults),
        showCorrectAnswers: Boolean(exam.showCorrectAnswers),
      },
    },
    questions: Array.isArray(raw.questions)
      ? raw.questions.map(formatQuestion)
      : [],
  };
}

function formatQuestion(raw: Raw): ExamSession["questions"][number] {
  const content = raw.content ?? {};

  return {
    examQuestionId: String(raw.examQuestionId),
    questionId: String(raw.questionId),
    type: raw.type,
    title: raw.title ?? "",
    description: raw.description ?? null,
    points: Number(raw.points ?? 0),
    order: Number(raw.order ?? 0),
    section: raw.section ?? null,
    content: {
      options: Array.isArray(content.options)
        ? content.options.map((option: Raw) => ({
            id: String(option.id),
            text: String(option.text ?? ""),
            correct: typeof option.correct === "boolean" ? option.correct : undefined,
          }))
        : undefined,
      correct: typeof content.correct === "string" ? content.correct : undefined,
    },
    answer: formatAnswer(raw.answer),
    answered: Boolean(raw.answered),
    isCorrect:
      raw.isCorrect === null || raw.isCorrect === undefined ? null : Boolean(raw.isCorrect),
    questionFormat: raw.questionFormat ?? "text",
    scanUrl: typeof raw.scanUrl === "string" ? raw.scanUrl : null,
    contentDocument: raw.contentDocument ?? null,
  };
}

function formatAnswer(raw: unknown): ExamSession["questions"][number]["answer"] {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.map((id) => String(id));
  return null;
}

export const examSessionService = {
  async activeAttempt(): Promise<ActiveExamAttempt | null> {
    const { data } = await api.get("/exams/active-attempt");
    return data.data ?? null;
  },

  async start(lessonId: string): Promise<ExamSession> {
    const { data } = await api.post(`/lessons/${lessonId}/exam-sessions/start`);
    return formatSession(data.data);
  },

  async get(attemptId: string): Promise<ExamSession> {
    const { data } = await api.get(`/exam-sessions/${attemptId}`);
    return formatSession(data.data);
  },

  async saveAnswer(
    attemptId: string,
    examQuestionId: string,
    answer: string[] | string,
  ): Promise<void> {
    await api.put(`/exam-sessions/${attemptId}/answers/${examQuestionId}`, {
      answer,
    });
  },

  async saveProgress(attemptId: string, payload: SaveProgressPayload): Promise<void> {
    await api.put(`/exam-sessions/${attemptId}/progress`, payload);
  },

  async submit(attemptId: string): Promise<ExamSession> {
    const { data } = await api.post(`/exam-sessions/${attemptId}/submit`);
    return formatSession(data.data);
  },
};

export type { AntiCheatEvent };

type KeepaliveHeaders = Record<string, string>;

function buildKeepaliveHeaders(): KeepaliveHeaders {
  const token = useAuthStore.getState().accessToken;
  const tenantId = useTenantStore.getState().activeTenant?.id.toString() ?? null;
  const domain = useTenantStore.getState().domain ?? null;

  const headers: KeepaliveHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (tenantId) {
    headers["X-Tenant-ID"] = tenantId;
  } else if (domain) {
    headers["X-Tenant-Domain"] = domain;
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Best-effort progress flush issued while the page is unloading. Uses fetch
 * keepalive because axios (XHR) requests are not guaranteed to complete during
 * pagehide/unload.
 */
export async function flushProgressKeepalive(
  attemptId: string,
  payload: SaveProgressPayload,
): Promise<void> {
  await fetch(`${resolveApiBaseUrl()}/exam-sessions/${attemptId}/progress`, {
    method: "PUT",
    headers: buildKeepaliveHeaders(),
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

/**
 * Best-effort answer flush issued while the page is unloading for answers that
 * were still inside the debounce window.
 */
export async function flushAnswerKeepalive(
  attemptId: string,
  examQuestionId: string,
  answer: string[] | string,
): Promise<void> {
  await fetch(`${resolveApiBaseUrl()}/exam-sessions/${attemptId}/answers/${examQuestionId}`, {
    method: "PUT",
    headers: buildKeepaliveHeaders(),
    body: JSON.stringify({ answer }),
    keepalive: true,
  });
}
