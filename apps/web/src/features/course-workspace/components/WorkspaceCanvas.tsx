"use client";

import { memo, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronLeft,
  Circle,
  Clock,
  Eye,
  EyeOff,
  Globe2,
  GraduationCap,
  Layers,
  Lock,
  Plus,
  Users,
} from "lucide-react";
import { PermissionGuard, Skeleton } from "@/components/ui";
import { CONTENT_TYPE_CONFIG } from "@/features/course-content/constants";
import { estimateDuration, estimateDurationMinutes } from "@/features/course-content/utils";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber } from "@/lib/format";
import { EmptyLecturesState } from "./EmptyLecturesState";
import type { Course } from "@/features/courses/types";
import type { ContentItem, SelectedNode, StudioLecture, StudioSection } from "../types";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "bg-warning/10 text-warning" },
  review: { label: "قيد المراجعة", cls: "bg-blue/10 text-blue" },
  published: { label: "منشور", cls: "bg-success/10 text-success" },
  scheduled: { label: "مجدول", cls: "bg-secondary/10 text-secondary" },
  archived: { label: "مؤرشف", cls: "bg-muted text-muted-foreground" },
};

const VISIBILITY_LABEL: Record<string, string> = {
  public: "عام",
  private: "خاص",
  unlisted: "غير مدرج",
  preview: "معاينة",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft!;
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", meta.cls)}>
      {meta.label}
    </span>
  );
}

function CanvasShell({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto h-full w-full max-w-3xl px-5 py-6"
    >
      {children}
    </motion.div>
  );
}

function ChildRow({
  onSelect,
  icon,
  title,
  meta,
  trailing,
}: {
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <motion.button
      layout
      type="button"
      onClick={onSelect}
      whileHover={{ x: -2 }}
      className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card p-3 text-start transition-colors hover:border-primary/30 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {meta && <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground/60">{meta}</span>}
      </span>
      {trailing}
      <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:-translate-x-0.5 ltr:rotate-180" />
    </motion.button>
  );
}

interface WorkspaceCanvasProps {
  course: Course | null | undefined;
  courseLoading: boolean;
  tree: StudioLecture[];
  treeLoading: boolean;
  selected: SelectedNode | null;
  onSelectLecture: (id: string) => void;
  onSelectSection: (id: string) => void;
  onSelectContent: (id: string) => void;
  onAddLecture: () => void;
  onAddSection: (lectureId: string) => void;
  onAddContent: (sectionId: string) => void;
}

function CourseCanvas({
  course,
  tree,
  onSelectLecture,
  onAddLecture,
}: {
  course: Course;
  tree: StudioLecture[];
  onSelectLecture: (id: string) => void;
  onAddLecture: () => void;
}) {
  const totals = useMemo(() => {
    const sections = tree.reduce((s, l) => s + l.sections.length, 0);
    const content = tree.reduce((s, l) => s + l.sections.reduce((x, sec) => x + sec.items.length, 0), 0);
    const duration = tree.reduce(
      (s, l) => s + (l.durationMinutes ?? 0) + l.sections.reduce((x, sec) => x + (sec.durationMinutes ?? 0), 0),
      0,
    );
    return { lectures: tree.length, sections, content, duration };
  }, [tree]);

  const checklist = useMemo(
    () => [
      { label: "وصف الدورة", done: Boolean(course.shortDescription || course.description) },
      { label: "صورة الغلاف", done: Boolean(course.thumbnail || course.coverImage) },
      { label: "محاضرة واحدة على الأقل", done: totals.lectures > 0 },
      { label: "محتوى تعليمي", done: totals.content > 0 },
      { label: "النشر", done: course.status === "published" },
    ],
    [course, totals],
  );

  const cover = course.coverImage ?? course.thumbnail;

  if (tree.length === 0) {
    return <EmptyLecturesState onCreateLecture={onAddLecture} />;
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/50">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/15 via-accent to-muted">
            <BookOpen className="h-12 w-12 text-primary/25" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={course.status} />
            <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {VISIBILITY_LABEL[course.visibility]}
            </span>
            <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {DIFFICULTY_LABEL[course.difficulty]}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{course.title}</h1>
          {course.shortDescription && (
            <p className="line-clamp-2 max-w-xl text-xs text-muted-foreground/80">{course.shortDescription}</p>
          )}
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground/70">
        <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />{formatNumber(totals.lectures)} محاضرة</span>
        <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />{formatNumber(totals.sections)} قسم · {formatNumber(totals.content)} محتوى</span>
        {totals.duration > 0 && (
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{estimateDurationMinutes(totals.duration)}</span>
        )}
        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{formatNumber(course.studentsCount)} طالب</span>
      </p>

      <section aria-label="جاهزية النشر" className="rounded-2xl border border-border/50 bg-card p-4">
        <h2 className="mb-3 text-xs font-bold">جاهزية النشر</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-xs">
              {item.done ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-2.5 w-2.5" />
                </span>
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
              <span className={cn(item.done ? "text-foreground/80" : "text-muted-foreground/60")}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="المحاضرات" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold">المحاضرات</h2>
          <PermissionGuard permission="modules.create">
            <button
              type="button"
              onClick={onAddLecture}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-3 w-3" />
              إضافة محاضرة
            </button>
          </PermissionGuard>
        </div>
        <div className="space-y-2">
          {tree.map((lecture) => (
            <ChildRow
              key={lecture.id}
              onSelect={() => onSelectLecture(lecture.id)}
              icon={
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <GraduationCap className="h-4 w-4" />
                </span>
              }
              title={lecture.title}
              meta={
                <>
                  <span>{formatNumber(lecture.sections.length)} قسم</span>
                  {lecture.durationMinutes ? <span>{estimateDurationMinutes(lecture.durationMinutes)}</span> : null}
                </>
              }
              trailing={<StatusPill status={lecture.status} />}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function LectureCanvas({
  lecture,
  onSelectSection,
  onAddSection,
}: {
  lecture: StudioLecture;
  onSelectSection: (id: string) => void;
  onAddSection: () => void;
}) {
  const contentCount = lecture.sections.reduce((s, sec) => s + sec.items.length, 0);
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={lecture.status} />
          {lecture.durationMinutes ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <Clock className="h-3 w-3" />
              {estimateDurationMinutes(lecture.durationMinutes)}
            </span>
          ) : null}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{lecture.title}</h1>
        <p className="text-xs text-muted-foreground/60">
          {formatNumber(lecture.sections.length)} قسم · {formatNumber(contentCount)} محتوى
        </p>
        {lecture.description && (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground/80">{lecture.description}</p>
        )}
      </header>

      <section aria-label="الأقسام" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold">الأقسام</h2>
          <PermissionGuard permission="sections.create">
            <button
              type="button"
              onClick={onAddSection}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-3 w-3" />
              إضافة قسم
            </button>
          </PermissionGuard>
        </div>
        {lecture.sections.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground/60">
            لا توجد أقسام في هذه المحاضرة بعد
          </p>
        ) : (
          <div className="space-y-2">
            {lecture.sections.map((section) => (
              <ChildRow
                key={section.id}
                onSelect={() => onSelectSection(section.id)}
                icon={
                  <span className="rounded-lg bg-blue/10 p-2 text-blue">
                    <Layers className="h-4 w-4" />
                  </span>
                }
                title={section.title}
                meta={
                  <>
                    <span>{formatNumber(section.items.length)} محتوى</span>
                    {section.freePreview && <span className="text-success">معاينة مجانية</span>}
                    {section.locked && <span className="text-warning">مقفل</span>}
                  </>
                }
                trailing={<StatusPill status={section.status} />}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionCanvas({
  section,
  lecture,
  onSelectContent,
  onAddContent,
}: {
  section: StudioSection;
  lecture: StudioLecture;
  onSelectContent: (id: string) => void;
  onAddContent: () => void;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] text-muted-foreground/50">{lecture.title}</p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={section.status} />
          {section.freePreview && (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] text-success">
              <Eye className="h-3 w-3" />معاينة مجانية
            </span>
          )}
          {section.locked && (
            <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] text-warning">
              <Lock className="h-3 w-3" />مقفل
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{section.title}</h1>
        {section.description && (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground/80">{section.description}</p>
        )}
      </header>

      <section aria-label="المحتوى" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold">المحتوى</h2>
          <PermissionGuard permission="lessons.create">
            <button
              type="button"
              onClick={onAddContent}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-3 w-3" />
              إضافة محتوى
            </button>
          </PermissionGuard>
        </div>
        {section.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground/60">
            لا يوجد محتوى في هذا القسم بعد
          </p>
        ) : (
          <div className="space-y-2">
            {section.items.map((item) => {
              const config = CONTENT_TYPE_CONFIG[item.type];
              const Icon = config.icon;
              return (
                <ChildRow
                  key={item.id}
                  onSelect={() => onSelectContent(item.id)}
                  icon={
                    <span className={cn("rounded-lg p-2", config.bg, config.color)}>
                      <Icon className="h-4 w-4" />
                    </span>
                  }
                  title={item.title}
                  meta={
                    <>
                      <span>{config.label}</span>
                      <span>{VISIBILITY_LABEL[item.visibility]}</span>
                      {item.duration ? <span>{estimateDuration(item.duration)}</span> : null}
                    </>
                  }
                  trailing={<StatusPill status={item.status} />}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ContentCanvas({
  item,
  section,
  lecture,
}: {
  item: ContentItem;
  section: StudioSection;
  lecture: StudioLecture;
}) {
  const config = CONTENT_TYPE_CONFIG[item.type];
  const Icon = config.icon;
  const VisibilityIcon = item.visibility === "public" ? Globe2 : item.visibility === "preview" ? Eye : EyeOff;
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] text-muted-foreground/50">
          {lecture.title} ← {section.title}
        </p>
        <div className="flex items-start gap-4">
          <span className={cn("rounded-2xl p-4", config.bg, config.color)}>
            <Icon className="h-8 w-8" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={item.status} />
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">{config.label}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
          </div>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-3">
          <dt className="text-[10px] text-muted-foreground/50">الظهور</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
            <VisibilityIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
            {VISIBILITY_LABEL[item.visibility]}
          </dd>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3">
          <dt className="text-[10px] text-muted-foreground/50">المدة</dt>
          <dd className="mt-1 text-xs font-semibold tabular-nums">{estimateDuration(item.duration)}</dd>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3">
          <dt className="text-[10px] text-muted-foreground/50">معاينة مجانية</dt>
          <dd className="mt-1 text-xs font-semibold">{item.freePreview ? "مفعّلة" : "متوقفة"}</dd>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3">
          <dt className="text-[10px] text-muted-foreground/50">آخر تحديث</dt>
          <dd className="mt-1 text-xs font-semibold">{formatDate(item.updatedAt)}</dd>
        </div>
      </dl>

      <section aria-label="الوصف" className="rounded-2xl border border-border/50 bg-card p-4">
        <h2 className="mb-2 text-xs font-bold">الوصف</h2>
        {item.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground/80">{item.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground/50">
            لا يوجد وصف — أضف وصفاً من لوحة الخصائص.
          </p>
        )}
      </section>
    </div>
  );
}

const WorkspaceCanvas = memo(function WorkspaceCanvas({
  course,
  courseLoading,
  tree,
  treeLoading,
  selected,
  onSelectLecture,
  onSelectSection,
  onSelectContent,
  onAddLecture,
  onAddSection,
  onAddContent,
}: WorkspaceCanvasProps) {
  if (courseLoading || treeLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-5 py-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-5 w-2/3 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (!course) return null;

  const key =
    !selected || selected.type === "course"
      ? "course"
      : selected.type === "lecture"
        ? `lecture-${selected.lecture.id}`
        : selected.type === "section"
          ? `section-${selected.section.id}`
          : `content-${selected.item.id}`;

  return (
    <div className="h-full overflow-y-auto">
      <AnimatePresence mode="wait" initial={false}>
        <CanvasShell id={key}>
          {(!selected || selected.type === "course") && (
            <CourseCanvas course={course} tree={tree} onSelectLecture={onSelectLecture} onAddLecture={onAddLecture} />
          )}
          {selected?.type === "lecture" && (
            <LectureCanvas
              lecture={selected.lecture}
              onSelectSection={onSelectSection}
              onAddSection={() => onAddSection(selected.lecture.id)}
            />
          )}
          {selected?.type === "section" && (
            <SectionCanvas
              section={selected.section}
              lecture={selected.lecture}
              onSelectContent={onSelectContent}
              onAddContent={() => onAddContent(selected.section.id)}
            />
          )}
          {selected?.type === "content" && (
            <ContentCanvas item={selected.item} section={selected.section} lecture={selected.lecture} />
          )}
        </CanvasShell>
      </AnimatePresence>
    </div>
  );
});

export { WorkspaceCanvas };
