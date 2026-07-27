"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import {
  usePublicCourse,
  usePublicCourseModules,
  useEnrollmentCheck,
} from "@/features/public-course/hooks";
import { COURSE_FAQS_DEFAULT } from "@/features/public-course/constants";
import type { PublicCourse, PublicCourseModule } from "@/features/public-course/types";
import { HeroSection } from "./HeroSection";
import { FeaturesBar } from "./FeaturesBar";
import { Sidebar } from "./Sidebar";
import { CourseContentAccordion } from "./CourseContentAccordion";
import { InstructorSection } from "./InstructorSection";
import { ReviewsSection } from "./ReviewsSection";
import { FinalCTA } from "./FinalCTA";

const tabs = [
  { id: "content", label: "محتوى الدورة" },
  { id: "instructor", label: "عن المدرب" },
  { id: "reviews", label: "التقييمات" },
  { id: "faq", label: "الأسئلة الشائعة" },
];

interface CourseDetailPageProps {
  slug: string;
}

function CoursePageSkeleton() {
  return (
    <div className="course-page min-h-screen animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-[var(--course-page-bg)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="h-6 w-28 rounded-full bg-[var(--course-icon-bg)]" />
              <div className="h-10 w-3/4 rounded-lg bg-[var(--course-card-border)]" />
              <div className="h-4 w-full rounded bg-[var(--course-card-border)]" />
              <div className="h-4 w-2/3 rounded bg-[var(--course-card-border)]" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--course-icon-bg)]" />
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-[var(--course-card-border)]" />
                  <div className="h-3 w-36 rounded bg-[var(--course-card-border)]" />
                </div>
              </div>
            </div>
            <div className="aspect-video rounded-2xl bg-[var(--course-card-border)]" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-[var(--course-card-bg)]" />
            ))}
          </div>
          <div className="h-96 rounded-xl bg-[var(--course-card-bg)]" />
        </div>
      </div>
    </div>
  );
}

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold course-text-primary">الأسئلة الشائعة</h2>
      <div className="space-y-3">
        {COURSE_FAQS_DEFAULT.map((faq, idx) => (
          <div key={idx} className="course-card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="flex w-full items-center justify-between px-5 py-4 text-right"
            >
              <span className="text-sm font-semibold course-text-primary">{faq.question}</span>
              <svg
                className={cn(
                  "h-4 w-4 shrink-0 course-text-secondary transition-transform duration-300",
                  openIdx === idx && "rotate-180",
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIdx === idx && (
              <div className="border-t border-[var(--course-card-border)] px-5 py-4">
                <p className="text-sm leading-relaxed course-text-secondary">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CourseDetailPage({ slug }: CourseDetailPageProps) {
  const [activeTab, setActiveTab] = useState("content");

  const { data: course, isLoading: courseLoading } = usePublicCourse(slug);
  const { data: modules, isLoading: modulesLoading } = usePublicCourseModules(slug);
  const { data: enrollment } = useEnrollmentCheck(slug);

  const isEnrolled = enrollment?.enrolled ?? false;

  if (courseLoading || !course) {
    return <CoursePageSkeleton />;
  }

  return (
    <div className="course-page min-h-screen">
      {/* Hero */}
      <HeroSection course={course} />

      {/* Features Bar */}
      <FeaturesBar course={course} />

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
          {/* Main content */}
          <div className="min-w-0 space-y-10">
            {/* Tabs */}
            <div className="border-b border-[var(--course-card-border)]">
              <nav className="flex gap-1 overflow-x-auto" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors duration-200",
                      activeTab === tab.id
                        ? "course-accent-text"
                        : "course-text-secondary hover:text-[var(--course-text-primary)]",
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 inset-x-0 h-0.5 rounded-full bg-[#D87B63]" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab content */}
            {activeTab === "content" && (
              <CourseContentAccordion
                modules={modules ?? []}
                isLoading={modulesLoading}
                isEnrolled={isEnrolled}
              />
            )}
            {activeTab === "instructor" && (
              <InstructorSection instructor={course.instructor} />
            )}
            {activeTab === "reviews" && (
              <ReviewsSection studentsCount={course.studentsCount} />
            )}
            {activeTab === "faq" && <FaqSection />}
          </div>

          {/* Sidebar (desktop) */}
          <div className="hidden lg:block">
            <Sidebar course={course} isEnrolled={isEnrolled} />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:hidden">
        <Sidebar course={course} isEnrolled={isEnrolled} />
      </div>

      {/* Final CTA */}
      <FinalCTA studentsCount={course.studentsCount} />

      {/* Footer spacer */}
      <div className="h-12 bg-[var(--course-card-bg)]" />
    </div>
  );
}
