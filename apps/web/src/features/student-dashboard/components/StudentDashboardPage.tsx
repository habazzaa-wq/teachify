"use client";

import { useState } from "react";
import { useStudentDashboard } from "../hooks";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { AppErrorState } from "@/components/ui/AppErrorState";
import { NavDock, type DashboardViewId } from "./NavDock";
import { OverviewView } from "./OverviewView";
import { CoursesView } from "./CoursesView";
import { ExamsView } from "./ExamsView";
import { TasksView } from "./TasksView";
import { WalletHistoryView } from "./WalletHistoryView";
import { AchievementsView } from "./AchievementsView";
import { CalendarView } from "./CalendarView";

export function StudentDashboardPage() {
  const { data, isLoading, isError, refetch } = useStudentDashboard();
  const [activeView, setActiveView] = useState<DashboardViewId>("overview");

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
    <div className="pb-28 lg:pb-10">
      <NavDock
        active={activeView}
        onChange={setActiveView}
        streakDays={data.stats.currentStreakDays}
      />

      <div key={activeView} className="animate-fade-in-up">
        {activeView === "overview" && <OverviewView data={data} onNavigate={setActiveView} />}
        {activeView === "courses" && <CoursesView items={data.continueLearning} />}
        {activeView === "exams" && <ExamsView attempts={data.recentAttempts} />}
        {activeView === "tasks" && <TasksView tasks={data.upcomingTasks} />}
        {activeView === "wallet" && <WalletHistoryView />}
        {activeView === "achievements" && <AchievementsView achievements={data.achievements} />}
        {activeView === "calendar" && <CalendarView calendar={data.calendar} />}
      </div>
    </div>
  );
}
