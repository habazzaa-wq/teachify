"use client";

import { useQuery } from "@tanstack/react-query";
import { homepageCoursesService } from "./services";

export const homepageCoursesKeys = {
  public: ["homepage-courses", "public"] as const,
};

export function usePublicHomepageCourses() {
  return useQuery({
    queryKey: homepageCoursesKeys.public,
    queryFn: homepageCoursesService.getPublicCourses,
    staleTime: 30_000,
  });
}
