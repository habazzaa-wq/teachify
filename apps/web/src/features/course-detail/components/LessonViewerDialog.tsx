"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, FileDown, Loader2 } from "lucide-react";
import { publicCourseService } from "@/features/public-course/services";
import type { PublicCourseLesson, PublicCourseLessonFiles, PublicCourseLessonVideo } from "@/features/public-course/types";

interface Props {
  slug: string;
  lesson: PublicCourseLesson | null;
  onClose: () => void;
  onProgressChanged?: () => void;
}

export function LessonViewerDialog({ slug, lesson, onClose, onProgressChanged }: Props) {
  const [video, setVideo] = useState<PublicCourseLessonVideo | null>(null);
  const [files, setFiles] = useState<PublicCourseLessonFiles | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lesson) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCompleted(false);
    setVideo(null);
    setFiles(null);

    (async () => {
      try {
        await publicCourseService.startLessonProgress(lesson.id).catch(() => undefined);
        const [v, f] = await Promise.all([
          lesson.lessonType === "video" || lesson.lessonType === "audio" ? publicCourseService.getLessonVideo(slug, lesson.id) : Promise.resolve(null),
          publicCourseService.getLessonFiles(slug, lesson.id),
        ]);
        if (cancelled) return;
        setVideo(v);
        setFiles(f);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "تعذر تحميل الدرس");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [lesson, slug]);

  if (!lesson) return null;

  const markComplete = async () => {
    setCompleting(true);
    try {
      await publicCourseService.completeLessonProgress(lesson.id);
      setCompleted(true);
      onProgressChanged?.();
    } finally {
      setCompleting(false);
    }
  };

  const embedUrl = video?.video?.embed_url;
  const playbackUrl = video?.video?.playback_url;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-auto p-4" onClick={onClose}>
      <div className="mx-auto my-6 max-w-5xl rounded-2xl bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h3 className="text-lg font-bold">{lesson.title}</h3>
            {lesson.shortDescription && <p className="text-sm text-muted-foreground mt-1">{lesson.shortDescription}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markComplete} disabled={completing || completed} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {completed ? "تم الإكمال" : "تحديد كمكتمل"}
            </button>
            <button onClick={onClose} className="rounded-lg border p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading && <div className="py-16 text-center text-muted-foreground">جارٍ تحميل محتوى الدرس...</div>}
          {error && <div className="rounded-lg bg-red-50 text-red-700 p-3 text-sm">{error}</div>}

          {!loading && (embedUrl || playbackUrl) && (
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              {embedUrl ? (
                <iframe src={embedUrl} className="h-full w-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={lesson.title} />
              ) : (
                <video src={playbackUrl ?? undefined} controls className="h-full w-full" onEnded={() => { if (!completed) markComplete(); }} />
              )}
            </div>
          )}

          {!loading && !embedUrl && !playbackUrl && lesson.lessonType === "video" && (
            <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">لا يوجد فيديو متاح لهذا الدرس حالياً.</div>
          )}

          {!loading && files?.files?.length ? (
            <div className="space-y-2">
              <h4 className="font-bold">ملفات الدرس</h4>
              <div className="grid gap-2">
                {files.files.map((file) => (
                  <a key={file.id} href={file.url ?? "#"} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted">
                    <div>
                      <div className="font-medium text-sm">{file.title || file.fileName || "ملف"}</div>
                      <div className="text-xs text-muted-foreground">{file.extension?.toUpperCase()} {file.sizeBytes ? `• ${Math.round(file.sizeBytes / 1024)} KB` : ""}</div>
                    </div>
                    <FileDown className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {!loading && !video && !files?.files?.length && lesson.lessonType !== "video" && lesson.lessonType !== "audio" && (
            <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">تم فتح الدرس. يمكنك تحديده كمكتمل بعد الانتهاء.</div>
          )}
        </div>
      </div>
    </div>
  );
}
