"use client";

import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  FileType,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Headphones,
  Link,
  Lock,
  Monitor,
  Pencil,
  Puzzle,
  Video,
} from "lucide-react";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioSurfaceCard } from "@/components/studio/surfaces/StudioSurfaceCard";
import { cn } from "@/lib/cn";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";

const TYPE_META: Record<ContentItemType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  video: { label: "فيديو", icon: Video, color: "text-secondary", bg: "bg-secondary/10" },
  image: { label: "الصور", icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  pdf: { label: "PDF", icon: FileType, color: "text-red-500", bg: "bg-red-500/10" },
  exam: { label: "اختبار", icon: ClipboardList, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  assignment: { label: "واجب", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" },
  resource: { label: "مورد", icon: FolderOpen, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  audio: { label: "صوت", icon: Headphones, color: "text-pink-500", bg: "bg-pink-500/10" },
  live: { label: "جلسة مباشرة", icon: Monitor, color: "text-rose-500", bg: "bg-rose-500/10" },
  scorm: { label: "SCORM", icon: Puzzle, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  external_link: { label: "رابط خارجي", icon: Link, color: "text-blue-500", bg: "bg-blue-500/10" },
  certificate: { label: "شهادة", icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  session: { label: "جلسة", icon: Calendar, color: "text-teal-500", bg: "bg-teal-500/10" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
};

interface CourseStudioContentOverviewProps {
  item: ContentItem;
  onEdit?: () => void;
  className?: string;
}

function PreviewStage({ item }: { item: ContentItem }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.resource;
  const Icon = meta.icon;

  return (
    <div className="nova-preview-stage">
      <div className="max-w-md">
        <div className={cn("mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl", meta.bg)}>
          <Icon className={cn("h-10 w-10", meta.color)} />
        </div>
        <h3 className="text-lg font-extrabold text-studio-fg">{meta.label}</h3>
        <p className="mt-2 text-sm leading-relaxed text-studio-fg-muted">
          {item.mediaId
            ? "تم ربط هذا المحتوى بوسائط من المكتبة."
            : "هذا امتداد لاختيار المحتوى موجود. يمكن ربط المحتوى من الوحدة المخصصة."}
        </p>
        {item.externalUrl && (
          <p className="mt-3 truncate text-xs text-studio-fg-subtle" dir="ltr">{item.externalUrl}</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] font-bold text-studio-fg-subtle">
          {item.mediaId && <span className="rounded-full bg-white px-3 py-1">معرف الوسائط: {item.mediaId}</span>}
          {item.examId && <span className="rounded-full bg-white px-3 py-1">معرف الاختبار: {item.examId}</span>}
        </div>
      </div>
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
      className={cn("nova-page", className)}
    >
      <motion.section variants={itemVariants} className="nova-editorial-hero p-5 sm:p-7" data-mark="03">
        <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className={cn("nova-hero-icon h-14 w-14", meta.bg)}>
              <Icon className={cn("h-7 w-7", meta.color)} />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="nova-section-label">{meta.label}</p>
                <StudioStatusBadge status={item.status} />
              </div>
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-studio-fg sm:text-3xl">{item.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-studio-fg-muted">
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {displayDuration}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}</span>
                {item.freePreview && <span className="inline-flex items-center gap-1 text-studio-success"><Globe className="h-3.5 w-3.5" /> معاينة مجانية</span>}
                {item.locked && <span className="inline-flex items-center gap-1 text-studio-warning"><Lock className="h-3.5 w-3.5" /> مقفل</span>}
              </div>
            </div>
          </div>
          {onEdit && (
            <StudioButton variant="primary" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} className="nova-primary-btn shrink-0">
              تعديل المحتوى
            </StudioButton>
          )}
        </div>
      </motion.section>

      <motion.div variants={itemVariants} className="my-5">
        <PreviewStage item={item} />
      </motion.div>

      <motion.section variants={itemVariants} className="mb-5">
        <p className="nova-section-label mb-2">وصف المحتوى</p>
        <p className="rounded-2xl border border-studio-border bg-white/80 p-4 text-sm leading-relaxed text-studio-fg-muted">
          {item.description || "لا يوجد وصف"}
        </p>
      </motion.section>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="elevated" padding="md" className="nova-card">
          <p className="nova-section-label mb-4">مواصفات الوحدة</p>
          <div className="nova-meta-grid">
            {[
              ["النوع", meta.label],
              ["الحالة", item.status === "published" ? "منشور" : item.status === "archived" ? "مؤرشف" : "مسودة"],
              ["الظهور", item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"],
              ["المدة", displayDuration],
              ["المعاينة المجانية", item.freePreview ? "مفعلة" : "غير مفعلة"],
              ["القفل", item.locked ? "نعم" : "لا"],
              ["تاريخ الإنشاء", new Date(item.createdAt).toLocaleDateString("ar-SA")],
              ["آخر تحديث", new Date(item.updatedAt).toLocaleDateString("ar-SA")],
            ].map(([label, value]) => (
              <div key={label} className="nova-meta-tile">
                <span className="nova-mini-label">{label}</span>
                <span className="nova-mini-value">{value}</span>
              </div>
            ))}
          </div>
        </StudioSurfaceCard>
      </motion.div>
    </motion.div>
  );
}

export { CourseStudioContentOverview };
