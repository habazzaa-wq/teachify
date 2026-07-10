"use client";

import { useParams } from "next/navigation";
import { ExamStudio } from "@/features/exam-bank";

export default function ExamStudioPage() {
  const params = useParams<{ examId: string }>();
  const examId = params?.examId ?? "";

  return <ExamStudio examId={examId} />;
}
