"use client";

import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui";
import type { LessonActivity } from "../types";

interface LessonActivityTabProps {
  activities?: LessonActivity[];
  loading?: boolean;
}

function LessonActivityTab({ activities, loading }: LessonActivityTabProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Activity className="h-6 w-6 text-muted-foreground" />
        </div>
        <h4 className="text-sm font-medium text-foreground mb-1">
          لا يوجد نشاط
        </h4>
        <p className="text-sm text-muted-foreground max-w-sm">
          لم يتم تسجيل أي نشاط لهذا الدرس بعد.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {activity.action}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activity.description}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activity.timestamp}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export { LessonActivityTab };
