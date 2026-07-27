"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

interface ReviewsSectionProps {
  studentsCount: number;
}

const reviews = [
  {
    name: "محمد العلي",
    rating: 5,
    date: "منذ 3 أيام",
    comment:
      "دورة ممتازة جداً! المدرب يشرح بشكل واضح وعملي. أنصح بها كل من يريد تعلم React من الصفر إلى الاحتراف.",
  },
  {
    name: "سارة أحمد",
    rating: 5,
    date: "منذ أسبوع",
    comment:
      "أفضل دورة تعلمت فيها React. المحتوى منظم والمشاريع العملية تساعد على الفهم العميق. شكراً للمدرب!",
  },
  {
    name: "خالد حسن",
    rating: 4,
    date: "منذ أسبوعين",
    comment:
      "محتوى غني وشامل. أتمنى لو كان هناك المزيد من المشاريع المتقدمة في الجزء الأخير من الدورة.",
  },
];

function Stars({ count, size = "sm" }: { count: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i < count
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700",
          )}
        />
      ))}
    </div>
  );
}

export function ReviewsSection({ studentsCount }: ReviewsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold course-text-primary">التقييمات</h2>
      </div>

      {/* Reviews note — no reviews API exists */}
      <div className="course-card p-6 text-center space-y-3">
        <div className="flex justify-center">
          <Stars count={5} size="lg" />
        </div>
        <p className="text-sm course-text-secondary">
          تقييمات الطلاب ستظهر هنا بعد تسجيلهم في الدورة.
        </p>
        <p className="text-xs course-text-tertiary">
          {formatNumber(studentsCount)} طالب مسجّل في هذه الدورة
        </p>
      </div>

      {/* Sample reviews — static placeholders */}
      <div className="space-y-4">
        {reviews.map((review, idx) => (
          <div key={idx} className="course-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--course-icon-bg)] text-sm font-bold course-accent-text">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold course-text-primary">{review.name}</p>
                  <Stars count={review.rating} />
                </div>
              </div>
              <span className="text-xs course-text-tertiary">{review.date}</span>
            </div>
            <p className="text-sm leading-relaxed course-text-secondary">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
