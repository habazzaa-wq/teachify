"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import {
  usePublicCourse,
  usePublicCourseModules,
  useRelatedCourses,
  useEnrollmentCheck,
} from "../hooks";
import { HeroSection } from "./HeroSection";
import { StatsBar } from "./StatsBar";
import { CourseOverview } from "./CourseOverview";
import { LearningOutcomes } from "./LearningOutcomes";
import { CourseRequirements } from "./CourseRequirements";
import { TargetAudience } from "./TargetAudience";
import { CurriculumNew } from "./CurriculumNew";
import { InstructorCard } from "./InstructorCard";
import { FAQSection } from "./FAQSection";
import { RelatedCourses } from "./RelatedCourses";
import { ReviewsSection } from "./ReviewsSection";
import { PurchaseSidebar } from "./PurchaseSidebar";
import { MobilePurchaseBar } from "./MobilePurchaseBar";
import { LockedContentModal } from "./LockedContentModal";
import { PageSkeleton } from "./PageSkeleton";

interface Props {
  slug: string;
}

export function PublicCoursePage({ slug }: Props) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [lockedOpen, setLockedOpen] = useState(false);

  const { data: course, isLoading: courseLoading } = usePublicCourse(slug);
  const { data: modules, isLoading: modulesLoading } =
    usePublicCourseModules(slug);
  const { data: relatedCourses } = useRelatedCourses(slug);
  const { data: enrollment } = useEnrollmentCheck(slug);

  const isEnrolled = enrollment?.enrolled ?? false;

  const handleNavigate = useCallback(
    () => router.push("/tenant-login"),
    [router],
  );

  const handleLockedClick = useCallback(() => {
    if (!isEnrolled) setLockedOpen(true);
  }, [isEnrolled]);

  if (courseLoading || !course) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection
        course={course}
        isEnrolled={isEnrolled}
        onEnroll={handleNavigate}
        onLogin={handleNavigate}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-10 lg:grid-cols-[1fr_380px] lg:gap-12 lg:py-14">
          {/* Right Column: Main Content */}
          <div className="min-w-0 space-y-14">
            {/* Stats Bar */}
            <StatsBar course={course} />

            {/* Course Description */}
            <CourseOverview
              description={course.description}
              fullDescription={course.fullDescription}
            />

            {/* Learning Outcomes */}
            <LearningOutcomes outcomes={course.learningOutcomes} />

            {/* Requirements */}
            <CourseRequirements requirements={course.requirements} />

            {/* Target Audience */}
            <TargetAudience audience={course.targetAudience} />

            {/* Curriculum */}
            <CurriculumNew
              modules={modules ?? []}
              isLoading={modulesLoading}
              isEnrolled={isEnrolled}
              onLockedClick={handleLockedClick}
            />

            {/* Instructor */}
            {course.instructor && (
              <InstructorCard instructor={course.instructor} />
            )}

            {/* FAQ */}
            <FAQSection />

            {/* Reviews */}
            <ReviewsSection />

            {/* Related Courses */}
            {relatedCourses && <RelatedCourses courses={relatedCourses} />}
          </div>

          {/* Left Column: Sticky Sidebar (Desktop) */}
          <div className="hidden lg:block">
            <PurchaseSidebar
              course={course}
              isEnrolled={isEnrolled}
              onEnroll={handleNavigate}
              onLogin={handleNavigate}
            />
          </div>
        </div>
      </div>

      {/* Mobile Purchase Bar */}
      <MobilePurchaseBar
        course={course}
        isEnrolled={isEnrolled}
        onEnroll={handleNavigate}
      />

      {/* Locked Content Modal */}
      <LockedContentModal
        isOpen={lockedOpen}
        onClose={() => setLockedOpen(false)}
        onEnroll={handleNavigate}
        onLogin={handleNavigate}
      />
    </div>
  );
}
