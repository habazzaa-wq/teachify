import { api } from "@/services/api";
import { formatSession, type Raw } from "@/features/exam-session/services";
import type { ExamSession } from "@/features/exam-session/types";
import type {
  AttemptHistory,
  AttemptHistoryItem,
  ExamResult,
  PracticeSource,
  ResultCourseMeta,
  ResultReviewItem,
  ResultStatistics,
  ReviewStatus,
} from "./types";

function formatResult(raw: Raw): ExamResult {
  const attempt = raw.attempt ?? {};
  const exam = raw.exam ?? {};
  const statistics = raw.statistics ?? {};
  const flags = raw.flags ?? {};

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
      attemptNumber: Number(attempt.attemptNumber ?? 1),
      startedAt: attempt.startedAt ?? null,
      submittedAt: attempt.submittedAt ?? null,
    },
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
      showResults: Boolean(exam.showResults),
      showCorrectAnswers: Boolean(exam.showCorrectAnswers),
      allowReview: Boolean(exam.allowReview),
      certificateEligible: Boolean(exam.certificateEligible),
    },
    course: formatCourse(raw.course),
    statistics: formatStatistics(statistics),
    flags: {
      canReview: Boolean(flags.canReview),
      showCorrectAnswers: Boolean(flags.showCorrectAnswers),
      canPractice: Boolean(flags.canPractice),
      certificateEligible: Boolean(flags.certificateEligible),
    },
    practiceSource: formatPracticeSource(raw.practiceSource),
    review: Array.isArray(raw.review)
      ? raw.review.map(formatReviewItem)
      : [],
  };
}

function formatCourse(raw: Raw | null): ResultCourseMeta | null {
  if (!raw || typeof raw !== "object") return null;

  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    slug: String(raw.slug ?? ""),
  };
}

function formatStatistics(raw: Raw): ResultStatistics {
  return {
    totalQuestions: Number(raw.totalQuestions ?? 0),
    answeredQuestions: Number(raw.answeredQuestions ?? 0),
    correctAnswers: Number(raw.correctAnswers ?? 0),
    wrongAnswers: Number(raw.wrongAnswers ?? 0),
    skippedQuestions: Number(raw.skippedQuestions ?? 0),
    correctPercent: Number(raw.correctPercent ?? 0),
    wrongPercent: Number(raw.wrongPercent ?? 0),
    skippedPercent: Number(raw.skippedPercent ?? 0),
    accuracy: Number(raw.accuracy ?? 0),
    completionRate: Number(raw.completionRate ?? 0),
    averageSecondsPerQuestion:
      raw.averageSecondsPerQuestion === null || raw.averageSecondsPerQuestion === undefined
        ? null
        : Number(raw.averageSecondsPerQuestion),
    questionsPerMinute:
      raw.questionsPerMinute === null || raw.questionsPerMinute === undefined
        ? null
        : Number(raw.questionsPerMinute),
    earnedPoints: Number(raw.earnedPoints ?? 0),
    totalPoints: Number(raw.totalPoints ?? 0),
    durationSeconds:
      raw.durationSeconds === null || raw.durationSeconds === undefined
        ? null
        : Number(raw.durationSeconds),
  };
}

function formatPracticeSource(raw: Raw | null): PracticeSource | null {
  if (!raw || typeof raw !== "object") return null;

  return {
    attemptId: String(raw.attemptId),
    score: Number(raw.score ?? 0),
    maxScore: Number(raw.maxScore ?? 0),
    percentage:
      raw.percentage === null || raw.percentage === undefined
        ? null
        : Number(raw.percentage),
  };
}

function formatReviewItem(raw: Raw): ResultReviewItem {
  const content = raw.content ?? {};
  const tags = Array.isArray(raw.tags) ? raw.tags.map((tag) => String(tag)) : [];

  return {
    examQuestionId: String(raw.examQuestionId),
    questionId: String(raw.questionId),
    type: raw.type,
    title: String(raw.title ?? ""),
    description: raw.description ?? null,
    points: Number(raw.points ?? 0),
    order: Number(raw.order ?? 0),
    section: raw.section ?? null,
    difficulty: String(raw.difficulty ?? "medium"),
    tags,
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
    studentAnswer: formatAnswer(raw.studentAnswer),
    correctAnswer: formatAnswer(raw.correctAnswer),
    questionFormat: raw.questionFormat ?? "text",
    scanUrl: typeof raw.scanUrl === "string" ? raw.scanUrl : null,
    contentDocument: raw.contentDocument ?? null,
    explanation: raw.explanation ?? null,
    isCorrect:
      raw.isCorrect === null || raw.isCorrect === undefined ? null : Boolean(raw.isCorrect),
    answered: Boolean(raw.answered),
    status: (raw.status ?? "skipped") as ReviewStatus,
    earnedPoints: Number(raw.earnedPoints ?? 0),
  };
}

function formatAnswer(raw: unknown): string[] | string | null {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.map((id) => String(id));
  return null;
}

function formatHistory(raw: Raw): AttemptHistory {
  return {
    examId: String(raw.examId ?? ""),
    examTitle: String(raw.examTitle ?? ""),
    attempts: Array.isArray(raw.attempts)
      ? raw.attempts.map(formatHistoryItem)
      : [],
  };
}

function formatHistoryItem(raw: Raw): AttemptHistoryItem {
  return {
    attemptId: String(raw.attemptId),
    attemptNumber: Number(raw.attemptNumber ?? 1),
    isOfficial: Boolean(raw.isOfficial),
    isPractice: Boolean(raw.isPractice),
    score: Number(raw.score ?? 0),
    maxScore: Number(raw.maxScore ?? 0),
    percentage:
      raw.percentage === null || raw.percentage === undefined
        ? null
        : Number(raw.percentage),
    passed: Boolean(raw.passed),
    status: raw.status,
    durationSeconds:
      raw.durationSeconds === null || raw.durationSeconds === undefined
        ? null
        : Number(raw.durationSeconds),
    startedAt: raw.startedAt ?? null,
    submittedAt: raw.submittedAt ?? null,
  };
}

export const examResultService = {
  async getResult(attemptId: string): Promise<ExamResult> {
    const { data } = await api.get(`/exam-attempts/${attemptId}/result`);
    return formatResult(data.data);
  },

  async getHistory(examId: string): Promise<AttemptHistory> {
    const { data } = await api.get(`/exams/${examId}/attempts`);
    return formatHistory(data.data);
  },

  async startPractice(attemptId: string): Promise<ExamSession> {
    const { data } = await api.post(`/exam-attempts/${attemptId}/practice`);
    return formatSession(data.data);
  },
};
