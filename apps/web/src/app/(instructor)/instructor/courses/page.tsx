"use client";

import { CoursesHomeContent } from "@/features/courses/components/CoursesHomeContent";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";

export default function InstructorCoursesPage() {
  const { accessToken, membership } = useInstructorAuth();
  return (
    <CoursesHomeContent
      instructorToken={accessToken}
      instructorPermissions={membership?.permissions ?? []}
    />
  );
}
