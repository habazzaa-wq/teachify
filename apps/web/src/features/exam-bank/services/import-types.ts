import type { QuestionDocument } from "@/components/structured-question";

/** A recorded (or defaulted) pipeline stage as exposed by the status API. */
export interface ImportStage {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "skipped";
  detail?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface QuestionImportStatus {
  id: string;
  status: "pending" | "processing" | "ready" | "failed" | "consumed" | "expired";
  attempts: number;
  stages: ImportStage[];
  document: QuestionDocument | null;
  error: {
    code?: string;
    stage?: string | null;
    message?: string;
    errors?: string[];
  } | null;
  source: { original_name?: string; mime?: string; size?: number } | null;
  created_at?: string;
  finished_at?: string;
}
