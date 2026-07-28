"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePublicCourse, usePublicCourseModules, useRelatedCourses, useEnrollmentCheck } from "../hooks";
import { CourseHero } from "./CourseHero";
import PurchaseCard from "./PurchaseCard";
import { CoursePreview } from "./CoursePreview";
import { CurriculumSection } from "./CurriculumSection";
import { CourseDescription } from "./CourseDescription";
import { LearningOutcomes } from "./LearningOutcomes";
import { CourseRequirements } from "./CourseRequirements";
import { TargetAudience } from "./TargetAudience";
import { InstructorCard } from "./InstructorCard";
import { CourseStats } from "./CourseStats";
import { CourseFAQ } from "./CourseFAQ";
import { RelatedCourses } from "./RelatedCourses";
import { ReviewsSection } from "./ReviewsSection";
import { LockedModal } from "./LockedModal";
import { MobilePurchaseBar } from "./MobilePurchaseBar";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  slug: string;
}

function CoursePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-[480px] w-full" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          <div className="space-y-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <Skeleton className="h-[500px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicCoursePage({ slug }: Props) {
  const router = useRouter();
  const [lockedModalOpen, setLockedModalOpen] = useState(false);

  const { data: course, isLoading: courseLoading } = usePublicCourse(slug);
  const { data: modules, isLoading: modulesLoading } = usePublicCourseModules(slug);
  const { data: relatedCourses } = useRelatedCourses(slug);
  const { data: enrollment } = useEnrollmentCheck(slug);

  const isEnrolled = enrollment?.enrolled ?? false;

  const handleEnroll = useCallback(() => {
    router.push("/tenant-login");
  }, [router]);

  const handleLogin = useCallback(() => {
    router.push("/tenant-login");
  }, [router]);

  const handleLockedClick = useCallback(() => {
    if (!isEnrolled) {
      setLockedModalOpen(true);
    }
  }, [isEnrolled]);

  if (courseLoading || !course) {
    return <CoursePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <CourseHero course={course} />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          {/* Main Content */}
          <div className="space-y-16">
            <CourseStats course={course} />

            <CoursePreview course={course} />

            {course.learningOutcomes.length > 0 && (
              <LearningOutcomes outcomes={course.learningOutcomes} />
            )}

            <CourseDescription
              description={course.description}
              fullDescription={course.fullDescription}
            />

            {modulesLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : modules && modules.length > 0 ? (
              <CurriculumSection
                modules={modules}
                isEnrolled={isEnrolled}
                onLockedClick={handleLockedClick}
              />
            ) : null}

            {course.instructor && (
              <InstructorCard instructor={course.instructor} />
            )}

            {course.requirements.length > 0 && (
              <CourseRequirements requirements={course.requirements} />
            )}

            {course.targetAudience.length > 0 && (
              <TargetAudience audience={course.targetAudience} />
            )}

            <CourseFAQ />

            <ReviewsSection course={course} />
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <PurchaseCard
                course={course}
                isEnrolled={isEnrolled}
                onEnroll={handleEnroll}
                onLogin={handleLogin}
              />
            </div>
          </div>
        </div>
      </div>

      {relatedCourses && relatedCourses.length > 0 && (
        <div className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <RelatedCourses courses={relatedCourses} />
          </div>
        </div>
      )}

      <MobilePurchaseBar
        course={course}
        isEnrolled={isEnrolled}
        onEnroll={handleEnroll}
      />

      <LockedModal
        isOpen={lockedModalOpen}
        onClose={() => setLockedModalOpen(false)}
        onEnroll={handleEnroll}
        onLogin={handleLogin}
      />
    </div>
  );
}
