export type QuestionType =
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

export type QuestionFormat = "text" | "image" | "structured";

export type ScanMode = "bw_document" | "auto" | "color_document" | "grayscale_document" | "original_preserve";

export interface ScanProcessingStage {
  key: string;
  label: string;
  status: "done" | "skipped";
  detail?: string;
}

export interface ScanProcessingInfo {
  mode: ScanMode;
  fallbackUsed: boolean;
  qualityLevel?: "excellent" | "good" | "original" | null;
  stages: ScanProcessingStage[];
}

export type Difficulty = "easy" | "medium" | "hard";

export type ExamStatus = "draft" | "published" | "archived";

export type ExamVisibility = "private" | "organization" | "public";

export type QuestionStatus = "draft" | "published" | "archived";

export type QuestionVisibility = "private" | "organization" | "public";

export type CategoryStatus = "active" | "inactive" | "archived";

export type BankStatus = "active" | "inactive" | "archived";

export interface QuestionCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sortOrder: number;
  status: CategoryStatus;
  questionCount?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
  explanation?: string | null;
  image?: string | null;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface OrderingItem {
  id: string;
  text: string;
}

export interface QuestionContent {
  options?: QuestionOption[];
  correct?: "true" | "false";
  trueFalseExplanation?: string | null;
  fillText?: string;
  fillAnswers?: string[][];
  pairs?: MatchingPair[];
  shufflePairs?: boolean;
  items?: OrderingItem[];
  answer?: number;
  tolerance?: number | null;
  unit?: string | null;
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  rubric?: string;
  minLength?: number | null;
  maxLength?: number | null;
  attachmentAllowed?: boolean;
  language?: string | null;
  starterCode?: string | null;
}

export interface Question {
  id: string;
  uuid?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  type: QuestionType;
  difficulty: Difficulty;
  categoryId?: string | null;
  bankId?: string | null;
  tags: string[];
  points: number;
  estimatedTime?: number | null;
  language: string;
  status: QuestionStatus;
  visibility: QuestionVisibility;
  shuffleOptions: boolean;
  explanation?: string | null;
  hint?: string | null;
  content: QuestionContent;
  contentDocument?: import("@/components/structured-question").QuestionDocument | null;
  metadata: Record<string, unknown>;
  questionFormat?: QuestionFormat;
  scanUrl?: string | null;
  scanAssetId?: string | null;
  scanProcessing?: ScanProcessingInfo | null;
  category?: { id: string; name: string; slug: string } | null;
  creator?: { id: string; name: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface QuestionBank {
  id: string;
  uuid?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  categoryId?: string | null;
  status: BankStatus;
  visibility: ExamVisibility;
  questionCount?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ExamQuestion {
  examId: string;
  questionId: string;
  section?: string | null;
  order: number;
  points?: number | null;
  question?: Question;
}

export interface Exam {
  id: string;
  uuid?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  status: ExamStatus;
  visibility: ExamVisibility;
  language: string;
  duration?: number | null;
  passingScore: number;
  totalPoints: number;
  questionCount: number;
  attemptLimit?: number | null;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  negativeMarking: boolean;
  certificateEligible: boolean;
  randomQuestionPool: Record<string, unknown>;
  pinned: boolean;
  featured: boolean;
  favorite: boolean;
  questionCountRelation?: number;
  attemptCount?: number;
  creator?: { id: string; name: string | null } | null;
  questions?: ExamQuestion[];
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  deletedAt?: string | null;
}

export interface ExamAnalyticsOverview {
  exams: Record<string, number>;
  attempts: Record<string, number>;
  questions: { total: number; byType: Record<string, number> };
}

export interface ExamAnalytics {
  examId: string;
  title: string;
  attempts: number;
  submitted: number;
  passed: number;
  passRate: number;
  averageScore: number;
  questionCount: number;
  totalPoints: number;
}

export type ViewMode = "grid" | "list";

export interface ExamFilterParams {
  search?: string;
  status?: ExamStatus | "all";
  visibility?: ExamVisibility | "all";
  category?: string | "all";
  pinned?: boolean;
  featured?: boolean;
  favorites?: boolean;
  sort?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface QuestionFilterParams {
  search?: string;
  type?: QuestionType | "all";
  difficulty?: Difficulty | "all";
  status?: QuestionStatus | "all";
  visibility?: QuestionVisibility | "all";
  categoryId?: string | "all";
  bankId?: string | "all" | "none";
  tags?: string[];
  favorites?: boolean;
  sort?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface PaginatedList<T> {
  data: T[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

export interface ExamPickerResult {
  id: string;
  ids: string[];
  title: string;
}
