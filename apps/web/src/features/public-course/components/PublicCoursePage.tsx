"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { usePublicCourse, usePublicCourseModules, useRelatedCourses, useEnrollmentCheck } from "../hooks";
import { CourseHero } from "./CourseHero";
import { CourseInformation } from "./CourseInformation";
import { LearningOutcomes } from "./LearningOutcomes";
import { CourseRequirements } from "./CourseRequirements";
import { CourseStats } from "./CourseStats";
import { InstructorCard } from "./InstructorCard";
import { CurriculumSection } from "./CurriculumSection";
import { SubscriptionCta } from "./SubscriptionCta";
import { RelatedCourses } from "./RelatedCourses";
import { PurchaseSidebar } from "./PurchaseSidebar";
import { MobilePurchaseBar } from "./MobilePurchaseBar";
import { LockedModal } from "./LockedModal";
import { PurchaseCourseModal } from "./PurchaseCourseModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/hooks/useAuthStatus";

const PublicLoginCard = dynamic(
  () =>
    import("@/features/auth/components/PublicLoginCard").then(
      (m) => m.PublicLoginCard,
    ),
  { ssr: false },
);

interface Props {
  slug: string;
}

function CoursePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-[520px] w-full sm:h-[600px]" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-12">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-9 w-2/3 sm:w-72" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <Skeleton className="h-[520px] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicCoursePage({ slug }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useCurrentUser();
  const [lockedModalOpen, setLockedModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const { data: course, isLoading: courseLoading } = usePublicCourse(slug);
  const { data: modules, isLoading: modulesLoading } = usePublicCourseModules(slug);
  const { data: relatedCourses } = useRelatedCourses(slug);
  const { data: enrollment } = useEnrollmentCheck(slug, isAuthenticated);

  const isEnrolled = enrollment?.enrolled ?? false;

  const handleEnroll = useCallback(() => {
    if (isEnrolled) {
      router.push("/student/dashboard");
      return;
    }
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    setPurchaseModalOpen(true);
  }, [isEnrolled, isAuthenticated, router]);

  const handleLogin = useCallback(() => {
    setLoginOpen(true);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setLoginOpen(false);
    setPurchaseModalOpen(true);
  }, []);

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
      <CourseHero course={course} isEnrolled={isEnrolled} onEnroll={handleEnroll} onLogin={handleLogin} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          {/* Main content */}
          <div className="min-w-0 space-y-14">
            <CourseInformation
              description={course.description}
              fullDescription={course.fullDescription}
              targetAudience={course.targetAudience}
              objectives={course.learningOutcomes}
            />

            {course.learningOutcomes.length > 0 && (
              <LearningOutcomes outcomes={course.learningOutcomes} />
            )}

            {course.requirements.length > 0 && (
              <CourseRequirements requirements={course.requirements} />
            )}

            <CourseStats course={course} modules={modules} />

            {course.instructor && <InstructorCard instructor={course.instructor} />}

            {modulesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-64" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : modules && modules.length > 0 ? (
              <CurriculumSection
                modules={modules}
                isEnrolled={isEnrolled}
                onLockedClick={handleLockedClick}
              />
            ) : null}

            <SubscriptionCta onEnroll={handleEnroll} />
          </div>

          {/* Sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <PurchaseSidebar course={course} isEnrolled={isEnrolled} onEnroll={handleEnroll} />
            </div>
          </aside>
        </div>
      </div>

      {relatedCourses && relatedCourses.length > 0 && (
        <div className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <RelatedCourses courses={relatedCourses} />
          </div>
        </div>
      )}

      <MobilePurchaseBar course={course} isEnrolled={isEnrolled} onEnroll={handleEnroll} />

      <LockedModal
        isOpen={lockedModalOpen}
        onClose={() => setLockedModalOpen(false)}
        onEnroll={handleEnroll}
        onLogin={handleLogin}
      />

      <PurchaseCourseModal
        open={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        course={course}
      />

      <PublicLoginCard
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
