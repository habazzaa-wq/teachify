"use client";

import { useStudentDashboard } from "../hooks";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { AppErrorState } from "@/components/ui/AppErrorState";
import { StudentHero } from "./StudentHero";
import { StudentStatCards } from "./StudentStatCards";
import { ContinueLearningSection } from "./ContinueLearningSection";
import { UpcomingTasksSection } from "./UpcomingTasksSection";
import { RecentAttemptsSection } from "./RecentAttemptsSection";
import { TimelineSection } from "./TimelineSection";
import { AchievementsSection } from "./AchievementsSection";
import { CalendarSection } from "./CalendarSection";
import { QuickActions } from "./QuickActions";

export function StudentDashboardPage() {
  const { data, isLoading, isError, refetch } = useStudentDashboard();

  if (isLoading) {
    return <AppLoadingState label="جارٍ تحميل لوحة الطالب..." className="min-h-[60vh]" />;
  }

  if (isError || !data) {
    return (
      <AppErrorState
        title="تعذّر تحميل لوحة الطالب"
        description="حدثت مشكلة أثناء جلب البيانات. حاول مرة أخرى."
        onRetry={() => void refetch()}
        className="min-h-[60vh]"
      />
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <StudentHero data={data} />
      <StudentStatCards stats={data.stats} />
      <div className="home-enter-up" style={{ animationDelay: "0.1s" }}>
        <div className="grid gap-6 lg:grid-cols-2">
          <ContinueLearningSection items={data.continueLearning} />
          <UpcomingTasksSection tasks={data.upcomingTasks} />
        </div>
      </div>
      <div className="home-enter-up" style={{ animationDelay: "0.15s" }}>
        <RecentAttemptsSection attempts={data.recentAttempts} />
      </div>
      <div className="home-enter-up" style={{ animationDelay: "0.2s" }}>
        <div className="grid gap-6 lg:grid-cols-2">
          <TimelineSection events={data.timeline} />
          <AchievementsSection achievements={data.achievements} />
        </div>
      </div>
      <div className="home-enter-up" style={{ animationDelay: "0.25s" }}>
        <div className="grid gap-6 lg:grid-cols-2">
          <CalendarSection calendar={data.calendar} />
          <QuickActions data={data} />
        </div>
      </div>
    </div>
  );
}
