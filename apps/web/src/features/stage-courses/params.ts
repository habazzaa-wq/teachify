import { STAGE_PAGE_SIZE } from "./constants";
import type { StageCourseFilters } from "./types";

/**
 * Builds the Laravel query-string params for the public courses catalog.
 * Undefined values are omitted so the API applies its defaults.
 * Dependency-free so it can be shared by browser (axios) and server (fetch).
 */
export function buildStageCoursesParams(
  stageId: number,
  filters: StageCourseFilters,
  page: number,
  perPage: number = STAGE_PAGE_SIZE,
): Record<string, string | number | undefined> {
  return {
    educational_stage_id: stageId,
    search: filters.search || undefined,
    subject_id: filters.subjectId || undefined,
    instructor_id: filters.teacherId || undefined,
    pricing_type:
      filters.pricing && filters.pricing !== "all" ? filters.pricing : undefined,
    sort: filters.sort && filters.sort !== "newest" ? filters.sort : undefined,
    page,
    per_page: perPage,
  };
}
