// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Raw API responses have untyped shapes
export type Raw = Record<string, any>;

export type GradingStatus = "pending_manual_review" | "partially_graded" | "auto_graded" | "graded";

export type AnswerMode = "image_upload" | "image_pages" | "text" | "file";

/** One row in `GET /exams/{exam}/grading-queue`. */
export interface GradingQueueItem {
  id: string;
  examAttemptId: string;
  examQuestionId: string;
  questionId: string;
  gradingStatus: Extract<GradingStatus, "pending_manual_review" | "partially_graded" | "auto_graded">;
  answerMode: AnswerMode;
  points: number;
  /** Page count, when the backend provides it. */
  pageCount: number | null;
  student: { id: string; name: string | null } | null;
  answeredAt: string | null;
  scoreUrl: string;
}

/** One page of a student answer, from `GET /exam-attempts/{attempt}/answers/{examQuestion}/pages`. */
export interface GradingPage {
  id: string;
  pageOrder: number;
  capturedAt: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  url: string;
}

/** Teacher-facing view of an answer to grade (or regrade), with the current grading state. */
export interface GradingAnswer {
  attemptId: string;
  examQuestionId: string;
  answerId: string;
  answerMode: AnswerMode;
  gradingStatus: GradingStatus;
  pages: GradingPage[];
  manualScore: number | null;
  feedback: string | null;
  gradedBy: { id: string; name: string | null } | null;
  gradedAt: string | null;
}

/** Shape returned by `PUT /exam-attempts/{attempt}/answers/{answer}/grade`. */
export interface GradeResult {
  answerId: string;
  gradingStatus: GradingStatus;
  manualScore: number | null;
  feedback: string | null;
  gradedBy: { id: string; name: string | null } | null;
  gradedAt: string | null;
  attempt: {
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    passed: boolean;
  };
}