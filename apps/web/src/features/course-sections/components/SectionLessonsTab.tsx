"use client";

import Link from "next/link";
import { Layers, ExternalLink } from "lucide-react";
import { AppButton } from "@/components/ui";
import { routes } from "@/constants/routes";
import type { CourseSection } from "../types";

interface SectionLessonsTabProps {
  section: CourseSection;
  courseId?: string | null;
}

function SectionLessonsTab({ section, courseId }: SectionLessonsTabProps) {
  if (!courseId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Layers className="h-6 w-6 text-muted-foreground" />
        </div>
        <h4 className="text-sm font-medium text-foreground mb-1">
          الدروس
        </h4>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          عدد الدروس في هذا القسم: {section.lessonsCount}
        </p>
        <p className="text-xs text-muted-foreground">
          اختر دورة تدريبية لعرض الدروس
        </p>
      </div>
    );
  }

  const lessonsUrl = `${routes.dashboardLessons}?course_id=${courseId}&section_id=${section.id}`;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Layers className="h-6 w-6 text-muted-foreground" />
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">
        الدروس
      </h4>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        عدد الدروس في هذا القسم: {section.lessonsCount}
      </p>
      <Link href={lessonsUrl}>
        <AppButton variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
          إدارة الدروس
        </AppButton>
      </Link>
    </div>
  );
}

export { SectionLessonsTab };
