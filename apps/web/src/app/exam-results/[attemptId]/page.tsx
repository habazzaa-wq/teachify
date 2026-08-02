"use client";

import { use } from "react";
import { ResultPage } from "@/features/results-review";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default function ExamResultRoutePage({ params }: PageProps) {
  const { attemptId } = use(params);

  return <ResultPage attemptId={attemptId} />;
}
