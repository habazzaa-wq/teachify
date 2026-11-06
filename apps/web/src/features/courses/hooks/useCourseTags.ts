"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { instructorApi } from "@/features/instructors/api";

export interface CourseTag {
  id: number;
  name: string;
  slug: string;
}

async function fetchCourseTags(): Promise<CourseTag[]> {
  const { data } = await api.get("/tags", { params: { per_page: 100 } });
  return (data.data ?? []).map((t: CourseTag) => ({
    id: Number(t.id),
    name: t.name,
    slug: t.slug,
  }));
}

export function useCourseTags(instructorToken?: string | null) {
  return useQuery({
    queryKey: ["course-tags", "list", instructorToken ? "instructor" : "tenant"],
    queryFn: async () => {
      if (!instructorToken) return fetchCourseTags();
      const { data } = await instructorApi.courseLookups(instructorToken);
      return data.tags;
    },
    staleTime: 5 * 60 * 1000,
  });
}
