"use client";

import { motion } from "framer-motion";
import {
  AppInput,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppTextarea,
  AppSwitch,
} from "@/components/ui";
import {
  StudioInspectorSurface,
  StudioChip,
  StudioEmptyState,
} from "@/components/studio";
import { useExamStudioStore } from "@/features/exam-bank/store";
import { DIFFICULTY_CONFIG, VISIBILITY_OPTIONS, POINT_PRESETS } from "@/features/exam-bank/constants";
import type { Difficulty, Exam, ExamQuestion, Question } from "@/features/exam-bank/types";

interface ExamStudioInspectorProps {
  open: boolean;
  width: number;
  exam: Exam | null;
  questions: ExamQuestion[];
  onUpdateExam: (payload: Record<string, unknown>) => void;
  onUpdateQuestion: (id: string, payload: Record<string, unknown>) => void;
  onUpdateLink: (questionId: string, payload: { points?: number; section?: string }) => void;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-studio-fg-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-studio-fg-subtle">{hint}</span>}
    </label>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-studio-fg">{label}</span>
      <AppSwitch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

const difficultyOptions = (["easy", "medium", "hard"] as Difficulty[]).map((d) => ({
  value: d,
  label: DIFFICULTY_CONFIG[d].label,
}));

export function ExamStudioInspector({
  exam,
  questions,
  onUpdateExam,
  onUpdateQuestion,
  onUpdateLink,
}: ExamStudioInspectorProps) {
  const { view, selectedQuestionId } = useExamStudioStore();
  const link = questions.find((q) => q.questionId === selectedQuestionId);
  const question: Question | null | undefined = link?.question;

  const isQuestion = view === "question" && !!selectedQuestionId && !!question;

  return (
    <div className="h-full overflow-y-auto studio-scrollbar bg-studio-surface p-4">
      {!exam ? (
        <StudioEmptyState title="لا يوجد اختبار" />
      ) : isQuestion && question && link ? (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4"
        >
          <StudioInspectorSurface title="خصائص السؤال">
            <div className="flex flex-col gap-4">
              <Field label="نوع السؤال">
                <StudioChip variant="accent">{question.type}</StudioChip>
              </Field>
              <Field label="الصعوبة">
                <AppSelect
                  value={question.difficulty}
                  onValueChange={(value) => onUpdateQuestion(question.id, { difficulty: value })}
                >
                  <AppSelectTrigger className="bg-studio-bg">
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {difficultyOptions.map((o) => (
                      <AppSelectItem key={o.value} value={o.value}>
                        {o.label}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </Field>
              <Field label="النقاط">
                <div className="flex items-center gap-2">
                  <AppInput
                    type="number"
                    min={0}
                    value={link.points ?? question.points}
                    onChange={(e) => onUpdateLink(question.id, { points: Number(e.target.value) })}
                    className="bg-studio-bg"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {POINT_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onUpdateLink(question.id, { points: p })}
                      className="rounded-md border border-studio-border bg-studio-soft px-2 py-1 text-xs text-studio-fg transition-colors hover:border-studio-accent-border hover:text-studio-accent"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="الوقت المقدر (ثانية)">
                <AppInput
                  type="number"
                  min={0}
                  value={question.estimatedTime ?? ""}
                  onChange={(e) => onUpdateQuestion(question.id, { estimatedTime: e.target.value ? Number(e.target.value) : null })}
                  className="bg-studio-bg"
                />
              </Field>
              <Field label="الوسوم (مفصولة بفواصل)">
                <AppInput
                  value={(question.tags ?? []).join(", ")}
                  onChange={(e) =>
                    onUpdateQuestion(question.id, {
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  className="bg-studio-bg"
                />
              </Field>
              <Field label="القسم">
                <AppInput
                  value={link.section ?? ""}
                  onChange={(e) => onUpdateLink(question.id, { section: e.target.value })}
                  placeholder="اسم القسم (اختياري)"
                  className="bg-studio-bg"
                />
              </Field>
            </div>
          </StudioInspectorSurface>

          <StudioInspectorSurface title="المحتوى">
            <div className="flex flex-col gap-4">
              <Field label="الشرح">
                <AppTextarea
                  value={question.explanation ?? ""}
                  onChange={(e) => onUpdateQuestion(question.id, { explanation: e.target.value })}
                  placeholder="شرح الإجابة..."
                  className="bg-studio-bg"
                />
              </Field>
              <Field label="تلميح">
                <AppTextarea
                  value={question.hint ?? ""}
                  onChange={(e) => onUpdateQuestion(question.id, { hint: e.target.value })}
                  placeholder="تلميح للطالب..."
                  className="bg-studio-bg"
                />
              </Field>
              <SwitchRow
                label="خلط الخيارات"
                checked={question.shuffleOptions}
                onChange={(value) => onUpdateQuestion(question.id, { shuffleOptions: value })}
              />
            </div>
          </StudioInspectorSurface>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4"
        >
          <StudioInspectorSurface title="خصائص الاختبار">
            <div className="flex flex-col gap-4">
              <Field label="الحالة">
                <StudioChip variant={exam.status === "published" ? "success" : exam.status === "archived" ? "danger" : "default"}>
                  {exam.status}
                </StudioChip>
              </Field>
              <Field label="الظهور">
                <AppSelect
                  value={exam.visibility}
                  onValueChange={(value) => onUpdateExam({ visibility: value })}
                >
                  <AppSelectTrigger className="bg-studio-bg">
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {VISIBILITY_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                      <AppSelectItem key={o.value} value={o.value}>
                        {o.label}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </Field>
              <Field label="اللغة">
                <AppInput
                  value={exam.language}
                  onChange={(e) => onUpdateExam({ language: e.target.value })}
                  className="bg-studio-bg"
                />
              </Field>
              <Field label="المدة (دقيقة)">
                <AppInput
                  type="number"
                  min={0}
                  value={exam.duration ?? ""}
                  onChange={(e) => onUpdateExam({ duration: e.target.value ? Number(e.target.value) : null })}
                  className="bg-studio-bg"
                />
              </Field>
              <Field label="درجة النجاح">
                <AppInput
                  type="number"
                  min={0}
                  value={exam.passingScore}
                  onChange={(e) => onUpdateExam({ passingScore: Number(e.target.value) })}
                  className="bg-studio-bg"
                />
              </Field>
              <Field label="حد المحاولات (0 = غير محدود)">
                <AppInput
                  type="number"
                  min={0}
                  value={exam.attemptLimit ?? ""}
                  onChange={(e) => onUpdateExam({ attemptLimit: e.target.value ? Number(e.target.value) : null })}
                  className="bg-studio-bg"
                />
              </Field>
            </div>
          </StudioInspectorSurface>

          <StudioInspectorSurface title="السلوك">
            <div className="divide-y divide-studio-border">
              <SwitchRow label="خلط الأسئلة" checked={exam.shuffleQuestions} onChange={(v) => onUpdateExam({ shuffleQuestions: v })} />
              <SwitchRow label="خلط الخيارات" checked={exam.shuffleChoices} onChange={(v) => onUpdateExam({ shuffleChoices: v })} />
              <SwitchRow label="إظهار النتائج" checked={exam.showResults} onChange={(v) => onUpdateExam({ showResults: v })} />
              <SwitchRow label="إظهار الإجابات الصحيحة" checked={exam.showCorrectAnswers} onChange={(v) => onUpdateExam({ showCorrectAnswers: v })} />
              <SwitchRow label="السماح بالمراجعة" checked={exam.allowReview} onChange={(v) => onUpdateExam({ allowReview: v })} />
              <SwitchRow label="الدرجات السلبية" checked={exam.negativeMarking} onChange={(v) => onUpdateExam({ negativeMarking: v })} />
              <SwitchRow label="أهلية الشهادة" checked={exam.certificateEligible} onChange={(v) => onUpdateExam({ certificateEligible: v })} />
            </div>
          </StudioInspectorSurface>

          <StudioInspectorSurface title="التمييز">
            <div className="divide-y divide-studio-border">
              <SwitchRow label="مثبّت" checked={exam.pinned} onChange={(v) => onUpdateExam({ pinned: v })} />
              <SwitchRow label="مميز" checked={exam.featured} onChange={(v) => onUpdateExam({ featured: v })} />
              <SwitchRow label="مفضل" checked={exam.favorite} onChange={(v) => onUpdateExam({ favorite: v })} />
            </div>
          </StudioInspectorSurface>
        </motion.div>
      )}
    </div>
  );
}
