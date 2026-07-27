"use client";

import { Users, Briefcase, Zap, MonitorSmartphone, Award } from "lucide-react";
import type { PublicCourse } from "@/features/public-course/types";

interface FeaturesBarProps {
  course: PublicCourse;
}

export function FeaturesBar({ course }: FeaturesBarProps) {
  const features = [
    { icon: Users, label: `${course.studentsCount > 0 ? `${course.studentsCount}+` : ""} طالب` },
    { icon: Briefcase, label: "محتوى جاهز للعمل" },
    { icon: Zap, label: "تعلم بالسرعة التي تناسبك" },
    { icon: MonitorSmartphone, label: "تعلم على أي جهاز" },
  ];

  if (course.certificateEnabled) {
    features.push({ icon: Award, label: "شهادة إتمام" });
  }

  return (
    <section className="border-y border-[var(--course-card-border)] bg-[var(--course-card-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
          {features.map((feature) => (
            <div key={feature.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--course-icon-bg)]">
                <feature.icon className="h-5 w-5 course-accent-text" />
              </div>
              <span className="text-sm font-medium course-text-primary">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
