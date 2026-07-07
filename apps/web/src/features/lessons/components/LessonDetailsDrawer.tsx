"use client";

import { X, BookOpen } from "lucide-react";
import {
  AppDrawer,
  AppBadge,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppTabsContent,
} from "@/components/ui";
import { LESSON_STATUS_CONFIG } from "../constants";
import { LessonOverviewTab } from "./LessonOverviewTab";
import { LessonContentTab } from "./LessonContentTab";
import { LessonActivityTab } from "./LessonActivityTab";
import { LessonNotesTab } from "./LessonNotesTab";
import type { Lesson, LessonStatus } from "../types";
import type { LessonActivity } from "../types";

interface LessonDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  activities?: LessonActivity[];
  activitiesLoading?: boolean;
}

function LessonDetailsDrawer({
  open,
  onOpenChange,
  lesson,
  activities,
  activitiesLoading,
}: LessonDetailsDrawerProps) {
  if (!lesson) return null;

  const statusConfig = LESSON_STATUS_CONFIG[lesson.status as LessonStatus] ?? LESSON_STATUS_CONFIG.draft;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[600px] lg:max-w-[700px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight truncate">
                {lesson.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <AppBadge variant={statusConfig.color as "success" | "secondary" | "destructive" | "warning" | "default"} className="text-[10px]">
                  {statusConfig.label}
                </AppBadge>
                {lesson.freePreview && (
                  <AppBadge variant="success" className="text-[10px]">معاينة مجانية</AppBadge>
                )}
                {lesson.featured && (
                  <AppBadge variant="warning" className="text-[10px]">مميز</AppBadge>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <AppTabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <div className="border-b px-6 shrink-0">
            <AppTabsList>
              <AppTabsTrigger value="overview">نظرة عامة</AppTabsTrigger>
              <AppTabsTrigger value="content">المحتوى</AppTabsTrigger>
              <AppTabsTrigger value="activity">النشاط</AppTabsTrigger>
              <AppTabsTrigger value="notes">ملاحظات</AppTabsTrigger>
            </AppTabsList>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <AppTabsContent value="overview" className="p-6">
              <LessonOverviewTab lesson={lesson} />
            </AppTabsContent>
            <AppTabsContent value="content" className="p-6">
              <LessonContentTab lesson={lesson} />
            </AppTabsContent>
            <AppTabsContent value="activity" className="p-6">
              <LessonActivityTab activities={activities} loading={activitiesLoading} />
            </AppTabsContent>
            <AppTabsContent value="notes" className="p-6">
              <LessonNotesTab notes={lesson.notes} />
            </AppTabsContent>
          </div>
        </AppTabs>
      </div>
    </AppDrawer>
  );
}

export { LessonDetailsDrawer };
