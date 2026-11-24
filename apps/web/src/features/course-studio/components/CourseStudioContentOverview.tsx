"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Eye,
  Lock,
  Calendar,
  Globe,
  Pencil,
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
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioSurfaceCard } from "@/components/studio/surfaces/StudioSurfaceCard";
import { StudioPropertyRow } from "@/components/studio/lists/StudioPropertyRow";
import { cn } from "@/lib/cn";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";

const TYPE_META: Record<ContentItemType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  video: { label: "فيديو", icon: Video },
  pdf: { label: "PDF", icon: FileType },
  exam: { label: "اختبار", icon: ClipboardList },
  assignment: { label: "واجب", icon: FileText },
  resource: { label: "مورد", icon: FolderOpen },
  audio: { label: "صوت", icon: Headphones },
  live: { label: "جلسة مباشرة", icon: Monitor },
  scorm: { label: "SCORM", icon: Puzzle },
  external_link: { label: "رابط خارجي", icon: Link },
  certificate: { label: "شهادة", icon: Award },
  session: { label: "جلسة", icon: Calendar },
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
      "cw3-empty-card flex flex-col items-center justify-center p-12 text-center",
    )}>
      <div className="cw3-hero-icon mb-4 h-16 w-16">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-studio-fg">{meta.label}</h3>
      {item.mediaId ? (
        <p className="max-w-sm text-sm text-studio-fg-muted">
          تم ربط هذا المحتوى بوسائط من المكتبة.
        </p>
      ) : (
        <p className="max-w-sm text-sm text-studio-fg-muted">
          هذا امتداد لاختيار {meta.label} موجود. يمكن ربط المحتوى من الوحدة المخصصة.
        </p>
      )}
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
      className={cn("cw3-page mx-auto w-full max-w-5xl", className)}
    >
      <motion.div variants={itemVariants} className="cw3-hero cw3-full">
        <div className="flex items-center gap-3">
          <div className="cw3-hero-icon h-14 w-14">
            <Icon className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-studio-fg">
                {item.title}
              </h1>
              <StudioStatusBadge status={item.status} />
              {onEdit && (
                <StudioButton variant="ghost" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} className="ms-auto shrink-0">
                  تعديل
                </StudioButton>
              )}
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

      <motion.div variants={itemVariants} className="cw3-full">
        <ExtensionPreview item={item} />
      </motion.div>

      <motion.div variants={itemVariants} className="cw3-primary">
        <h2 className="cw3-section-label mb-3">وصف المحتوى</h2>
        <div className="cw3-card p-4 text-sm leading-relaxed text-studio-fg-muted">
          {item.description || "لا يوجد وصف"}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="cw3-secondary">
        <StudioSurfaceCard variant="elevated" padding="md" className="cw3-card">
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
