import api from "@/services/api/axios";
import { formatStageCourse, formatStageCoursesResponse } from "./format";
import { buildStageCoursesParams } from "./params";
import type { StageCourseFilters, StageCoursesResponse } from "./types";

export const stageCoursesService = {
  /** Public, unauthenticated: active educational stages for the current tenant. */
  async getStage(stageId: number) {
    const { data } = await api.get<{ data: { id: number; name: string; description: string | null; image: string | null; link: string | null } }>(
      `/public/educational-stages/${stageId}`,
    );
    return data.data;
  },

  /** Public catalog of published courses for a stage, with filters + pagination. */
  async getCourses(
    stageId: number,
    filters: StageCourseFilters = {},
    page = 1,
  ): Promise<StageCoursesResponse> {
    const { data } = await api.get("/public/courses", {
      params: buildStageCoursesParams(stageId, filters, page),
    });
    return formatStageCoursesResponse(data);
  },

  /** Formatter exposed for other consumers (e.g. list pages reusing the card). */
  formatCourse: formatStageCourse,
};
