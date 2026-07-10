"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  Layers,
  Clock,
  FileText,
  Eye,
  Lock,
  Calendar,
  Globe,
  Video,
  FileType,
  ClipboardList,
  FolderOpen,
  Headphones,
  Monitor,
  Puzzle,
  Link,
  Award,
  CheckCircle2,
  CircleDashed,
  Pencil,
  Copy,
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioPropertyRow } from "@/components/studio/lists/StudioPropertyRow";
import { cn } from "@/lib/cn";
import type { CourseSection } from "@/features/course-sections/types";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";
import type { CourseModule } from "@/features/course-modules/types";

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

interface CourseStudioInspectorProps {
  open: boolean;
  width: number;
  selectedSection: CourseSection | null;
  selectedContent: ContentItem | null;
  lectures?: CourseModule[];
  onEditSection?: (section: CourseSection) => void;
  onDuplicateSection?: (section: CourseSection) => void;
  onArchiveSection?: (section: CourseSection) => void;
  onDeleteSection?: (section: CourseSection) => void;
  onRestoreSection?: (section: CourseSection) => void;
  onMoveSection?: (section: CourseSection, lectureId: string | null) => void;
  onClose?: () => void;
  className?: string;
}

function ContentProperties({ item }: { item: ContentItem }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.resource;
  const Icon = meta.icon;
  const displayDuration = item.duration ? `${Math.round(item.duration / 60)} دقيقة` : "—";

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.bg)}>
          <Icon className={cn("h-5 w-5", meta.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-studio-fg">
            {item.title}
          </p>
          <p className="text-xs text-studio-fg-muted">{meta.label}</p>
        </div>
      </div>

      <div className="space-y-1 rounded-xl border border-studio-border bg-studio-soft/50 p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-studio-fg-muted mb-2">
          الخصائص
        </h4>
        <StudioPropertyRow
          label="الحالة"
          value={<StudioStatusBadge status={item.status} />}
        />
        <StudioPropertyRow
          label="الظهور"
          value={
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-studio-fg-muted" />
              {item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}
            </span>
          }
        />
        <StudioPropertyRow
          label="معاينة مجانية"
          value={
            <span className={item.freePreview ? "text-studio-success" : "text-studio-fg-muted"}>
              {item.freePreview ? "مفعلة" : "متوقفة"}
            </span>
          }
        />
        <StudioPropertyRow
          label="مقفل"
          value={
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-studio-fg-muted" />
              {item.locked ? "نعم" : "لا"}
            </span>
          }
        />
        <StudioPropertyRow
          label="المدة"
          value={
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-studio-fg-muted" />
              {displayDuration}
            </span>
          }
        />
        <StudioPropertyRow label="الترتيب" value={item.order} />
        <StudioPropertyRow label="النوع" value={meta.label} />
      </div>

      <div className="space-y-1 rounded-xl border border-studio-border bg-studio-soft/50 p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-studio-fg-muted mb-2">
          المعلومات
        </h4>
        <StudioPropertyRow
          label="تاريخ الإنشاء"
          value={
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-studio-fg-muted" />
              {new Date(item.createdAt).toLocaleDateString("ar-SA")}
            </span>
          }
        />
        <StudioPropertyRow
          label="آخر تحديث"
          value={
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-studio-fg-muted" />
              {new Date(item.updatedAt).toLocaleDateString("ar-SA")}
            </span>
          }
        />
      </div>
    </motion.div>
  );
}

function CourseStudioInspector({
  open,
  width,
  selectedSection,
  selectedContent,
  lectures,
  onEditSection,
  onDuplicateSection,
  onArchiveSection,
  onDeleteSection,
  onRestoreSection,
  onMoveSection,
  onClose,
  className,
}: CourseStudioInspectorProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0, minWidth: 0 }}
          animate={{ width, opacity: 1, minWidth: width }}
          exit={{ width: 0, opacity: 0, minWidth: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "shrink-0 overflow-hidden border-s border-studio-border bg-studio-surface",
            className,
          )}
          role="complementary"
          aria-label="لوحة الخصائص"
        >
          <div style={{ width }} className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-studio-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-studio-fg-muted" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-studio-fg">
                  {selectedContent
                    ? "خصائص المحتوى"
                    : selectedSection
                      ? "خصائص القسم"
                      : "خصائص العنصر"}
                </h3>
              </div>
              {onClose && (
                <StudioButton
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="إغلاق لوحة الخصائص"
                >
                  <X className="h-4 w-4" />
                </StudioButton>
              )}
            </div>

            <div className="flex-1 overflow-y-auto studio-scrollbar p-4">
              {selectedContent ? (
                <ContentProperties item={selectedContent} />
              ) : selectedSection ? (
                <motion.div
                  key={selectedSection.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-studio-accent-soft">
                      <Layers className="h-5 w-5 text-studio-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-studio-fg">
                        {selectedSection.title}
                      </p>
                      <StudioStatusBadge status={selectedSection.status} />
                    </div>
                  </div>

                  <div className="space-y-1 rounded-xl border border-studio-border bg-studio-soft/50 p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-studio-fg-muted mb-2">
                      الخصائص
                    </h4>
                    <StudioPropertyRow
                      label="الظهور (الرؤية)"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {selectedSection.freePreview
                            ? "معاينة مجانية"
                            : selectedSection.locked
                              ? "مقفل"
                              : "ظاهر"}
                        </span>
                      }
                    />
                    <StudioPropertyRow
                      label="الحالة"
                      value={<StudioStatusBadge status={selectedSection.status} />}
                    />
                    <StudioPropertyRow
                      label="المدة التقديرية"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {selectedSection.durationMinutes ? `${selectedSection.durationMinutes} دقيقة` : "—"}
                        </span>
                      }
                    />
                    <StudioPropertyRow
                      label="الترتيب"
                      value={selectedSection.order}
                    />
                    <StudioPropertyRow
                      label="عدد المحتوى"
                      value={
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {selectedSection.lessonsCount}
                        </span>
                      }
                    />
                    <StudioPropertyRow
                      label="البيانات الوصفية"
                      value={
                        <span className="text-start text-xs text-studio-fg-muted">
                          {selectedSection.color ? `اللون: ${selectedSection.color}` : "—"}
                          {selectedSection.notes ? " · يوجد ملاحظات" : ""}
                        </span>
                      }
                    />
                  </div>

                  <div className="space-y-1 rounded-xl border border-studio-border bg-studio-soft/50 p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-studio-fg-muted mb-2">
                      المعلومات
                    </h4>
                    <StudioPropertyRow
                      label="تاريخ الإنشاء"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {new Date(selectedSection.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      }
                    />
                    <StudioPropertyRow
                      label="آخر تحديث"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {new Date(selectedSection.updatedAt).toLocaleDateString("ar-SA")}
                        </span>
                      }
                    />
                  </div>

                  <div className="space-y-1 rounded-xl border border-studio-border bg-studio-soft/50 p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-studio-fg-muted mb-2">
                      الإجراءات
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <StudioButton
                        variant="secondary"
                        size="sm"
                        icon={<Pencil className="h-4 w-4" />}
                        onClick={() => onEditSection?.(selectedSection)}
                        className="w-full"
                      >
                        تعديل
                      </StudioButton>
                      <StudioButton
                        variant="secondary"
                        size="sm"
                        icon={<Copy className="h-4 w-4" />}
                        onClick={() => onDuplicateSection?.(selectedSection)}
                        className="w-full"
                      >
                        نسخ
                      </StudioButton>
                      {!selectedSection.deletedAt && (
                        <StudioButton
                          variant="secondary"
                          size="sm"
                          icon={<Archive className="h-4 w-4" />}
                          onClick={() => onArchiveSection?.(selectedSection)}
                          className="w-full"
                        >
                          أرشفة
                        </StudioButton>
                      )}
                      {selectedSection.deletedAt && (
                        <StudioButton
                          variant="soft"
                          size="sm"
                          icon={<RotateCcw className="h-4 w-4" />}
                          onClick={() => onRestoreSection?.(selectedSection)}
                          className="w-full"
                        >
                          استعادة
                        </StudioButton>
                      )}
                      <StudioButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => onDeleteSection?.(selectedSection)}
                        className="col-span-2 w-full"
                      >
                        حذف
                      </StudioButton>
                    </div>

                    {onMoveSection && (
                      <div className="mt-3 border-t border-studio-border pt-3">
                        <p className="mb-2 text-xs font-medium text-studio-fg-muted">
                          نقل إلى محاضرة
                        </p>
                        <select
                          aria-label="نقل القسم إلى محاضرة"
                          defaultValue={selectedSection.courseModuleId ?? ""}
                          onChange={(e) =>
                            onMoveSection(
                              selectedSection,
                              e.target.value === "" ? null : e.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-studio-border bg-studio-surface px-3 py-2 text-sm text-studio-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
                        >
                          <option value="">بدون محاضرة</option>
                          {(lectures ?? []).map((lecture) => (
                            <option key={lecture.id} value={lecture.id}>
                              {lecture.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-3"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-studio-soft">
                      <Settings className="h-7 w-7 text-studio-fg-subtle" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-studio-fg">
                        خصائص العنصر
                      </p>
                      <p className="mt-1 text-xs text-studio-fg-muted">
                        اختر عنصراً لعرض خصائصه
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export { CourseStudioInspector };
