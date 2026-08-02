"use client";

import { use } from "react";
import { ExamSessionPage } from "@/features/exam-session/components/ExamSessionPage";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default function ExamSessionRoutePage({ params }: PageProps) {
  const { attemptId } = use(params);

  return <ExamSessionPage attemptId={attemptId} />;
}
