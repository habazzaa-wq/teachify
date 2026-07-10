"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

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

export function useCourseTags() {
  return useQuery({
    queryKey: ["course-tags", "list"],
    queryFn: fetchCourseTags,
    staleTime: 5 * 60 * 1000,
  });
}
