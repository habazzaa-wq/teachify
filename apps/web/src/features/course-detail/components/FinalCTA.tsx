"use client";

import { Lock } from "lucide-react";
import { formatNumber } from "@/lib/format";

interface FinalCTAProps {
  studentsCount: number;
}

export function FinalCTA({ studentsCount }: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden border-t border-[var(--course-card-border)]" style={{
      background: "linear-gradient(180deg, var(--course-hero-gradient-from) 0%, var(--course-hero-gradient-via) 50%, var(--course-hero-gradient-to) 100%)",
    }}>
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Content */}
          <div className="text-center lg:text-right space-y-5">
            <h2 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl course-text-primary">
              ابدأ رحلتك الاحترافية الآن
            </h2>
            <p className="mx-auto max-w-lg text-base course-text-secondary sm:text-lg">
              انضم إلى أكثر من {formatNumber(studentsCount)} طالب وابدأ تطوير مهاراتك اليوم
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-[#BF6D58] to-[#a85a47] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#BF6D58]/25 transition-all duration-300 hover:from-[#a85a47] hover:to-[#BF6D58] hover:shadow-xl hover:shadow-[#BF6D58]/30 hover:-translate-y-0.5"
            >
              اشتراك الآن
              <Lock className="h-4 w-4" />
            </button>
          </div>

          {/* Illustration */}
          <div className="relative flex items-center justify-center">
            <div className="relative h-56 w-72 sm:h-64 sm:w-80">
              {/* Laptop */}
              <div className="absolute inset-x-4 bottom-0 h-40 rounded-t-xl border-2 border-[var(--course-card-border)] bg-[var(--course-page-bg)]">
                <div className="flex items-center justify-center h-full">
                  <div className="space-y-2 text-center">
                    <div className="mx-auto h-2 w-16 rounded bg-[var(--course-icon-bg)]" />
                    <div className="mx-auto h-2 w-12 rounded bg-[var(--course-icon-bg)]" />
                    <div className="mx-auto h-2 w-20 rounded bg-[var(--course-icon-bg)]" />
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-3 rounded-b-lg bg-[var(--course-card-border)]" />

              {/* Floating icons */}
              <div
                className="absolute -top-2 -end-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D87B63]/20 bg-[var(--course-card-bg)] shadow-lg"
                style={{ animation: "float-soft 3s ease-in-out infinite" }}
              >
                <span className="text-sm font-bold course-accent-text">&lt;/&gt;</span>
              </div>

              <div
                className="absolute top-8 -start-6 flex h-10 w-10 items-center justify-center rounded-xl border border-[#D87B63]/20 bg-[var(--course-card-bg)] shadow-lg"
                style={{ animation: "float-soft 3s ease-in-out infinite 0.5s" }}
              >
                <span className="text-sm font-bold course-accent-text">{"{}"}</span>
              </div>

              <div
                className="absolute -top-4 start-12 flex h-11 w-11 items-center justify-center rounded-xl border border-[#D87B63]/20 bg-[var(--course-card-bg)] shadow-lg"
                style={{ animation: "float-soft 3s ease-in-out infinite 1s" }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#D87B63">
                  <circle cx="12" cy="12" r="2" />
                  <g stroke="#D87B63" fill="none" strokeWidth="1">
                    <ellipse cx="12" cy="12" rx="10" ry="4" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
                  </g>
                </svg>
              </div>

              <div
                className="absolute bottom-16 -end-8 flex h-10 w-14 items-center justify-center rounded-lg border border-[#D87B63]/15 bg-[var(--course-card-bg)] shadow-md"
                style={{ animation: "float-soft 3s ease-in-out infinite 1.5s" }}
              >
                <span className="text-[10px] font-bold course-accent-text">JS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
