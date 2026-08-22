"use client";

import { useMemo } from "react";
import {
  PlayCircle, FileText, Download, Layers, MessageSquare,
  Award, Infinity, RefreshCw, Shield, Heart, Lock, Crown, Sparkles, Users,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { PublicCourse } from "@/features/public-course/types";

interface SidebarProps {
  course: PublicCourse;
  isEnrolled: boolean;
}

export function Sidebar({ course, isEnrolled }: SidebarProps) {
  const isFree = course.pricingType === "free";
  const hasDiscount =
    !isFree &&
    course.discountPrice != null &&
    course.price != null &&
    course.discountPrice < course.price;

  const displayPrice = isFree ? 0 : (course.discountPrice ?? course.price ?? 0);
  const originalPrice = course.price ?? 0;
  const currency = course.currency ?? "جنيه";

  const discountPercent = useMemo(() => {
    if (!hasDiscount || !originalPrice || !course.discountPrice) return 0;
    return Math.round(((originalPrice - course.discountPrice) / originalPrice) * 100);
  }, [hasDiscount, originalPrice, course.discountPrice]);

  const courseIncludes = [
    { icon: PlayCircle, text: `${formatNumber(course.lessonsCount)} درس` },
    { icon: Layers, text: `${formatNumber(course.sectionsCount)} وحدة تعليمية` },
    course.duration
      ? { icon: FileText, text: `${Math.round(course.duration / 3600)}+ ساعة محتوى` }
      : null,
    { icon: Download, text: "ملفات مصدرية وقوالب للتحميل" },
    { icon: MessageSquare, text: "دعم واسئلة واجوبة" },
    course.certificateEnabled ? { icon: Award, text: "شهادة إتمام معتمدة" } : null,
    { icon: Infinity, text: "وصول مدى الحياة" },
    { icon: RefreshCw, text: "تحديثات مجانية مستمرة" },
  ].filter(Boolean) as { icon: React.ElementType; text: string }[];

  return (
    <div className="sticky top-24 space-y-5">
      {/* Price card */}
      <div className="course-card p-6 space-y-5">
        {/* Price */}
        <div className="space-y-2">
          {isFree ? (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-emerald-500">مجاني</span>
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold course-accent-text">
                {formatNumber(displayPrice)} {currency}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base font-medium line-through course-text-tertiary">
                    {formatNumber(originalPrice)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-500">
                    خصم {discountPercent}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Primary CTA */}
        {isEnrolled ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:bg-emerald-600"
          >
            <PlayCircle className="h-4 w-4" />
            ابدأ التعلم
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[rgba(0,0,0,0.25)] transition-all duration-300 hover:shadow-xl hover:shadow-[rgba(0,0,0,0.3)]"
          >
            اشتراك الآن
            <Lock className="h-4 w-4" />
          </button>
        )}

        {/* Secondary CTA */}
        {!isEnrolled && (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--course-card-border)] bg-transparent px-6 py-3.5 text-sm font-semibold transition-all duration-300 hover:bg-[var(--course-icon-bg)] course-text-primary"
          >
            أضف إلى المفضلة
            <Heart className="h-4 w-4" />
          </button>
        )}

        {/* What's included */}
        <div className="space-y-4 pt-3 border-t border-[var(--course-card-border)]">
          <h3 className="text-sm font-bold course-text-primary">تشمل الدورة</h3>
          <ul className="space-y-3">
            {courseIncludes.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <item.icon className="h-4 w-4 shrink-0 mt-0.5 course-accent-text" />
                <span className="text-sm course-text-secondary">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Students count */}
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--course-icon-bg)] px-4 py-2.5">
          <Users className="h-3.5 w-3.5 course-text-secondary" />
          <span className="text-xs course-text-secondary">
            {formatNumber(course.studentsCount)} طالب مسجّل
          </span>
        </div>
      </div>

      {/* Money-back guarantee */}
      <div className="course-card flex items-center gap-3 p-4">
        <Shield className="h-8 w-8 shrink-0 course-accent-text" />
        <div>
          <p className="text-xs font-semibold course-text-primary">ضمان استرجاع الأموال</p>
          <p className="text-xs course-text-secondary">30 يوم ضمان استرجاع كامل</p>
        </div>
      </div>
    </div>
  );
}
