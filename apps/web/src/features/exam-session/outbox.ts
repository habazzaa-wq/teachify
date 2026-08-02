import { normalizeApiError } from "@/services/api/errors";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiError } from "@/types/common.types";
import {
  examSessionService,
  flushAnswerKeepalive,
  flushProgressKeepalive,
} from "./services";
import type { AntiCheatEvent, ExamSessionAnswer } from "./types";

const OUTBOX_PREFIX = "exam-session.outbox.v1.";
const FLUSH_DEBOUNCE_MS = 800;
const RETRY_BASE_MS = 2_000;
const RETRY_MAX_MS = 60_000;

interface AnswerEntry {
  answer: ExamSessionAnswer;
  queuedAt: number;
}

interface ProgressEntry {
  currentQuestionIndex: number;
  events: AntiCheatEvent[];
  queuedAt: number;
}

interface OutboxRecord {
  attemptId: string;
  answers: Record<string, AnswerEntry>;
  progress: ProgressEntry | null;
}

export interface ExamOutboxCallbacks {
  onTerminal?: () => void;
}

export interface ExamOutbox {
  queueAnswer: (examQuestionId: string, answer: ExamSessionAnswer) => void;
  queueProgress: (currentQuestionIndex: number, events: AntiCheatEvent[]) => void;
  drain: () => Promise<void>;
  flushKeepalive: () => void;
  seedFromServer: (
    serverAnswers: Record<string, ExamSessionAnswer>,
  ) => Record<string, ExamSessionAnswer>;
  hasPending: () => boolean;
  clear: () => void;
  dispose: () => void;
}

export function createExamOutbox(
  attemptId: string,
  callbacks: ExamOutboxCallbacks = {},
): ExamOutbox {
  const userId = useAuthStore.getState().user?.id;
  const storageKey =
    userId === undefined || userId === null
      ? `${OUTBOX_PREFIX}${attemptId}`
      : `${OUTBOX_PREFIX}${userId}.${attemptId}`;

  let record: OutboxRecord = loadRecord();
  let flushing = false;
  let drainPromise: Promise<void> | null = null;
  let retryTimer: number | null = null;
  let debounceTimer: number | null = null;
  let retryDelayMs = RETRY_BASE_MS;
  let disposed = false;

  function loadRecord(): OutboxRecord {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return emptyRecord();
      const parsed = JSON.parse(raw) as Partial<OutboxRecord> | null;
      if (!parsed || typeof parsed !== "object" || parsed.attemptId !== attemptId) {
        return emptyRecord();
      }
      return {
        attemptId,
        answers: sanitizeAnswers(parsed.answers),
        progress: sanitizeProgress(parsed.progress),
      };
    } catch {
      return emptyRecord();
    }
  }

  function emptyRecord(): OutboxRecord {
    return { attemptId, answers: {}, progress: null };
  }

  function sanitizeAnswers(value: unknown): Record<string, AnswerEntry> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
    const result: Record<string, AnswerEntry> = {};
    for (const [questionId, entry] of Object.entries(
      value as Record<string, Partial<AnswerEntry>>,
    )) {
      if (!entry || typeof entry !== "object" || !("answer" in entry)) continue;
      result[questionId] = {
        answer: entry.answer ?? null,
        queuedAt: Number(entry.queuedAt) || 0,
      };
    }
    return result;
  }

  function sanitizeProgress(value: unknown): ProgressEntry | null {
    if (typeof value !== "object" || value === null) return null;
    const entry = value as Partial<ProgressEntry>;
    if (typeof entry.currentQuestionIndex !== "number") return null;
    return {
      currentQuestionIndex: entry.currentQuestionIndex,
      events: Array.isArray(entry.events)
        ? entry.events.filter(isAntiCheatEvent)
        : [],
      queuedAt: Number(entry.queuedAt) || 0,
    };
  }

  function isAntiCheatEvent(value: unknown): value is AntiCheatEvent {
    if (typeof value !== "object" || value === null) return false;
    const event = value as Record<string, unknown>;
    return typeof event.type === "string" && typeof event.occurred_at === "string";
  }

  function persist(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(record));
    } catch {
      // ignore
    }
  }

  function canSend(answer: ExamSessionAnswer): answer is string | string[] {
    return typeof answer === "string" || (Array.isArray(answer) && answer.length > 0);
  }

  function answersEqual(a: ExamSessionAnswer, b: ExamSessionAnswer): boolean {
    if (a === b) return true;
    if (typeof a === "string" || typeof b === "string") return false;
    const left = [...(a ?? [])].sort().join("\u0000");
    const right = [...(b ?? [])].sort().join("\u0000");
    return left === right;
  }

  function isAttemptFinal(apiError: ApiError): boolean {
    return (
      apiError.status === 404 || apiError.status === 410 || apiError.status === 422
    );
  }

  function hasPending(): boolean {
    return Object.keys(record.answers).length > 0 || record.progress !== null;
  }

  function scheduleFlush(): void {
    if (disposed) return;
    if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null;
      void drain();
    }, FLUSH_DEBOUNCE_MS);
  }

  function scheduleRetry(): void {
    if (disposed) return;
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(() => {
      retryTimer = null;
      void drain();
    }, retryDelayMs);
    retryDelayMs = Math.min(retryDelayMs * 2, RETRY_MAX_MS);
  }

  async function flushAnswers(): Promise<void> {
    for (const questionId of Object.keys(record.answers)) {
      if (disposed) return;
      const entry = record.answers[questionId];
      if (!entry || !canSend(entry.answer)) {
        delete record.answers[questionId];
        persist();
        continue;
      }
      await examSessionService.saveAnswer(attemptId, questionId, entry.answer);
      delete record.answers[questionId];
      persist();
    }
  }

  async function flushProgress(): Promise<void> {
    if (!record.progress) return;
    const progress = record.progress;
    await examSessionService.saveProgress(attemptId, {
      current_question_index: progress.currentQuestionIndex,
      events: progress.events.length > 0 ? progress.events : undefined,
    });
    record.progress = null;
    persist();
  }

  async function drain(): Promise<void> {
    if (disposed) return;
    if (flushing && drainPromise) {
      await drainPromise;
      return;
    }
    flushing = true;
    drainPromise = (async () => {
      try {
        while (!disposed && hasPending()) {
          try {
            await flushAnswers();
            await flushProgress();
          } catch (error) {
            const apiError = normalizeApiError(error);
            if (isAttemptFinal(apiError)) {
              clear();
              callbacks.onTerminal?.();
            } else {
              scheduleRetry();
            }
            break;
          }
          retryDelayMs = RETRY_BASE_MS;
        }
      } finally {
        flushing = false;
        drainPromise = null;
      }
    })();
    return drainPromise;
  }

  function queueAnswer(examQuestionId: string, answer: ExamSessionAnswer): void {
    if (disposed) return;
    if (canSend(answer)) {
      record.answers[examQuestionId] = { answer, queuedAt: Date.now() };
    } else {
      delete record.answers[examQuestionId];
    }
    persist();
    scheduleFlush();
  }

  function queueProgress(currentQuestionIndex: number, events: AntiCheatEvent[]): void {
    if (disposed) return;
    if (record.progress) {
      record.progress.events.push(...events);
      record.progress.currentQuestionIndex = currentQuestionIndex;
      record.progress.queuedAt = Date.now();
    } else {
      record.progress = {
        currentQuestionIndex,
        events: [...events],
        queuedAt: Date.now(),
      };
    }
    persist();
    scheduleFlush();
  }

  function flushKeepalive(): void {
    for (const [questionId, entry] of Object.entries(record.answers)) {
      if (!canSend(entry.answer)) continue;
      void flushAnswerKeepalive(attemptId, questionId, entry.answer);
    }
    if (record.progress) {
      void flushProgressKeepalive(attemptId, {
        current_question_index: record.progress.currentQuestionIndex,
        events:
          record.progress.events.length > 0 ? record.progress.events : undefined,
      });
    }
    record.answers = {};
    record.progress = null;
    persist();
  }

  function seedFromServer(
    serverAnswers: Record<string, ExamSessionAnswer>,
  ): Record<string, ExamSessionAnswer> {
    const seeded: Record<string, ExamSessionAnswer> = {};
    for (const [questionId, answer] of Object.entries(serverAnswers)) {
      seeded[questionId] = answer;
      const pending = record.answers[questionId];
      if (pending && answersEqual(pending.answer, answer)) {
        delete record.answers[questionId];
      }
    }
    for (const [questionId, entry] of Object.entries(record.answers)) {
      if (canSend(entry.answer)) seeded[questionId] = entry.answer;
    }
    persist();
    if (hasPending()) scheduleFlush();
    return seeded;
  }

  function clear(): void {
    record = emptyRecord();
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  function onOnline(): void {
    if (hasPending()) void drain();
  }

  function onFocus(): void {
    if (hasPending()) void drain();
  }

  function dispose(): void {
    disposed = true;
    if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("focus", onFocus);
  }

  window.addEventListener("online", onOnline);
  window.addEventListener("focus", onFocus);

  return {
    queueAnswer,
    queueProgress,
    drain,
    flushKeepalive,
    seedFromServer,
    hasPending,
    clear,
    dispose,
  };
}
