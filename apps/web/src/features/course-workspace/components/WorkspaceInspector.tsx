"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Video,
  FileText,
  Globe,
  Lock,
  Tag,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  CircleDashed,
  Sparkles,
  DollarSign,
  Users,
  Star,
  FileSpreadsheet,
  PenTool,
  Headphones,
  FolderOpen,
  Monitor,
  ExternalLink,
  Box,
  Award,
  FileType,
  Puzzle,
  ClipboardList,
  Link,
  PanelRightClose,
  Search,
  Settings,
  Share2,
} from "lucide-react";
import { AppBadge, AppSwitch, Label, AppButton } from "@/components/ui";
import { useWorkspaceStore } from "../store";
import type { CourseModule, CourseModuleSection, ContentItem } from "@/features/course-content/types";
import type { Course } from "@/features/courses/types";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber } from "@/lib/format";
import {
  COURSE_STATUS_CONFIG,
  COURSE_DIFFICULTY_CONFIG,
  COURSE_VISIBILITY_CONFIG,
  PRICING_TYPE_CONFIG,
} from "@/features/courses/constants";

const contentTypeMeta: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  video: { label: "فيديو", icon: Video, color: "text-blue-500 bg-blue-500/10" },
  pdf: { label: "PDF", icon: FileType, color: "text-rose-500 bg-rose-500/10" },
  exam: { label: "اختبار", icon: ClipboardList, color: "text-secondary bg-secondary/10" },
  assignment: { label: "واجب", icon: PenTool, color: "text-amber-500 bg-amber-500/10" },
  audio: { label: "صوت", icon: Headphones, color: "text-emerald-500 bg-emerald-500/10" },
  resource: { label: "مورد", icon: FolderOpen, color: "text-cyan-500 bg-cyan-500/10" },
  live: { label: "جلسة مباشرة", icon: Monitor, color: "text-red-500 bg-red-500/10" },
  scorm: { label: "SCORM", icon: Puzzle, color: "text-indigo-500 bg-indigo-500/10" },
  external_link: { label: "رابط خارجي", icon: Link, color: "text-sky-500 bg-sky-500/10" },
  certificate: { label: "شهادة", icon: Award, color: "text-yellow-500 bg-yellow-500/10" },
};

interface WorkspaceInspectorProps {
  course?: Course | null;
  moduleTree?: CourseModule[];
}

function PropertyRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className="text-[11px] font-medium text-end max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-4 mb-4 border-b border-border/20 last:border-0 last:mb-0 last:pb-0">
      <h4 className="text-[10px] font-semibold text-muted-foreground/50 tracking-wider uppercase mb-3">
        {title}
      </h4>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function CourseProperties({ course }: { course: Course }) {
  const statusConfig = COURSE_STATUS_CONFIG[course.status];
  const difficultyConfig = COURSE_DIFFICULTY_CONFIG[course.difficulty];
  const visibilityConfig = COURSE_VISIBILITY_CONFIG[course.visibility];
  const pricingConfig = PRICING_TYPE_CONFIG[course.pricingType];

  return (
    <div className="space-y-1">
      <Section title="الحالة">
        <PropertyRow label="الحالة" value={statusConfig?.label ?? course.status} />
        <PropertyRow label="الظهور" value={visibilityConfig?.label ?? course.visibility} />
        <PropertyRow label="المستوى" value={difficultyConfig?.label ?? course.difficulty} />
        <PropertyRow label="النشر" value={course.publishedAt ? formatDate(course.publishedAt) : "—"} />
      </Section>

      <Section title="التسعير">
        <PropertyRow
          label="السعر"
          value={course.price ? `${formatNumber(course.price)} ${course.currency ?? "ر.س"}` : "مجاني"}
          icon={DollarSign}
        />
        <PropertyRow label="نوع السعر" value={pricingConfig?.label ?? "-"} />
        <PropertyRow label="حد التسجيل" value={course.enrollmentLimit ? formatNumber(course.enrollmentLimit) : "غير محدود"} />
      </Section>

      <Section title="الإحصائيات">
        <PropertyRow label="الطلاب" value={formatNumber(course.studentsCount ?? 0)} icon={Users} />
        <PropertyRow label="الأقسام" value={course.sectionsCount ?? 0} icon={Layers} />
        <PropertyRow label="الدروس" value={course.lessonsCount ?? 0} icon={BookOpen} />
        <PropertyRow label="المدة" value={course.duration ? `${course.duration} د` : "—"} icon={Clock} />
      </Section>

      <Section title="التواريخ">
        <PropertyRow label="الإنشاء" value={formatDate(course.createdAt)} icon={Calendar} />
        <PropertyRow label="آخر تعديل" value={formatDate(course.updatedAt)} icon={Calendar} />
      </Section>

      <Section title="SEO">
        <PropertyRow label="العنوان" value={course.seo?.title || "—"} icon={Search} />
        <PropertyRow label="الوصف" value={course.seo?.description ? "موجود" : "—"} />
        <PropertyRow label="الكلمات" value={course.seo?.keywords || "—"} />
      </Section>

      <Section title="خيارات">
        <PropertyRow label="الشهادة" value={course.certificateEnabled ? "مفعلة" : "غير مفعلة"} icon={Award} />
        <PropertyRow label="مميزة" value={course.featured ? "نعم" : "لا"} icon={Sparkles} />
      </Section>

      {course.requirements.length > 0 && (
        <Section title="المتطلبات">
          {course.requirements.map((req, i) => (
            <p key={i} className="text-[11px] text-muted-foreground/70">{req}</p>
          ))}
        </Section>
      )}

      {course.learningOutcomes.length > 0 && (
        <Section title="مخرجات التعلم">
          {course.learningOutcomes.map((outcome, i) => (
            <p key={i} className="text-[11px] text-muted-foreground/70 flex items-start gap-1.5">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/40 shrink-0" />
              {outcome}
            </p>
          ))}
        </Section>
      )}
    </div>
  );
}

function LectureProperties({ lecture }: { lecture: CourseModule }) {
  const totalContent = lecture.sections.reduce((s, sec) => s + sec.items.length, 0);
  const totalDuration = lecture.sections.reduce((s, sec) => s + (sec.durationMinutes ?? 0), 0);

  return (
    <div className="space-y-1">
      <Section title="الحالة">
        <PropertyRow
          label="الحالة"
          value={
            <span className={cn(
              "inline-flex items-center gap-1",
              lecture.status === "published" ? "text-emerald-500" : "text-amber-500",
            )}>
              {lecture.status === "published" ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
              {lecture.status === "published" ? "منشور" : "مسودة"}
            </span>
          }
        />
      </Section>

      <Section title="الإحصائيات">
        <PropertyRow label="الأقسام" value={lecture.sections.length} icon={Layers} />
        <PropertyRow label="المحتوى" value={totalContent} icon={FileText} />
        <PropertyRow label="المدة" value={totalDuration > 0 ? `${totalDuration} د` : "—"} icon={Clock} />
      </Section>

      <Section title="التواريخ">
        <PropertyRow label="الإنشاء" value={formatDate(lecture.createdAt)} icon={Calendar} />
        <PropertyRow label="آخر تعديل" value={formatDate(lecture.updatedAt)} icon={Calendar} />
      </Section>

      {lecture.description && (
        <Section title="الوصف">
          <p className="text-[11px] text-muted-foreground/70">{lecture.description}</p>
        </Section>
      )}
    </div>
  );
}

function SectionProperties({ section }: { section: CourseModuleSection }) {
  return (
    <div className="space-y-1">
      <Section title="الحالة">
        <PropertyRow
          label="الحالة"
          value={
            <span className={cn(
              "inline-flex items-center gap-1",
              section.status === "published" ? "text-emerald-500" : "text-amber-500",
            )}>
              {section.status === "published" ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
              {section.status === "published" ? "منشور" : "مسودة"}
            </span>
          }
        />
        <PropertyRow
          label="معاينة مجانية"
          value={section.freePreview ? "مفعلة" : "غير مفعلة"}
          icon={Globe}
        />
        <PropertyRow
          label="مقفل"
          value={section.locked ? "نعم" : "لا"}
          icon={Lock}
        />
      </Section>

      <Section title="الإحصائيات">
        <PropertyRow label="المحتوى" value={section.items.length} icon={FileText} />
        <PropertyRow label="المدة" value={section.durationMinutes ? `${section.durationMinutes} د` : "—"} icon={Clock} />
      </Section>

      <Section title="التواريخ">
        <PropertyRow label="الإنشاء" value={formatDate(section.createdAt)} icon={Calendar} />
        <PropertyRow label="آخر تعديل" value={formatDate(section.updatedAt)} icon={Calendar} />
      </Section>

      {section.description && (
        <Section title="الوصف">
          <p className="text-[11px] text-muted-foreground/70">{section.description}</p>
        </Section>
      )}
    </div>
  );
}

function ContentProperties({ item }: { item: ContentItem }) {
  const meta = contentTypeMeta[item.type] ?? contentTypeMeta.resource;
  const fallback = meta!;
  const Icon = fallback.icon;

  return (
    <div className="space-y-1">
      <Section title="النوع">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/10">
          <span className={cn("p-1.5 rounded-lg", fallback.color)}>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-medium">{fallback.label}</p>
            <p className="text-[10px] text-muted-foreground/50">{item.title}</p>
          </div>
        </div>
      </Section>

      <Section title="الحالة">
        <PropertyRow
          label="الحالة"
          value={
            <span className={cn(
              "inline-flex items-center gap-1",
              item.status === "published" ? "text-emerald-500" : "text-amber-500",
            )}>
              {item.status === "published" ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
              {item.status === "published" ? "منشور" : "مسودة"}
            </span>
          }
        />
        <PropertyRow
          label="الظهور"
          value={item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}
          icon={Eye}
        />
        <PropertyRow
          label="معاينة مجانية"
          value={item.freePreview ? "مفعلة" : "غير مفعلة"}
          icon={Globe}
        />
        <PropertyRow
          label="مقفل"
          value={item.locked ? "نعم" : "لا"}
          icon={Lock}
        />
      </Section>

      <Section title="التفاصيل">
        <PropertyRow label="المدة" value={item.duration ? `${Math.round(item.duration / 60)} د` : "—"} icon={Clock} />
        <PropertyRow label="الإنشاء" value={formatDate(item.createdAt)} icon={Calendar} />
        <PropertyRow label="آخر تعديل" value={formatDate(item.updatedAt)} icon={Calendar} />
      </Section>

      {item.description && (
        <Section title="الوصف">
          <p className="text-[11px] text-muted-foreground/70">{item.description}</p>
        </Section>
      )}

      {/* Extension points */}
      {item.type === "video" && (
        <Section title="الوسائط">
          <p className="text-[10px] text-muted-foreground/50">
            {item.mediaId ? `معرف الوسائط: ${item.mediaId}` : "لم يتم تحديد وسائط بعد"}
          </p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">يمكن اختيار وسائط من مكتبة الوسائط.</p>
        </Section>
      )}
      {item.type === "exam" && (
        <Section title="الاختبار">
          <p className="text-[10px] text-muted-foreground/50">
            {item.examId ? `معرف الاختبار: ${item.examId}` : "لم يتم تحديد اختبار بعد"}
          </p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">نقطة امتداد لبناء الاختبارات.</p>
        </Section>
      )}
      {item.type === "external_link" && item.externalUrl && (
        <Section title="الرابط">
          <p className="text-[10px] text-muted-foreground/50 truncate">{item.externalUrl}</p>
        </Section>
      )}
    </div>
  );
}

function WorkspaceInspector({ course, moduleTree }: WorkspaceInspectorProps) {
  const { selectedType, selectedId, toggleRightPanel } = useWorkspaceStore();

  const selectedLecture = useMemo(() => {
    if (selectedType !== "lecture" || !selectedId || !moduleTree) return null;
    return moduleTree.find((m) => m.id === selectedId) ?? null;
  }, [moduleTree, selectedType, selectedId]);

  const selectedSection = useMemo(() => {
    if (selectedType !== "section" || !selectedId || !moduleTree) return null;
    for (const mod of moduleTree) {
      const sec = mod.sections.find((s) => s.id === selectedId);
      if (sec) return sec;
    }
    return null;
  }, [moduleTree, selectedType, selectedId]);

  const selectedContent = useMemo(() => {
    if (selectedType !== "content" || !selectedId || !moduleTree) return null;
    for (const mod of moduleTree) {
      for (const sec of mod.sections) {
        const item = sec.items.find((i) => i.id === selectedId);
        if (item) return item;
      }
    }
    return null;
  }, [moduleTree, selectedType, selectedId]);

  const title = selectedType === "course"
    ? "خصائص الدورة"
    : selectedType === "lecture"
      ? "خصائص المحاضرة"
      : selectedType === "section"
        ? "خصائص القسم"
        : selectedType === "content"
          ? "خصائص المحتوى"
          : "المفتش";

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 py-3 border-b border-border/20 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground/70">{title}</span>
        <button
          onClick={toggleRightPanel}
          className="p-1 rounded text-muted-foreground/30 hover:text-foreground hover:bg-muted/30 transition-colors"
          aria-label="إغلاق المفتش"
        >
          <PanelRightClose className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        <AnimatePresence mode="popLayout">
          {selectedType === "course" && course && (
            <motion.div
              key="course-props"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <CourseProperties course={course} />
            </motion.div>
          )}

          {selectedType === "lecture" && selectedLecture && (
            <motion.div
              key={`lecture-props-${selectedLecture.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <LectureProperties lecture={selectedLecture} />
            </motion.div>
          )}

          {selectedType === "section" && selectedSection && (
            <motion.div
              key={`section-props-${selectedSection.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <SectionProperties section={selectedSection} />
            </motion.div>
          )}

          {selectedType === "content" && selectedContent && (
            <motion.div
              key={`content-props-${selectedContent.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ContentProperties item={selectedContent} />
            </motion.div>
          )}

          {!selectedType && (
            <motion.div
              key="no-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center">
                <Settings className="h-5 w-5 text-muted-foreground/30" />
              </div>
              <p className="text-xs text-muted-foreground/50">اختر عنصراً لعرض خصائصه</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { WorkspaceInspector };
