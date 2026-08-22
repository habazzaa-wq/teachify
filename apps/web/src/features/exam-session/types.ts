export type ExamSessionStatus = "in_progress" | "submitted";

export type ExamSessionQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "essay"
  | "fill_blank"
  | "matching"
  | "ordering"
  | "numeric"
  | "file_upload"
  | "coding";

export type ExamSessionAnswer = string[] | string | null;

export interface ExamSessionOption {
  id: string;
  text: string;
  correct?: boolean;
}

export interface ExamSessionQuestionContent {
  options?: ExamSessionOption[];
  correct?: string;
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
  questionFormat?: "text" | "image" | "structured";
  scanUrl?: string | null;
  contentDocument?: import("@/components/structured-question").QuestionDocument | null;
  answer: ExamSessionAnswer;
  answered: boolean;
  isCorrect: boolean | null;
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
