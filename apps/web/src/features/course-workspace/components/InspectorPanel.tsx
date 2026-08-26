"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArchiveRestore, Send, Sparkles } from "lucide-react";
import { AppButton, AppInput, AppTextarea, PermissionGuard } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Course, UpdateCoursePayload } from "@/features/courses/types";
import type { UpdateCourseModulePayload } from "@/features/course-modules/types";
import type { UpdateCourseSectionPayload } from "@/features/course-sections/types";
import type { UpdateLessonPayload } from "@/features/lessons/types";
import type { SelectedNode } from "../types";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function SwitchRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-all",
            checked ? "start-[calc(100%-1.125rem)]" : "start-0.5",
          )}
        />
      </button>
    </div>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{title}</h3>
      {children}
    </section>
  );
}

interface InspectorPanelProps {
  course: Course | null | undefined;
  selected: SelectedNode | null;
  onUpdateCourse: (data: UpdateCoursePayload) => void;
  onToggleFeatureCourse: () => void;
  onPublishCourse: () => void;
  onArchiveCourse: () => void;
  onRestoreCourse: () => void;
  coursePending: boolean;
  onUpdateLecture: (id: string, data: UpdateCourseModulePayload) => void;
  lecturePending: boolean;
  onUpdateSection: (id: string, data: UpdateCourseSectionPayload) => void;
  sectionPending: boolean;
  onUpdateContent: (sectionId: string, id: string, data: UpdateLessonPayload) => void;
  contentPending: boolean;
}

const VISIBILITY_OPTIONS = [
  { value: "private", label: "خاصة" },
  { value: "public", label: "عامة" },
  { value: "unlisted", label: "غير مدرجة" },
];

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
  { value: "all_levels", label: "جميع المستويات" },
];

const LANGUAGE_OPTIONS = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ur", label: "اردو" },
];

const LESSON_VISIBILITY_OPTIONS = [
  { value: "private", label: "خاص" },
  { value: "preview", label: "معاينة" },
  { value: "public", label: "عام" },
];

function CourseInspector({
  course,
  onUpdateCourse,
  onToggleFeatureCourse,
  onPublishCourse,
  onArchiveCourse,
  onRestoreCourse,
  pending,
}: {
  course: Course;
  onUpdateCourse: (data: UpdateCoursePayload) => void;
  onToggleFeatureCourse: () => void;
  onPublishCourse: () => void;
  onArchiveCourse: () => void;
  onRestoreCourse: () => void;
  pending: boolean;
}) {
  const [tab, setTab] = useState<"props" | "seo" | "publish">("props");
  const [form, setForm] = useState({
    title: course.title,
    subtitle: course.subtitle ?? "",
    shortDescription: course.shortDescription ?? "",
    visibility: course.visibility as string,
    difficulty: course.difficulty as string,
    language: course.language,
    seoTitle: course.seo.title ?? "",
    seoDescription: course.seo.description ?? "",
    seoKeywords: course.seo.keywords ?? "",
    certificateEnabled: course.certificateEnabled,
  });

  useEffect(() => {
    setForm({
      title: course.title,
      subtitle: course.subtitle ?? "",
      shortDescription: course.shortDescription ?? "",
      visibility: course.visibility,
      difficulty: course.difficulty,
      language: course.language,
      seoTitle: course.seo.title ?? "",
      seoDescription: course.seo.description ?? "",
      seoKeywords: course.seo.keywords ?? "",
      certificateEnabled: course.certificateEnabled,
    });
  }, [course]);

  const set = useCallback(<K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const save = useCallback(() => {
    onUpdateCourse({
      title: form.title,
      subtitle: form.subtitle || null,
      shortDescription: form.shortDescription || null,
      visibility: form.visibility as Course["visibility"],
      difficulty: form.difficulty as Course["difficulty"],
      language: form.language,
      certificateEnabled: form.certificateEnabled,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      seoKeywords: form.seoKeywords || null,
    });
  }, [form, onUpdateCourse]);

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="أقسام الخصائص" className="grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1">
        {(
          [
            { key: "props", label: "خصائص" },
            { key: "seo", label: "SEO" },
            { key: "publish", label: "النشر" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "props" && (
        <PermissionGuard permission="courses.update" fallback={<p className="text-xs text-muted-foreground/60">لا تملك صلاحية التعديل.</p>}>
          <div className="space-y-3">
            <Field label="العنوان" htmlFor="insp-course-title">
              <AppInput id="insp-course-title" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("title", e.target.value)} />
            </Field>
            <Field label="العنوان الفرعي" htmlFor="insp-course-subtitle">
              <AppInput id="insp-course-subtitle" value={form.subtitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("subtitle", e.target.value)} />
            </Field>
            <Field label="وصف مختصر" htmlFor="insp-course-short">
              <AppTextarea id="insp-course-short" rows={3} value={form.shortDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("shortDescription", e.target.value)} />
            </Field>
            <SelectField id="insp-course-visibility" label="الظهور" value={form.visibility} options={VISIBILITY_OPTIONS} onChange={(v) => set("visibility", v)} />
            <SelectField id="insp-course-difficulty" label="المستوى" value={form.difficulty} options={DIFFICULTY_OPTIONS} onChange={(v) => set("difficulty", v)} />
            <SelectField id="insp-course-language" label="اللغة" value={form.language} options={LANGUAGE_OPTIONS} onChange={(v) => set("language", v)} />
            <SwitchRow id="insp-course-cert" label="شهادة إتمام" checked={form.certificateEnabled} onChange={(v) => set("certificateEnabled", v)} />
            <AppButton size="sm" className="w-full" onClick={save} loading={pending} disabled={pending || !form.title.trim()}>
              حفظ التغييرات
            </AppButton>
          </div>
        </PermissionGuard>
      )}

      {tab === "seo" && (
        <PermissionGuard permission="courses.update" fallback={<p className="text-xs text-muted-foreground/60">لا تملك صلاحية التعديل.</p>}>
          <div className="space-y-3">
            <Field label="عنوان SEO" htmlFor="insp-seo-title">
              <AppInput id="insp-seo-title" value={form.seoTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("seoTitle", e.target.value)} />
            </Field>
            <Field label="وصف SEO" htmlFor="insp-seo-desc">
              <AppTextarea id="insp-seo-desc" rows={3} value={form.seoDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("seoDescription", e.target.value)} />
            </Field>
            <Field label="الكلمات المفتاحية" htmlFor="insp-seo-keywords">
              <AppInput id="insp-seo-keywords" value={form.seoKeywords} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("seoKeywords", e.target.value)} placeholder="مفصولة بفواصل" />
            </Field>
            <AppButton size="sm" className="w-full" onClick={save} loading={pending} disabled={pending}>
              حفظ SEO
            </AppButton>
          </div>
        </PermissionGuard>
      )}

      {tab === "publish" && (
        <div className="space-y-3">
          <PanelSection title="الحالة">
            <p className="text-xs text-muted-foreground/70">
              الحالة الحالية: <span className="font-semibold text-foreground">{course.status}</span>
            </p>
          </PanelSection>
          <PermissionGuard permission="courses.publish">
            {course.status !== "published" && (
              <AppButton size="sm" className="w-full" onClick={onPublishCourse} loading={pending} disabled={pending}>
                <Send className="h-3.5 w-3.5" />
                نشر الدورة
              </AppButton>
            )}
          </PermissionGuard>
          <PermissionGuard permission="courses.feature">
            <AppButton size="sm" variant="outline" className="w-full" onClick={onToggleFeatureCourse} disabled={pending}>
              <Sparkles className="h-3.5 w-3.5" />
              {course.featured ? "إزالة التمييز" : "تمييز الدورة"}
            </AppButton>
          </PermissionGuard>
          <PermissionGuard permission="courses.archive">
            {course.status === "published" && (
              <AppButton size="sm" variant="outline" className="w-full" onClick={onArchiveCourse} disabled={pending}>
                <Archive className="h-3.5 w-3.5" />
                أرشفة الدورة
              </AppButton>
            )}
            {course.status === "archived" && (
              <AppButton size="sm" variant="outline" className="w-full" onClick={onRestoreCourse} disabled={pending}>
                <ArchiveRestore className="h-3.5 w-3.5" />
                استعادة الدورة
              </AppButton>
            )}
          </PermissionGuard>
        </div>
      )}
    </div>
  );
}

function LectureInspector({
  selected,
  onUpdateLecture,
  pending,
}: {
  selected: Extract<SelectedNode, { type: "lecture" }>;
  onUpdateLecture: (id: string, data: UpdateCourseModulePayload) => void;
  pending: boolean;
}) {
  const { lecture } = selected;
  const [form, setForm] = useState({
    title: lecture.title,
    description: lecture.description ?? "",
    duration: lecture.durationMinutes ?? ("" as number | ""),
  });

  useEffect(() => {
    setForm({ title: lecture.title, description: lecture.description ?? "", duration: lecture.durationMinutes ?? "" });
  }, [lecture]);

  const save = useCallback(() => {
    onUpdateLecture(lecture.id, {
      title: form.title,
      description: form.description || null,
      estimated_duration: form.duration === "" ? null : Number(form.duration),
    });
  }, [form, lecture.id, onUpdateLecture]);

  return (
    <PermissionGuard permission="modules.update" fallback={<p className="text-xs text-muted-foreground/60">لا تملك صلاحية التعديل.</p>}>
      <div className="space-y-3">
        <Field label="عنوان المحاضرة" htmlFor="insp-lecture-title">
          <AppInput id="insp-lecture-title" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="الوصف" htmlFor="insp-lecture-desc">
          <AppTextarea id="insp-lecture-desc" rows={3} value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field label="المدة التقديرية (دقائق)" htmlFor="insp-lecture-duration">
          <AppInput
            id="insp-lecture-duration"
            type="number"
            min={0}
            value={form.duration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((f) => ({ ...f, duration: e.target.value === "" ? "" : Number(e.target.value) }))
            }
          />
        </Field>
        <AppButton size="sm" className="w-full" onClick={save} loading={pending} disabled={pending || !form.title.trim()}>
          حفظ التغييرات
        </AppButton>
      </div>
    </PermissionGuard>
  );
}

function SectionInspector({
  selected,
  onUpdateSection,
  pending,
}: {
  selected: Extract<SelectedNode, { type: "section" }>;
  onUpdateSection: (id: string, data: UpdateCourseSectionPayload) => void;
  pending: boolean;
}) {
  const { section } = selected;
  const [form, setForm] = useState({
    title: section.title,
    description: section.description ?? "",
    duration: section.durationMinutes ?? ("" as number | ""),
    freePreview: section.freePreview,
    locked: section.locked,
  });

  useEffect(() => {
    setForm({
      title: section.title,
      description: section.description ?? "",
      duration: section.durationMinutes ?? "",
      freePreview: section.freePreview,
      locked: section.locked,
    });
  }, [section]);

  const save = useCallback(() => {
    onUpdateSection(section.id, {
      title: form.title,
      description: form.description || null,
      duration_minutes: form.duration === "" ? null : Number(form.duration),
      free_preview: form.freePreview,
      locked: form.locked,
    });
  }, [form, section.id, onUpdateSection]);

  return (
    <PermissionGuard permission="sections.update" fallback={<p className="text-xs text-muted-foreground/60">لا تملك صلاحية التعديل.</p>}>
      <div className="space-y-3">
        <Field label="عنوان القسم" htmlFor="insp-section-title">
          <AppInput id="insp-section-title" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="الوصف" htmlFor="insp-section-desc">
          <AppTextarea id="insp-section-desc" rows={3} value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field label="المدة (دقائق)" htmlFor="insp-section-duration">
          <AppInput
            id="insp-section-duration"
            type="number"
            min={0}
            value={form.duration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((f) => ({ ...f, duration: e.target.value === "" ? "" : Number(e.target.value) }))
            }
          />
        </Field>
        <SwitchRow id="insp-section-preview" label="معاينة مجانية" checked={form.freePreview} onChange={(v) => setForm((f) => ({ ...f, freePreview: v }))} />
        <SwitchRow id="insp-section-locked" label="قسم مقفل" checked={form.locked} onChange={(v) => setForm((f) => ({ ...f, locked: v }))} />
        <AppButton size="sm" className="w-full" onClick={save} loading={pending} disabled={pending || !form.title.trim()}>
          حفظ التغييرات
        </AppButton>
      </div>
    </PermissionGuard>
  );
}

function ContentInspectorForm({
  selected,
  onUpdateContent,
  pending,
}: {
  selected: Extract<SelectedNode, { type: "content" }>;
  onUpdateContent: (sectionId: string, id: string, data: UpdateLessonPayload) => void;
  pending: boolean;
}) {
  const { item, section } = selected;
  const [form, setForm] = useState({
    title: item.title,
    shortDescription: item.description ?? "",
    visibility: item.visibility as string,
    duration: item.duration ?? ("" as number | ""),
    freePreview: item.freePreview,
  });

  useEffect(() => {
    setForm({
      title: item.title,
      shortDescription: item.description ?? "",
      visibility: item.visibility,
      duration: item.duration ?? "",
      freePreview: item.freePreview,
    });
  }, [item]);

  const save = useCallback(() => {
    onUpdateContent(section.id, item.id, {
      title: form.title,
      short_description: form.shortDescription || null,
      visibility: form.visibility as UpdateLessonPayload["visibility"],
      estimated_duration: form.duration === "" ? null : Number(form.duration),
      free_preview: form.freePreview,
    });
  }, [form, section.id, item.id, onUpdateContent]);

  return (
    <PermissionGuard permission="lessons.update" fallback={<p className="text-xs text-muted-foreground/60">لا تملك صلاحية التعديل.</p>}>
      <div className="space-y-3">
        <Field label="العنوان" htmlFor="insp-content-title">
          <AppInput id="insp-content-title" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="وصف مختصر" htmlFor="insp-content-desc">
          <AppTextarea id="insp-content-desc" rows={3} value={form.shortDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} />
        </Field>
        <SelectField id="insp-content-visibility" label="الظهور" value={form.visibility} options={LESSON_VISIBILITY_OPTIONS} onChange={(v) => setForm((f) => ({ ...f, visibility: v }))} />
        <Field label="المدة التقديرية (دقائق)" htmlFor="insp-content-duration">
          <AppInput
            id="insp-content-duration"
            type="number"
            min={0}
            value={form.duration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((f) => ({ ...f, duration: e.target.value === "" ? "" : Number(e.target.value) }))
            }
          />
        </Field>
        <SwitchRow id="insp-content-preview" label="معاينة مجانية" checked={form.freePreview} onChange={(v) => setForm((f) => ({ ...f, freePreview: v }))} />
        <AppButton size="sm" className="w-full" onClick={save} loading={pending} disabled={pending || !form.title.trim()}>
          حفظ التغييرات
        </AppButton>
      </div>
    </PermissionGuard>
  );
}

/**
 * Contextual Inspector: edits properties of whatever is selected in the tree.
 */
const InspectorPanel = memo(function InspectorPanel(props: InspectorPanelProps) {
  const { course, selected } = props;

  const key = useMemo(() => {
    if (!selected || selected.type === "course") return "course";
    if (selected.type === "lecture") return `lecture-${selected.lecture.id}`;
    if (selected.type === "section") return `section-${selected.section.id}`;
    return `content-${selected.item.id}`;
  }, [selected]);

  const heading =
    !selected || selected.type === "course"
      ? "خصائص الدورة"
      : selected.type === "lecture"
        ? "خصائص المحاضرة"
        : selected.type === "section"
          ? "خصائص القسم"
          : "خصائص المحتوى";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/40 p-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{heading}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={key}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            {course && (!selected || selected.type === "course") && (
              <CourseInspector
                course={course}
                onUpdateCourse={props.onUpdateCourse}
                onToggleFeatureCourse={props.onToggleFeatureCourse}
                onPublishCourse={props.onPublishCourse}
                onArchiveCourse={props.onArchiveCourse}
                onRestoreCourse={props.onRestoreCourse}
                pending={props.coursePending}
              />
            )}
            {selected?.type === "lecture" && (
              <LectureInspector selected={selected} onUpdateLecture={props.onUpdateLecture} pending={props.lecturePending} />
            )}
            {selected?.type === "section" && (
              <SectionInspector selected={selected} onUpdateSection={props.onUpdateSection} pending={props.sectionPending} />
            )}
            {selected?.type === "content" && (
              <ContentInspectorForm selected={selected} onUpdateContent={props.onUpdateContent} pending={props.contentPending} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

export { InspectorPanel };
