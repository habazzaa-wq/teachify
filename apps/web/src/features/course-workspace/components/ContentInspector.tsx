"use client";

import { motion } from "framer-motion";
import {
  Video,
  FileText,
  FileSpreadsheet,
  PenTool,
  Headphones,
  FolderOpen,
  Radio,
  ExternalLink,
  Box,
  Clock,
  Globe,
  Lock,
  CheckCircle2,
  CircleDashed,
  FileType,
  Link,
  Monitor,
  Puzzle,
  ClipboardList,
  Eye,
  Calendar,
  User,
  Tag,
  Award,
} from "lucide-react";
import { AppBadge } from "@/components/ui";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

interface ContentInspectorProps {
  item: ContentItem;
  compact?: boolean;
}

const typeMeta: Record<ContentItemType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  video: { label: "فيديو", icon: Video, color: "text-blue-500 bg-blue-500/10", description: "محتوى فيديو تعليمي" },
  pdf: { label: "PDF", icon: FileType, color: "text-rose-500 bg-rose-500/10", description: "ملف PDF قابل للعرض" },
  exam: { label: "اختبار", icon: ClipboardList, color: "text-secondary bg-secondary/10", description: "اختبار تفاعلي للطلاب" },
  assignment: { label: "واجب", icon: PenTool, color: "text-amber-500 bg-amber-500/10", description: "واجب للتقييم والتسليم" },
  audio: { label: "صوت", icon: Headphones, color: "text-emerald-500 bg-emerald-500/10", description: "ملف صوتي أو بودكاست" },
  resource: { label: "مورد", icon: FolderOpen, color: "text-cyan-500 bg-cyan-500/10", description: "مرفقات وملفات إضافية" },
  live: { label: "جلسة مباشرة", icon: Monitor, color: "text-red-500 bg-red-500/10", description: "جلسة تفاعلية عبر البث المباشر" },
  scorm: { label: "SCORM", icon: Puzzle, color: "text-indigo-500 bg-indigo-500/10", description: "محتوى SCORM تفاعلي متقدم" },
  external_link: { label: "رابط خارجي", icon: Link, color: "text-sky-500 bg-sky-500/10", description: "رابط لمحتوى خارجي" },
  certificate: { label: "شهادة", icon: Award, color: "text-yellow-500 bg-yellow-500/10", description: "شهادة إتمام الدورة" },
};

function VideoPreview({ item, compact }: { item: ContentItem; compact?: boolean }) {
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="aspect-video rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center border border-border/40">
          <Video className="h-10 w-10 text-blue-500/30" />
        </div>
        {item.description && <p className="text-xs text-muted-foreground/70">{item.description}</p>}
        {item.mediaId && <p className="text-[10px] text-muted-foreground/40">معرف الوسائط: {item.mediaId}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center border border-border/50">
        <div className="text-center space-y-3">
          <Video className="h-16 w-16 text-blue-500/30 mx-auto" />
          <p className="text-sm text-muted-foreground/50">معاينة الفيديو</p>
          {item.mediaId && <p className="text-xs text-muted-foreground/30">معرف الوسائط: {item.mediaId}</p>}
        </div>
      </div>
      {item.description && (
        <p className="text-sm text-muted-foreground/70 leading-relaxed">{item.description}</p>
      )}
      <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4">
        <p className="text-xs text-muted-foreground/60">هذا امتداد لاختيار فيديو موجود. يمكن ربط وسائط من مكتبة الوسائط.</p>
      </div>
    </div>
  );
}

function PdfPreview({ item, compact }: { item: ContentItem; compact?: boolean }) {
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="aspect-[3/4] max-h-[200px] rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 flex items-center justify-center border border-border/40">
          <FileText className="h-10 w-10 text-rose-500/30" />
        </div>
        {item.description && <p className="text-xs text-muted-foreground/70">{item.description}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="aspect-[3/4] max-h-[500px] rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 flex items-center justify-center border border-border/50">
        <div className="text-center space-y-3">
          <FileText className="h-16 w-16 text-rose-500/30 mx-auto" />
          <p className="text-sm text-muted-foreground/50">معاينة PDF</p>
        </div>
      </div>
      {item.description && <p className="text-sm text-muted-foreground/70">{item.description}</p>}
    </div>
  );
}

function ExamPreview({ item, compact }: { item: ContentItem; compact?: boolean }) {
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 p-4 border border-border/50", compact ? "p-3" : "p-6")}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-xl bg-secondary/10 shrink-0", compact ? "p-1.5" : "p-3")}>
          <FileSpreadsheet className={cn(compact ? "h-4 w-4" : "h-6 w-6", "text-secondary")} />
        </div>
        <div>
          <h4 className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>اختبار</h4>
          <p className={cn("text-muted-foreground/50 mt-1", compact ? "text-[10px]" : "text-xs")}>
            هذا المحتوى من نوع اختبار. يمكن إدارة الأسئلة والإعدادات من شاشة إدارة الاختبارات.
          </p>
          {item.examId && <p className="text-[10px] text-muted-foreground/40 mt-2">معرف الاختبار: {item.examId}</p>}
        </div>
      </div>
      {!compact && item.description && <p className="text-sm text-muted-foreground/70 mt-4">{item.description}</p>}
    </div>
  );
}

function AssignmentPreview({ item, compact }: { item: ContentItem; compact?: boolean }) {
  return <GenericPreview item={item} compact={compact} />;
}

function GenericPreview({ item, compact }: { item: ContentItem; compact?: boolean }) {
  const meta = typeMeta[item.type] ?? typeMeta.resource;
  const Icon = meta.icon;

  return (
    <div className={cn(
      "rounded-2xl border border-border/50 flex flex-col items-center justify-center text-center gap-3",
      meta.color,
      compact ? "p-4" : "p-8",
    )}>
      <div className={cn("rounded-2xl bg-background/50 flex items-center justify-center", compact ? "p-2" : "p-4")}>
        <Icon className={compact ? "h-8 w-8" : "h-12 w-12"} />
      </div>
      <div>
        <h4 className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>{meta.label}</h4>
        <p className={cn("text-muted-foreground/60 mt-1", compact ? "text-[10px]" : "text-xs")}>{meta.description}</p>
      </div>
      {item.description && <p className={cn("text-muted-foreground/70", compact ? "text-[10px]" : "text-xs")}>{item.description}</p>}
      {!compact && item.type === "external_link" && item.externalUrl && (
        <p className="text-xs text-muted-foreground/40 truncate max-w-full">{item.externalUrl}</p>
      )}
    </div>
  );
}

function ContentInspector({ item, compact = false }: ContentInspectorProps) {
  const previewMap: Record<ContentItemType, React.ComponentType<{ item: ContentItem; compact?: boolean }>> = {
    video: VideoPreview,
    pdf: PdfPreview,
    exam: ExamPreview,
    assignment: AssignmentPreview,
    audio: GenericPreview,
    resource: GenericPreview,
    live: GenericPreview,
    scorm: GenericPreview,
    external_link: GenericPreview,
    certificate: GenericPreview,
  };

  const PreviewComponent = previewMap[item.type] ?? GenericPreview;
  const meta = typeMeta[item.type] ?? typeMeta.resource;
  const Icon = meta.icon;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn("p-1.5 rounded-lg", meta.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold truncate">{item.title}</h4>
            <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
              <span>{meta.label}</span>
              {item.duration != null && item.duration > 0 && (
                <>
                  <span>·</span>
                  <span>{Math.round(item.duration / 60)}د</span>
                </>
              )}
            </p>
          </div>
        </div>

        <PreviewComponent item={item} compact />

        <div className="space-y-2 pt-2 border-t border-border/20">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground/50">الحالة</span>
            <span className={cn(
              "font-medium flex items-center gap-1",
              item.status === "published" ? "text-emerald-500" : "text-amber-500",
            )}>
              {item.status === "published" ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
              {item.status === "published" ? "منشور" : "مسودة"}
            </span>
          </div>
          {item.freePreview && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground/50">معاينة مجانية</span>
              <span className="font-medium text-emerald-500 flex items-center gap-1">
                <Globe className="h-3 w-3" />مفعلة
              </span>
            </div>
          )}
          {item.locked && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground/50">مقفل</span>
              <Lock className="h-3 w-3 text-muted-foreground/40" />
            </div>
          )}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground/50">النوع</span>
            <span className="text-muted-foreground/70">{meta.label}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground/50">تاريخ الإنشاء</span>
            <span className="text-muted-foreground/70">{formatDate(item.createdAt)}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-8 max-w-3xl"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl", meta.color)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">{item.title}</h2>
              <AppBadge
                variant={item.status === "published" ? "success" : "secondary"}
                className="text-[10px]"
              >
                {item.status === "published" ? "منشور" : "مسودة"}
              </AppBadge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
              <span className="flex items-center gap-1">{meta.label}</span>
              {item.duration != null && item.duration > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {Math.round(item.duration / 60)} دقيقة
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
        <div className="flex items-center gap-2 shrink-0">
          {item.freePreview && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <Globe className="h-3 w-3" />
              مجاني
            </span>
          )}
          {item.locked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 bg-muted/20 px-2 py-1 rounded-full border border-border/30">
              <Lock className="h-3 w-3" />
              مقفل
            </span>
          )}
        </div>
      </div>

      {/* PREVIEW */}
      <PreviewComponent item={item} />

      {/* PROPERTIES */}
      <div className="rounded-2xl border border-border/40 bg-card p-6">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground/50" />
          الخصائص
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-1">النوع</p>
            <p className="text-xs font-medium">{meta.label}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-1">الحالة</p>
            <p className="text-xs font-medium">{item.status === "published" ? "منشور" : "مسودة"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-1">الظهور</p>
            <p className="text-xs font-medium">{item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-1">المدة</p>
            <p className="text-xs font-medium">{item.duration ? `${Math.round(item.duration / 60)} د` : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-1">معاينة مجانية</p>
            <p className="text-xs font-medium">{item.freePreview ? "مفعلة" : "غير مفعلة"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-1">مقفل</p>
            <p className="text-xs font-medium">{item.locked ? "نعم" : "لا"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-1">تاريخ الإنشاء</p>
            <p className="text-xs font-medium">{formatDate(item.createdAt)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-1">آخر تحديث</p>
            <p className="text-xs font-medium">{formatDate(item.updatedAt)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { ContentInspector };
