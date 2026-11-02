"use client";

import { useParams } from "next/navigation";
import { ManualGradingScreen } from "@/features/manual-grading";

export default function InstructorExamGradingPage() {
  const params = useParams<{ examId: string }>();

  return <ManualGradingScreen examId={params?.examId ?? ""} />;
}
