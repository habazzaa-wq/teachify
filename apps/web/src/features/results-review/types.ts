import type { ExamSessionQuestionType } from "@/features/exam-session/types";

export type ReviewStatus = "correct" | "wrong" | "skipped";

export type ReviewFilter = "all" | ReviewStatus;

export interface ResultReviewOption {
  id: string;
  text: string;
  correct?: boolean;
}

export interface ResultReviewContent {
  options?: ResultReviewOption[];
  correct?: string;
  tolerance?: number;
}

export interface ResultReviewItem {
  examQuestionId: string;
  questionId: string;
  type: ExamSessionQuestionType;
  title: string;
  description: string | null;
  points: number;
  order: number;
  section: string | null;
  difficulty: string;
  tags: string[];
  content: ResultReviewContent;
  studentAnswer: string[] | string | null;
  correctAnswer: string[] | string | null;
  explanation: string | null;
  isCorrect: boolean | null;
  answered: boolean;
  status: ReviewStatus;
  earnedPoints: number;
  questionFormat?: "text" | "image";
  scanUrl?: string | null;
}

export interface ResultAttemptMeta {
  id: string;
  examId: string;
  status: "in_progress" | "submitted";
  isOfficial: boolean;
  isPractice: boolean;
  score: number;
  maxScore: number;
  percentage: number | null;
  passed: boolean;
  durationSeconds: number | null;
  attemptNumber: number;
  startedAt: string | null;
  submittedAt: string | null;
}

export interface ResultExamMeta {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  passingScore: number;
  totalPoints: number;
  questionCount: number;
  showResults: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  certificateEligible: boolean;
}

export interface ResultCourseMeta {
  id: string;
  title: string;
  slug: string;
}

export interface ResultStatistics {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  correctPercent: number;
  wrongPercent: number;
  skippedPercent: number;
  accuracy: number;
  completionRate: number;
  averageSecondsPerQuestion: number | null;
  questionsPerMinute: number | null;
  earnedPoints: number;
  totalPoints: number;
  durationSeconds: number | null;
}

export interface ResultFlags {
  canReview: boolean;
  showCorrectAnswers: boolean;
  canPractice: boolean;
  certificateEligible: boolean;
}

export interface PracticeSource {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number | null;
}

export interface ExamResult {
  attempt: ResultAttemptMeta;
  exam: ResultExamMeta;
  course: ResultCourseMeta | null;
  statistics: ResultStatistics;
  flags: ResultFlags;
  practiceSource: PracticeSource | null;
  review: ResultReviewItem[];
}

export interface AttemptHistoryItem {
  attemptId: string;
  attemptNumber: number;
  isOfficial: boolean;
  isPractice: boolean;
  score: number;
  maxScore: number;
  percentage: number | null;
  passed: boolean;
  status: "in_progress" | "submitted";
  durationSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
}

export interface AttemptHistory {
  examId: string;
  examTitle: string;
  attempts: AttemptHistoryItem[];
}
