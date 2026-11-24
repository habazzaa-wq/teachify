"use client";

import { ListTree, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CourseModule } from "@/features/course-modules/types";

interface CourseStudioRailProps {
  lectures: CourseModule[];
  selectedLectureId: string | null;
  onSelectLecture: (id: string) => void;
  onOpenMap?: () => void;
  onCreateLecture?: () => void;
  className?: string;
}

function CourseStudioRail({
  lectures,
  selectedLectureId,
  onSelectLecture,
  onOpenMap,
  onCreateLecture,
  className,
}: CourseStudioRailProps) {
  return (
    <aside
      className={cn("cw3-rail studio-scrollbar", className)}
      role="navigation"
      aria-label="خريطة الفصول"
    >
      {onOpenMap && (
        <button
          type="button"
          onClick={onOpenMap}
          className="cw3-rail-item"
          aria-label="فتح المنهج الكامل"
          title="فتح المنهج الكامل"
        >
          <ListTree className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <span className="cw3-rail-label mt-1">الفصول</span>

      <div className="flex flex-col items-center gap-1.5">
        {lectures.map((lecture, index) => (
          <button
            key={lecture.id}
            type="button"
            onClick={() => onSelectLecture(lecture.id)}
            className="cw3-rail-item"
            data-selected={selectedLectureId === lecture.id}
            aria-label={`الفصل ${index + 1}: ${lecture.title}`}
            aria-current={selectedLectureId === lecture.id ? "true" : undefined}
            title={lecture.title}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {onCreateLecture && (
        <button
          type="button"
          onClick={onCreateLecture}
          className="cw3-rail-item mt-auto border-dashed text-studio-accent"
          aria-label="إضافة فصل جديد"
          title="إضافة فصل جديد"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </aside>
  );
}

export { CourseStudioRail };
