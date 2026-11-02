"use client";

import { useParams } from "next/navigation";
import { ExamStudio } from "@/features/exam-bank";

export default function InstructorExamStudioPage() {
  const params = useParams<{ examId: string }>();

  return <ExamStudio examId={params?.examId ?? ""} />;
}
