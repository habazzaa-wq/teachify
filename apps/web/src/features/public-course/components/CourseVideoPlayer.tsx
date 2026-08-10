"use client";

import { memo, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Clock, MonitorPlay, VideoOff, Loader2 } from "lucide-react";
import { useLessonVideo } from "../hooks";
import { formatDuration } from "../utils";
import { ACCENT } from "../brand";
import type { PublicCourseLesson } from "../types";

interface CourseVideoPlayerProps {
  slug: string;
  lesson: PublicCourseLesson;
  onClose: () => void;
}

function CourseVideoPlayerInner({ slug, lesson, onClose }: CourseVideoPlayerProps) {
  const prefersReduced = useReducedMotion();

  const {
    data: videoData,
    isLoading,
    isFetching,
  } = useLessonVideo(slug, lesson.id);

  const embedUrl = useMemo(() => {
    if (!videoData?.video?.embed_url) return null;
    return `${videoData.video.embed_url}?autoplay=true&preload=true&responsive=true`;
  }, [videoData]);

  const playbackUrl = videoData?.video?.playback_url ?? null;
  const thumbnailUrl = videoData?.video?.thumbnail_url ?? null;

  const hasVideo = !!embedUrl || !!playbackUrl;
  const busy = isLoading || (isFetching && !videoData);

  return (
    <motion.section
      dir="rtl"
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl shadow-black/[0.06] dark:border-white/[0.07]"
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: `linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))`, boxShadow: `0 4px 14px rgb(var(--brand-primary-rgb) / 0.2)` }}
        >
          <MonitorPlay style={{ width: 18, height: 18 }} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 text-sm font-extrabold text-foreground sm:text-base">
            {lesson.title}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/70">
            <span>مشاهدة المحاضرة</span>
            {(lesson.durationSeconds ?? videoData?.video?.duration_seconds) != null && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(lesson.durationSeconds ?? videoData?.video?.duration_seconds)}
              </span>
            )}
            {videoData?.video?.available_resolutions?.length ? (
              <span className="text-muted-foreground/50">
                {videoData.video.available_resolutions.join(" • ")}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق المشغل"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground transition-colors hover:border-[rgb(var(--brand-primary-rgb)/0.3)] hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary-rgb)/0.4)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Player area */}
      <div className="relative aspect-video w-full bg-black">
        <AnimatePresence mode="wait">
          {busy ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0c0d11]"
            >
              <Loader2 className="h-9 w-9 animate-spin" style={{ color: ACCENT }} />
              <p className="text-sm font-semibold text-white/60">جارٍ تجهيز المحاضرة...</p>
              {thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
                />
              )}
            </motion.div>
          ) : hasVideo ? (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={lesson.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : (
                <video
                  key={playbackUrl ?? ""}
                  src={playbackUrl ?? ""}
                  poster={thumbnailUrl ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full"
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0c0d11] px-6 text-center"
            >
              <VideoOff className="h-9 w-9 text-white/30" />
              <p className="text-sm font-bold text-white/70">تعذر تشغيل هذا الفيديو</p>
              <p className="text-xs text-white/40">
                قد يكون الفيديو غير متاح بعد أو أنك لا تملك صلاحية الوصول إليه.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

const CourseVideoPlayer = memo(CourseVideoPlayerInner);

export { CourseVideoPlayer };
export type { CourseVideoPlayerProps };
