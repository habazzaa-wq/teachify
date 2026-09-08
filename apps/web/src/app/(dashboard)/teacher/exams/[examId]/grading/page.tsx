"use client";

import { useParams } from "next/navigation";
import { ManualGradingScreen } from "@/features/manual-grading";

export default function ExamGradingPage() {
  const params = useParams<{ examId: string }>();
  const examId = params?.examId ?? "";

  return <ManualGradingScreen examId={examId} />;
}