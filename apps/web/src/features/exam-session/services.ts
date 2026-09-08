import { api } from "@/services/api";
import { resolveApiBaseUrl } from "@/config/env";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import type {
  ActiveExamAttempt,
  AntiCheatEvent,
  ExamAnswerPagesPayload,
  ExamPageConfirmResult,
  ExamPageManageResult,
  ExamPageUploadIntent,
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

function formatAnswerPages(raw: Raw): ExamAnswerPagesPayload {
  return {
    attemptId: String(raw.attemptId),
    examQuestionId: String(raw.examQuestionId),
    answerId: String(raw.answerId),
    answerMode: String(raw.answerMode),
    gradingStatus: String(raw.gradingStatus),
    pages: Array.isArray(raw.pages)
      ? raw.pages.map((page: Raw) => ({
          id: String(page.id),
          pageOrder: Number(page.pageOrder),
          capturedAt: page.capturedAt ?? null,
          width: page.width ?? null,
          height: page.height ?? null,
          mimeType: page.mimeType ?? null,
          url: String(page.url),
        }))
      : [],
  };
}

function formatManageResult(raw: Raw): ExamPageManageResult {
  return {
    answerId: String(raw.answerId),
    answerMode: String(raw.answerMode),
    gradingStatus: String(raw.gradingStatus),
    pages: Array.isArray(raw.pages)
      ? raw.pages.map((page: Raw) => ({
          id: String(page.id),
          pageOrder: Number(page.pageOrder),
        }))
      : [],
  };
}

export const examSessionService = {
  async start(lessonId: string): Promise<ExamSession> {
    const { data } = await api.post(`/lessons/${lessonId}/exam-sessions/start`);
    return formatSession(data.data);
  },

  /**
   * Lightweight "is there an unfinished exam running right now?" check.
   * Returns null when the student has no live attempt (or it expired / was
   * submitted / its exam was closed by the teacher).
   */
  async activeAttempt(): Promise<ActiveExamAttempt | null> {
    const { data } = await api.get("/exams/active-attempt");
    const raw = data?.data;
    if (!raw) return null;
    return {
      id: String(raw.id),
      examId: String(raw.examId),
      status: raw.status,
      isOfficial: Boolean(raw.isOfficial),
      isPractice: Boolean(raw.isPractice),
      currentQuestionIndex:
        raw.currentQuestionIndex === null || raw.currentQuestionIndex === undefined
          ? null
          : Number(raw.currentQuestionIndex),
      timerEndsAt: raw.timerEndsAt ?? null,
      remainingSeconds:
        raw.remainingSeconds === null || raw.remainingSeconds === undefined
          ? null
          : Number(raw.remainingSeconds),
      exam: raw.exam
        ? {
            id: String(raw.exam.id),
            title: String(raw.exam.title ?? ""),
          }
        : null,
    };
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

  /**
   * Issue a direct-PUT intent for one photograph page of an answer
   * (Phase B2). The PUT itself happens in the feature layer (raw XHR so
   * progress is observable and the 15s axios timeout does not apply); the
   * `headers` here carry the Bunny `AccessKey` + `Content-Type`.
   */
  async createPageUploadIntent(
    attemptId: string,
    examQuestionId: string,
    payload: {
      original_filename: string;
      mime_type?: string;
      size_bytes?: number;
    },
  ): Promise<ExamPageUploadIntent> {
    const { data } = await api.post(
      `/exam-sessions/${attemptId}/answers/${examQuestionId}/upload-intent`,
      payload,
    );
    const d = data.data;
    return {
      sessionId: String(d.session_id),
      uploadUrl: d.upload_url ?? null,
      uploadMethod: d.upload_method ?? "PUT",
      storageKey: d.storage_key ?? null,
      headers: d.headers ?? {},
      expiresAt: d.expires_at ?? null,
    };
  },

  /**
   * Confirm one uploaded page (Phase B2): the server verifies the object
   * exists on Bunny, then creates the private asset + page row and flips the
   * answer to `image_pages` / `pending_manual_review`. The `session` path
   * segment IS the id from `createPageUploadIntent`.
   */
  async confirmPageUpload(
    attemptId: string,
    examQuestionId: string,
    sessionId: string,
    payload: {
      captured_at?: string;
      width?: number;
      height?: number;
      size_bytes?: number;
      mime_type?: string;
      original_filename?: string;
    },
  ): Promise<ExamPageConfirmResult> {
    const { data } = await api.post(
      `/exam-sessions/${attemptId}/answers/${examQuestionId}/pages/${sessionId}/confirm`,
      payload,
    );
    const d = data.data;
    return {
      pageId: String(d.page_id),
      pageOrder: Number(d.page_order),
      answerId: String(d.answer_id),
      gradingStatus: d.grading_status,
      mediaAssetId: d.media_asset_id ?? null,
    };
  },

  /**
   * Ordered page metadata for one answer (Phase C read endpoint). Consumed by
   * the "already-uploaded pages" preview when the student navigates back to a
   * question. Auth: the attempt owner only.
   */
  async getAnswerPages(
    attemptId: string,
    examQuestionId: string,
  ): Promise<ExamAnswerPagesPayload> {
    const { data } = await api.get(
      `/exam-attempts/${attemptId}/answers/${examQuestionId}/pages`,
    );
    return formatAnswerPages(data.data);
  },

  /**
   * Delete one already-confirmed page (Phase D-FIX). The response carries the
   * answer's current mode/status plus the surviving page list in final order.
   * Rejected 422 once the attempt leaves `in_progress`.
   */
  async deletePage(
    attemptId: string,
    examQuestionId: string,
    pageId: string,
  ): Promise<ExamPageManageResult> {
    const { data } = await api.delete(
      `/exam-attempts/${attemptId}/answers/${examQuestionId}/pages/${pageId}`,
    );
    return formatManageResult(data.data);
  },

  /**
   * Bulk reorder of an answer's uploaded pages (Phase D-FIX). `pageIds` must be
   * the FULL current page set in the desired order; partial/foreign lists 422.
   */
  async reorderPages(
    attemptId: string,
    examQuestionId: string,
    pageIds: string[],
  ): Promise<ExamPageManageResult> {
    const { data } = await api.put(
      `/exam-attempts/${attemptId}/answers/${examQuestionId}/pages/reorder`,
      { page_ids: pageIds.map((id) => Number(id)) },
    );
    return formatManageResult(data.data);
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
