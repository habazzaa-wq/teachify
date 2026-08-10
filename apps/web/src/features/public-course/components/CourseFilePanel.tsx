"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { X, FileText, FolderOpen, Loader2, Download, FileQuestion, ExternalLink } from "lucide-react";
import { useLessonFiles } from "../hooks";
import { ACCENT } from "../brand";
import { getLessonConfig } from "../utils";
import type { PublicCourseLesson } from "../types";

interface CourseFilePanelProps {
  slug: string;
  lesson: PublicCourseLesson;
  onClose: () => void;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["بايت", "ك.ب", "م.ب", "ج.ب"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value >= 100 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}

function CourseFilePanelInner({ slug, lesson, onClose }: CourseFilePanelProps) {
  const config = getLessonConfig(lesson);
  const TypeIcon = config.icon;

  const { data: filesData, isLoading, isFetching } = useLessonFiles(slug, lesson.id);

  const busy = isLoading || (isFetching && !filesData);
  const files = filesData?.files ?? [];
  const openableFiles = files.filter((file) => file.url);

  return (
    <motion.section
      dir="rtl"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl shadow-black/[0.06] dark:border-white/[0.07]"
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: "var(--brand-primary)", boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}
        >
          <FolderOpen style={{ width: 18, height: 18 }} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 text-sm font-extrabold text-foreground sm:text-base">
            {lesson.title}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/70">
            <span className="inline-flex items-center gap-1">
              <TypeIcon className="h-3 w-3" style={{ color: config.color }} />
              {config.label}
            </span>
            <span>تحميل الملف</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق لوحة الملف"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="min-h-[180px] p-4 sm:p-5">
        {busy ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: ACCENT }} />
            <p className="text-sm font-semibold text-muted-foreground">جاري تحميل الملف...</p>
          </div>
        ) : openableFiles.length > 0 ? (
          <div className="space-y-2.5">
            {openableFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3.5 py-3 transition-colors hover:border-[var(--brand-primary)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${config.color}16` }}>
                  <FileText className="h-5 w-5" style={{ color: config.color }} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold text-foreground/90">
                    {file.title || file.fileName || "ملف"}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
                    {[file.fileName, formatFileSize(file.sizeBytes)].filter(Boolean).join(" • ")}
                  </p>
                </div>

                <a
                  href={file.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-[var(--brand-primary-contrast)] transition-transform duration-200 hover:scale-[1.03]"
                  style={{ background: "var(--brand-primary)" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  فتح الملف
                </a>

                {file.downloadEnabled && (
                  <a
                    href={file.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`تحميل ${file.title || file.fileName || "الملف"}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <FileQuestion className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-bold text-foreground/80">لا توجد ملفات لهذا الدرس</p>
            <p className="text-xs text-muted-foreground/60">
              قد يكون الملف غير متاح بعد أو أنك لا تملك صلاحية الوصول إليه.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

const CourseFilePanel = memo(CourseFilePanelInner);

export { CourseFilePanel };
export type { CourseFilePanelProps };
