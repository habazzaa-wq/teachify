"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { AppErrorState, AppLoadingState, Skeleton } from "@/components/ui";
import { useExamResult, useAttemptHistory } from "../hooks";
import { ResultHero } from "./ResultHero";
import { CertificateBanner } from "./CertificateBanner";
import { PracticeCtaCard } from "./PracticeCtaCard";
import { PerformanceBreakdown } from "./PerformanceBreakdown";
import { ReviewSection } from "./ReviewSection";
import { AttemptHistorySection } from "./AttemptHistorySection";

interface ResultPageProps {
  attemptId: string;
}

function ResultPageInner({ attemptId }: ResultPageProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useExamResult(attemptId);
  const history = useAttemptHistory(data?.attempt.examId ?? null);

  if (isLoading) {
    return <ResultLoadingScreen />;
  }

  if (isError || !data) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <AppErrorState
          title="تعذر عرض النتيجة"
          description="تأكد من أن لديك حق الوصول لهذه المحاولة، ثم أعد المحاولة."
          onRetry={() => refetch()}
        />
      </main>
    );
  }

  const { attempt, exam, course, flags, statistics, practiceSource, review } = data;
  const wrongCount = statistics.wrongAnswers;
  const showReview = flags.canReview;

  function goBack() {
    if (course?.slug) {
      router.push(`/courses/${course.slug}`);
    } else {
      router.back();
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3.5 py-2 text-xs font-bold text-foreground/80 transition-colors hover:bg-muted"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للدورة
        </button>

        {course && (
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs font-bold text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-[#BF6D58]" />
            {course.title}
          </span>
        )}
      </div>

      <div className="space-y-6">
        <ResultHero result={data} />

        {flags.certificateEligible && <CertificateBanner certificateEligible />}

        {(flags.canPractice || practiceSource) && (
          <PracticeCtaCard
            attemptId={attempt.id}
            canPractice={flags.canPractice}
            wrongCount={wrongCount}
            practiceSource={practiceSource}
            currentPercentage={attempt.percentage}
          />
        )}

        <PerformanceBreakdown statistics={statistics} />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            {showReview ? (
              <ReviewSection items={review} revealCorrect={flags.showCorrectAnswers} />
            ) : (
              <NoReviewNotice />
            )}
          </div>

          <aside className="lg:sticky lg:top-24">
            <AttemptHistorySection
              items={history.data?.attempts ?? []}
              currentAttemptId={attempt.id}
              examTitle={exam.title}
              loading={history.isLoading}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

function NoReviewNotice() {
  return (
    <section className="rounded-3xl border border-border/40 bg-card/60 p-8 text-center shadow-sm">
      <h2 className="text-base font-extrabold text-foreground">لا تتوفر مراجعة لهذا الامتحان</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-muted-foreground">
        قرر مزوّد الامتحان عدم عرض الإجابات الصحيحة بعد التقديم. لا يزال بإمكانك مراجعة نتيجتك
        العامة وإعادة المحاولة.
      </p>
    </section>
  );
}

function ResultLoadingScreen() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-7 w-44 rounded-full" />
      </div>
      <div className="rounded-3xl border border-border/40 bg-card/60 p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Skeleton className="h-36 w-36 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <AppLoadingState label="جارٍ تحميل النتيجة..." variant="skeleton" rows={3} />
    </main>
  );
}

const ResultPage = memo(ResultPageInner);

export { ResultPage };
