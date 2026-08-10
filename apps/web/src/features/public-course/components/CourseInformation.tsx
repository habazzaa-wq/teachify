"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { FileText, Users, Target, BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "./primitives";

interface CourseInformationProps {
  description: string | null;
  fullDescription: string | null;
  targetAudience: string[];
  objectives: string[];
}

function CourseInformationInner({
  description,
  fullDescription,
  targetAudience,
  objectives,
}: CourseInformationProps) {
  const html = fullDescription || description;

  const hasAny =
    !!html || targetAudience.length > 0 || objectives.length > 0;

  if (!hasAny) {
    return null;
  }

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" as const },
    transition: { duration: 0.45, ease: "easeOut" as const },
  };

  return (
    <motion.section {...fadeUp} className="scroll-mt-24">
      <SectionHeader
        icon={<FileText className="h-5 w-5" />}
        title="عن هذه الدورة"
        subtitle="كل ما تحتاج معرفته قبل الاشتراك"
        className="mb-6"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Long description */}
        {html && (
          <div
            className={cn(
              "rounded-3xl border border-border/60 bg-card p-6 shadow-sm shadow-black/[0.02] sm:p-8 lg:col-span-2",
            )}
          >
            <div
              dir="rtl"
              className={cn(
                "prose prose-slate dark:prose-invert max-w-none",
                "prose-headings:font-bold prose-headings:tracking-tight",
                "prose-h2:text-xl prose-h2:mt-7 prose-h2:mb-3 prose-h2:text-foreground",
                "prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-foreground",
                "prose-p:leading-relaxed prose-p:text-muted-foreground prose-p:mt-0 prose-p:mb-4",
                "prose-a:text-[var(--brand-primary)] prose-a:no-underline hover:prose-a:underline",
                "prose-strong:text-foreground",
                "prose-ul:my-4 prose-ul:space-y-1.5",
                "prose-li:text-muted-foreground prose-li:marker:text-[var(--brand-primary)]",
                "prose-blockquote:border-[rgb(var(--brand-primary-rgb)/0.3)] prose-blockquote:text-muted-foreground",
                "prose-img:rounded-2xl",
              )}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}

        {/* Side stack: audience + objectives teaser */}
        <div className="flex flex-col gap-5">
          {targetAudience.length > 0 && (
            <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card to-[rgb(var(--brand-primary-rgb)/0.04)] p-6 shadow-sm shadow-black/[0.02]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--brand-primary-rgb)/0.1)] text-[var(--brand-primary)]">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">لمن هذه الدورة؟</h3>
              </div>
              <ul className="space-y-3">
                {targetAudience.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--brand-primary)" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {objectives.length > 0 && (
            <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card to-[rgb(var(--brand-secondary-rgb)/0.05)] p-6 shadow-sm shadow-black/[0.02]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--brand-secondary-rgb)/0.12)] text-[var(--brand-secondary-contrast)]">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">أهداف الدورة</h3>
              </div>
              <ul className="space-y-3">
                {objectives.slice(0, 4).map((objective, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

const CourseInformation = memo(CourseInformationInner);

export { CourseInformation };
export type { CourseInformationProps };
