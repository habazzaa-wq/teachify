"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Eye,
  Lock,
  Calendar,
  Globe,
  Video,
  FileType,
  ClipboardList,
  FileText,
  FolderOpen,
  Headphones,
  Monitor,
  Puzzle,
  Link,
  Award,
} from "lucide-react";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioSurfaceCard } from "@/components/studio/surfaces/StudioSurfaceCard";
import { StudioPropertyRow } from "@/components/studio/lists/StudioPropertyRow";
import { cn } from "@/lib/cn";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";

const TYPE_META: Record<ContentItemType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  video: { label: "فيديو", icon: Video, color: "text-secondary", bg: "bg-secondary/10" },
  pdf: { label: "PDF", icon: FileType, color: "text-red-500", bg: "bg-red-500/10" },
  exam: { label: "اختبار", icon: ClipboardList, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  assignment: { label: "واجب", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" },
  resource: { label: "مورد", icon: FolderOpen, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  audio: { label: "صوت", icon: Headphones, color: "text-pink-500", bg: "bg-pink-500/10" },
  live: { label: "جلسة مباشرة", icon: Monitor, color: "text-rose-500", bg: "bg-rose-500/10" },
  scorm: { label: "SCORM", icon: Puzzle, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  external_link: { label: "رابط خارجي", icon: Link, color: "text-blue-500", bg: "bg-blue-500/10" },
  certificate: { label: "شهادة", icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const easeCurve = [0.22, 1, 0.36, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeCurve },
  },
};

interface CourseStudioContentOverviewProps {
  item: ContentItem;
  onEdit?: () => void;
  className?: string;
}

function ExtensionPreview({ item }: { item: ContentItem }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.resource;
  const Icon = meta.icon;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-2xl border border-studio-border p-12 text-center",
      "bg-gradient-to-br from-transparent via-studio-soft/30 to-transparent",
    )}>
      <div className={cn("mb-4 rounded-2xl p-4", meta.bg)}>
        <Icon className={cn("h-14 w-14", meta.color)} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-studio-fg">{meta.label}</h3>
      <p className="max-w-sm text-sm text-studio-fg-muted">
        هذا امتداد لاختيار {meta.label} موجود. يمكن ربط المحتوى من الوحدة المخصصة.
      </p>
      {item.type === "external_link" && item.externalUrl && (
        <p className="mt-3 text-xs text-studio-fg-subtle truncate max-w-full">{item.externalUrl}</p>
      )}
      {item.mediaId && (
        <p className="mt-2 text-xs text-studio-fg-subtle">معرف الوسائط: {item.mediaId}</p>
      )}
      {item.examId && (
        <p className="mt-2 text-xs text-studio-fg-subtle">معرف الاختبار: {item.examId}</p>
      )}
    </div>
  );
}

function CourseStudioContentOverview({
  item,
  onEdit,
  className,
}: CourseStudioContentOverviewProps) {
  const meta = TYPE_META[item.type] ?? TYPE_META.resource;
  const Icon = meta.icon;
  const displayDuration = item.duration ? `${Math.round(item.duration / 60)} دقيقة` : "—";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("mx-auto w-full max-w-3xl p-6 md:p-8", className)}
    >
      <motion.div variants={itemVariants} className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl ring-4 ring-studio-bg", meta.bg)}>
            <Icon className={cn("h-7 w-7", meta.color)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-studio-fg">
                {item.title}
              </h1>
              <StudioStatusBadge status={item.status} />
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-studio-fg-muted">
              <span>{meta.label}</span>
              {item.duration != null && item.duration > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {displayDuration}
                  </span>
                </>
              )}
              <span>·</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {item.freePreview && (
            <span className="inline-flex items-center gap-1 rounded-full bg-studio-success/10 px-2.5 py-0.5 text-xs text-studio-success">
              <Globe className="h-3.5 w-3.5" />
              معاينة مجانية
            </span>
          )}
          {item.locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-studio-warning/10 px-2.5 py-0.5 text-xs text-studio-warning">
              <Lock className="h-3.5 w-3.5" />
              مقفل
            </span>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <ExtensionPreview item={item} />
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-studio-fg-muted">
          وصف المحتوى
        </h2>
        <p className="text-sm leading-relaxed text-studio-fg-muted">
          {item.description || "لا يوجد وصف"}
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="outline" padding="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-studio-border pb-3">
              <span className="text-sm text-studio-fg-muted">الخصائص</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <StudioPropertyRow label="النوع" value={meta.label} />
              <StudioPropertyRow label="الحالة" value={item.status === "published" ? "منشور" : item.status === "archived" ? "مؤرشف" : "مسودة"} />
              <StudioPropertyRow label="الظهور" value={item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"} />
              <StudioPropertyRow label="المدة" value={displayDuration} />
              <StudioPropertyRow label="معاينة مجانية" value={item.freePreview ? "مفعلة" : "غير مفعلة"} />
              <StudioPropertyRow label="مقفل" value={item.locked ? "نعم" : "لا"} />
              <StudioPropertyRow label="تاريخ الإنشاء" value={new Date(item.createdAt).toLocaleDateString("ar-SA")} />
              <StudioPropertyRow label="آخر تحديث" value={new Date(item.updatedAt).toLocaleDateString("ar-SA")} />
            </div>
          </div>
        </StudioSurfaceCard>
      </motion.div>
    </motion.div>
  );
}

export { CourseStudioContentOverview };
