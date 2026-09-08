export type ExamSessionStatus = "in_progress" | "grading" | "submitted";

export type ExamSessionQuestionType = "single_choice" | "multiple_choice" | "true_false" | "numeric" | "essay" | "short_answer";

export type ExamSessionAnswer = string[] | string | null;

export interface ExamSessionOption {
  id: string;
  text: string;
  correct?: boolean;
}

export interface ExamSessionQuestionContent {
  options?: ExamSessionOption[];
  correct?: string | number;
  tolerance?: number;
}

export interface ExamSessionQuestion {
  examQuestionId: string;
  questionId: string;
  type: ExamSessionQuestionType;
  title: string;
  description: string | null;
  points: number;
  order: number;
  section: string | null;
  content: ExamSessionQuestionContent;
  answer: ExamSessionAnswer;
  answered: boolean;
  isCorrect: boolean | null;
  questionFormat?: "text" | "image" | "structured";
  scanUrl?: string | null;
  contentDocument?: import("@/components/structured-question").QuestionDocument | null;
}

export interface ExamSessionExamMeta {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  passingScore: number;
  totalPoints: number;
  questionCount: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
}

export interface ExamSessionAttempt {
  id: string;
  examId: string;
  status: ExamSessionStatus;
  isOfficial: boolean;
  isPractice: boolean;
  score: number;
  maxScore: number;
  percentage: number | null;
  passed: boolean;
  durationSeconds: number | null;
  currentQuestionIndex: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  timerEndsAt: string | null;
  remainingSeconds: number | null;
  exam: ExamSessionExamMeta;
}

export interface ExamSession {
  attempt: ExamSessionAttempt;
  questions: ExamSessionQuestion[];
}

/**
 * Lightweight payload returned by GET /exams/active-attempt — enough for the
 * global reminder to surface an unfinished exam without loading the full
 * session (questions, answers, ...).
 */
export interface ActiveExamAttempt {
  id: string;
  examId: string;
  status: ExamSessionStatus;
  isOfficial: boolean;
  isPractice: boolean;
  currentQuestionIndex: number | null;
  timerEndsAt: string | null;
  remainingSeconds: number | null;
  exam: {
    id: string;
    title: string;
  } | null;
}

export type AntiCheatEventType =
  | "page_hidden"
  | "page_visible"
  | "window_blur"
  | "window_focus"
  | "fullscreen_exit"
  | "fullscreen_enter"
  | "page_exit";

export interface AntiCheatEvent {
  type: AntiCheatEventType;
  occurred_at: string;
}

export interface SaveProgressPayload {
  current_question_index: number;
  events?: AntiCheatEvent[];
}

/**
 * One photographed answer page, as returned by the Phase C read endpoint
 * (GET /exam-attempts/{attempt}/answers/{examQuestion}/pages). This is the
 * student-shaped payload — grading fields are never present.
 */
export interface ExamAnswerPage {
  id: string;
  pageOrder: number;
  capturedAt: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  url: string;
}

export interface ExamAnswerPagesPayload {
  attemptId: string;
  examQuestionId: string;
  answerId: string;
  answerMode: string;
  gradingStatus: string;
  pages: ExamAnswerPage[];
}

/** PUT-intent response for one page (POST .../upload-intent). */
export interface ExamPageUploadIntent {
  sessionId: string;
  uploadUrl: string | null;
  uploadMethod: string;
  storageKey: string | null;
  headers: Record<string, string>;
  expiresAt: string | null;
}

/** POST .../pages/{session}/confirm response data. */
export interface ExamPageConfirmResult {
  pageId: string;
  pageOrder: number;
  answerId: string;
  gradingStatus: string;
  mediaAssetId: number | null;
}

/**
 * DELETE / PUT answer-page manage response (Phase D-FIX): the answer's current
 * mode/status plus the authoritative page list (id + page_order) after a delete
 * or reorder.
 */
export interface ExamPageManageResult {
  answerId: string;
  answerMode: string;
  gradingStatus: string;
  pages: { id: string; pageOrder: number }[];
}
