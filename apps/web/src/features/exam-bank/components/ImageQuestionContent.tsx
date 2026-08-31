"use client";

import { ScanImageViewer } from "@/features/exam-bank/components/ScanImageViewer";

interface ImageQuestionContentProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  maxHeight?: number;
  showControls?: boolean;
}

/**
 * Canonical renderer for image questions. The uploaded image is the source of
 * truth: we store it, reference it, and render it exactly as-is. No OCR, no
 * Vision, no reconstruction happens here — just a responsive, accessible image.
 *
 * This single component is shared by every question display surface
 * (teacher preview, question bank, student exam, results/review) so image
 * rendering logic is never duplicated.
 */
export function ImageQuestionContent({
  src,
  alt = "صورة السؤال",
  className,
  maxHeight = 500,
  showControls = true,
}: ImageQuestionContentProps) {
  if (!src) {
    return (
      <div
        className={
          "flex items-center justify-center rounded-xl border border-studio-border bg-studio-soft p-8 " +
          (className ?? "")
        }
      >
        <p className="text-sm text-studio-fg-muted">لا توجد صورة للسؤال</p>
      </div>
    );
  }

  return (
    <ScanImageViewer
      src={src}
      alt={alt}
      className={className}
      maxHeight={maxHeight}
      showControls={showControls}
    />
  );
}
