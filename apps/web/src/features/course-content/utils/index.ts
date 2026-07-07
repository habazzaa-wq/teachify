import type { CourseSection } from "@/features/course-sections/types";
import type { CourseModule as ApiCourseModule } from "@/features/course-modules/types";
import type { Lesson } from "@/features/lessons/types";
import type {
  CourseModule as UiCourseModule,
  CourseModuleSection,
  ContentItem,
  ContentItemType,
} from "../types";

function mapLessonToContentItem(lesson: Lesson): ContentItem {
  const typeMap: Record<string, ContentItemType> = {
    video: "video",
    text: "resource",
    pdf: "pdf",
    external: "external_link",
    live: "live",
  };

  return {
    id: lesson.id,
    title: lesson.title,
    type: typeMap[lesson.lessonType] ?? "resource",
    status: lesson.status === "archived" ? "archived" : lesson.status === "published" ? "published" : "draft",
    visibility: lesson.visibility === "preview" ? "preview" : lesson.visibility === "public" ? "public" : "private",
    duration: lesson.estimatedDuration ?? lesson.durationSeconds ?? null,
    freePreview: lesson.freePreview,
    locked: false,
    order: lesson.order,
    thumbnail: null,
    description: lesson.shortDescription ?? lesson.description,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

function mapSectionToModuleSection(
  section: CourseSection,
  lessons: Lesson[],
): CourseModuleSection {
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
    freePreview: section.freePreview,
    locked: section.locked,
    status: section.status === "archived" ? "archived" : section.status === "published" ? "published" : "draft",
    durationMinutes: section.durationMinutes,
    lessonsCount: section.lessonsCount,
    contentCount: lessons.length,
    items: lessons.map(mapLessonToContentItem),
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
  };
}

function mapApiModuleToUiModule(
  apiModule: ApiCourseModule,
  sections: CourseSection[],
  getLessonsForSection: (sectionId: string) => Lesson[],
): UiCourseModule {
  const moduleSections = sections
    .filter((s) => s.courseModuleId === apiModule.id)
    .sort((a, b) => a.order - b.order);

  return {
    id: apiModule.id,
    title: apiModule.title,
    description: apiModule.description,
    order: apiModule.order,
    status: apiModule.status,
    durationMinutes: apiModule.estimatedDuration,
    sectionsCount: moduleSections.length,
    sections: moduleSections.map((section) =>
      mapSectionToModuleSection(section, getLessonsForSection(section.id)),
    ),
    createdAt: apiModule.createdAt,
    updatedAt: apiModule.updatedAt,
  };
}

export function buildModuleTree(
  apiModules: ApiCourseModule[],
  sections: CourseSection[],
  getLessonsForSection: (sectionId: string) => Lesson[],
): UiCourseModule[] {
  return apiModules
    .sort((a, b) => a.order - b.order)
    .map((mod) => mapApiModuleToUiModule(mod, sections, getLessonsForSection));
}

export function estimateDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours} س ${minutes} د`;
  return `${minutes} د`;
}

export function estimateDurationMinutes(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours} س ${mins} د`;
  return `${mins} د`;
}
