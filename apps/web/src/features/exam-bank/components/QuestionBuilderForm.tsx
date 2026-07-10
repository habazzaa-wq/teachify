"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  AppInput,
  AppTextarea,
  AppCheckbox,
  AppSwitch,
} from "@/components/ui";
import { StudioSurfaceCard, StudioButton } from "@/components/studio";
import { cn } from "@/lib/cn";
import type {
  QuestionType,
  QuestionContent,
  QuestionOption,
  MatchingPair,
} from "@/features/exam-bank/types";

interface QuestionBuilderFormProps {
  type: QuestionType;
  value: QuestionContent;
  onChange: (next: QuestionContent) => void;
  disabled?: boolean;
}

function newId(): string {
  return crypto.randomUUID();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium text-studio-fg-muted">{children}</p>
  );
}

export function QuestionBuilderForm({
  type,
  value,
  onChange,
  disabled,
}: QuestionBuilderFormProps) {
  const change = (patch: Partial<QuestionContent>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      {type === "single_choice" && (
        <ChoiceEditor
          value={value}
          multiple={false}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {type === "multiple_choice" && (
        <ChoiceEditor
          value={value}
          multiple
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {type === "true_false" && (
        <TrueFalseEditor value={value} onChange={change} disabled={disabled} />
      )}

      {type === "short_answer" && (
        <ShortAnswerEditor value={value} onChange={change} disabled={disabled} />
      )}

      {type === "essay" && (
        <EssayEditor value={value} onChange={change} disabled={disabled} />
      )}

      {type === "fill_blank" && (
        <FillBlankEditor value={value} onChange={change} disabled={disabled} />
      )}

      {type === "matching" && (
        <MatchingEditor value={value} onChange={change} disabled={disabled} />
      )}

      {type === "ordering" && (
        <OrderingEditor value={value} onChange={change} disabled={disabled} />
      )}

      {type === "numeric" && (
        <NumericEditor value={value} onChange={change} disabled={disabled} />
      )}

      {type === "file_upload" && <FileUploadNote />}

      {type === "coding" && (
        <CodingEditor value={value} onChange={change} disabled={disabled} />
      )}
    </div>
  );
}

/* ---------------- Choices ---------------- */
function ChoiceEditor({
  value,
  multiple,
  onChange,
  disabled,
}: {
  value: QuestionContent;
  multiple: boolean;
  onChange: (next: QuestionContent) => void;
  disabled?: boolean;
}) {
  const options = value.options ?? [];

  const addOption = () =>
    onChange({
      ...value,
      options: [...options, { id: newId(), text: "", correct: false }],
    });

  const updateOption = (id: string, patch: Partial<QuestionOption>) =>
    onChange({
      ...value,
      options: options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });

  const removeOption = (id: string) =>
    onChange({ ...value, options: options.filter((o) => o.id !== id) });

  const setCorrect = (id: string, correct: boolean) => {
    if (multiple) {
      updateOption(id, { correct });
    } else {
      onChange({
        ...value,
        options: options.map((o) => ({ ...o, correct: o.id === id ? correct : false })),
      });
    }
  };

  return (
    <div>
      <SectionLabel>
        {multiple ? "الخيارات (يمكن تحديد أكثر من إجابة صحيحة)" : "الخيارات (إجابة صحيحة واحدة)"}
      </SectionLabel>
      <div className="space-y-2">
        {options.map((opt) => (
          <div
            key={opt.id}
            className="flex items-start gap-2 rounded-lg border border-studio-border bg-studio-surface p-2"
          >
            <button
              type="button"
              aria-label={multiple ? "تحديد صحيح" : "تحديد كإجابة صحيحة"}
              onClick={() => setCorrect(opt.id, !opt.correct)}
              disabled={disabled}
              className={cn(
                "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                opt.correct
                  ? "border-studio-accent bg-studio-accent text-studio-accent-fg"
                  : "border-studio-border",
                multiple && "rounded-md",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {opt.correct && (
                <span className={cn("h-2 w-2", multiple ? "rounded-sm" : "rounded-full bg-studio-accent-fg")} />
              )}
            </button>

            <div className="flex-1 space-y-1.5">
              <AppInput
                value={opt.text}
                disabled={disabled}
                onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                placeholder="نص الخيار"
                className="bg-studio-soft"
              />
              <AppInput
                value={opt.explanation ?? ""}
                disabled={disabled}
                onChange={(e) => updateOption(opt.id, { explanation: e.target.value })}
                placeholder="شرح (اختياري)"
                className="bg-studio-soft text-xs"
              />
            </div>

            <button
              type="button"
              aria-label="حذف الخيار"
              onClick={() => removeOption(opt.id)}
              disabled={disabled || options.length <= 1}
              className="mt-1 flex h-8 w-8 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-danger disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <StudioButton
        variant="soft"
        size="sm"
        onClick={addOption}
        disabled={disabled}
        className="mt-2"
      >
        <Plus className="h-3.5 w-3.5" />
        إضافة خيار
      </StudioButton>
    </div>
  );
}

/* ---------------- True / False ---------------- */
function TrueFalseEditor({
  value,
  onChange,
  disabled,
}: {
  value: QuestionContent;
  onChange: (patch: Partial<QuestionContent>) => void;
  disabled?: boolean;
}) {
  const correct = value.correct;
  return (
    <div className="space-y-3">
      <SectionLabel>الإجابة الصحيحة</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {(["true", "false"] as const).map((val) => {
          const active = correct === val;
          return (
            <button
              key={val}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ correct: val })}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "border-studio-accent bg-studio-accent-soft text-studio-accent"
                  : "border-studio-border bg-studio-surface text-studio-fg-muted hover:border-studio-accent-border",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {val === "true" ? "صح" : "خطأ"}
            </button>
          );
        })}
      </div>
      <SectionLabel>شرح (اختياري)</SectionLabel>
      <AppTextarea
        value={value.trueFalseExplanation ?? ""}
        disabled={disabled}
        onChange={(e) => onChange({ trueFalseExplanation: e.target.value })}
        placeholder="اكتب شرحاً للإجابة..."
        className="bg-studio-soft"
      />
    </div>
  );
}

/* ---------------- Short Answer ---------------- */
function ShortAnswerEditor({
  value,
  onChange,
  disabled,
}: {
  value: QuestionContent;
  onChange: (patch: Partial<QuestionContent>) => void;
  disabled?: boolean;
}) {
  const accepted = value.acceptedAnswers ?? [];

  const update = (i: number, text: string) =>
    onChange({ acceptedAnswers: accepted.map((a, idx) => (idx === i ? text : a)) });
  const remove = (i: number) =>
    onChange({ acceptedAnswers: accepted.filter((_, idx) => idx !== i) });
  const add = () => onChange({ acceptedAnswers: [...accepted, ""] });

  return (
    <div className="space-y-3">
      <SectionLabel>الإجابات المقبولة</SectionLabel>
      <div className="space-y-2">
        {accepted.map((ans, i) => (
          <div key={i} className="flex items-center gap-2">
            <AppInput
              value={ans}
              disabled={disabled}
              onChange={(e) => update(i, e.target.value)}
              placeholder="إجابة مقبولة"
              className="bg-studio-soft"
            />
            <button
              type="button"
              aria-label="حذف الإجابة"
              onClick={() => remove(i)}
              disabled={disabled}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <StudioButton variant="soft" size="sm" onClick={add} disabled={disabled}>
        <Plus className="h-3.5 w-3.5" />
        إضافة إجابة مقبولة
      </StudioButton>
      <div className="pt-1">
        <AppSwitch
          checked={!!value.caseSensitive}
          disabled={disabled}
          onCheckedChange={(c) => onChange({ caseSensitive: c })}
          aria-label="مطابقة حساسة لحالة الأحرف"
        />
      </div>
    </div>
  );
}

/* ---------------- Essay ---------------- */
function EssayEditor({
  value,
  onChange,
  disabled,
}: {
  value: QuestionContent;
  onChange: (patch: Partial<QuestionContent>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <SectionLabel>بطاقة التقييم (Rubric)</SectionLabel>
        <AppTextarea
          value={value.rubric ?? ""}
          disabled={disabled}
          onChange={(e) => onChange({ rubric: e.target.value })}
          placeholder="معايير تقييم المقالة..."
          className="bg-studio-soft"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <SectionLabel>الحد الأدنى للأحرف</SectionLabel>
          <AppInput
            type="number"
            aria-label="الحد الأدنى للأحرف"
            value={value.minLength ?? ""}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                minLength: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="bg-studio-soft"
          />
        </div>
        <div>
          <SectionLabel>الحد الأقصى للأحرف</SectionLabel>
          <AppInput
            type="number"
            aria-label="الحد الأقصى للأحرف"
            value={value.maxLength ?? ""}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                maxLength: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="bg-studio-soft"
          />
        </div>
      </div>
      <AppSwitch
        checked={!!value.attachmentAllowed}
        disabled={disabled}
        onCheckedChange={(c) => onChange({ attachmentAllowed: c })}
          aria-label="السماح بإرفاق ملف"
      />
    </div>
  );
}

/* ---------------- Fill in the blank ---------------- */
function FillBlankEditor({
  value,
  onChange,
  disabled,
}: {
  value: QuestionContent;
  onChange: (patch: Partial<QuestionContent>) => void;
  disabled?: boolean;
}) {
  const fillText = value.fillText ?? "";
  const blanks = value.fillAnswers ?? [];

  const setBlanks = (next: string[][]) => onChange({ fillAnswers: next });

  const addBlank = () => setBlanks([...blanks, [""]]);
  const removeBlank = (bi: number) =>
    setBlanks(blanks.filter((_, i) => i !== bi));

  const updateAnswer = (bi: number, ai: number, text: string) =>
    setBlanks(
      blanks.map((arr, i) =>
        i === bi ? arr.map((a, j) => (j === ai ? text : a)) : arr,
      ),
    );
  const addAnswer = (bi: number) =>
    setBlanks(blanks.map((arr, i) => (i === bi ? [...arr, ""] : arr)));
  const removeAnswer = (bi: number, ai: number) =>
    setBlanks(
      blanks.map((arr, i) => (i === bi ? arr.filter((_, j) => j !== ai) : arr)),
    );

  return (
    <div className="space-y-3">
      <div>
        <SectionLabel>
          نص السؤال (استخدم __BLANK__ لتحديد الفراغات)
        </SectionLabel>
        <AppTextarea
          value={fillText}
          disabled={disabled}
          onChange={(e) => onChange({ fillText: e.target.value })}
          placeholder="مثال: عاصمة فرنسا هي __BLANK__."
          className="bg-studio-soft min-h-[100px]"
        />
      </div>

      <div>
        <SectionLabel>إجابات الفراغات</SectionLabel>
        <div className="space-y-2">
          {blanks.map((answers, bi) => (
            <div
              key={bi}
              className="rounded-lg border border-studio-border bg-studio-surface p-2"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-studio-fg-muted">
                  الفراغ {bi + 1}
                </span>
                <button
                  type="button"
                  aria-label="حذف الفراغ"
                  onClick={() => removeBlank(bi)}
                  disabled={disabled}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                {answers.map((ans, ai) => (
                  <div key={ai} className="flex items-center gap-2">
                    <AppInput
                      value={ans}
                      disabled={disabled}
                      onChange={(e) => updateAnswer(bi, ai, e.target.value)}
                      placeholder="إجابة مقبولة"
                      className="bg-studio-soft"
                    />
                    <button
                      type="button"
                      aria-label="حذف الإجابة"
                      onClick={() => removeAnswer(bi, ai)}
                      disabled={disabled}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <StudioButton
                  variant="ghost"
                  size="sm"
                  onClick={() => addAnswer(bi)}
                  disabled={disabled}
                >
                  <Plus className="h-3.5 w-3.5" />
                  إجابة أخرى
                </StudioButton>
              </div>
            </div>
          ))}
        </div>
        <StudioButton variant="soft" size="sm" onClick={addBlank} disabled={disabled} className="mt-2">
          <Plus className="h-3.5 w-3.5" />
          إضافة فراغ
        </StudioButton>
      </div>
    </div>
  );
}

/* ---------------- Matching ---------------- */
function MatchingEditor({
  value,
  onChange,
  disabled,
}: {
  value: QuestionContent;
  onChange: (patch: Partial<QuestionContent>) => void;
  disabled?: boolean;
}) {
  const pairs = value.pairs ?? [];

  const add = () =>
    onChange({ pairs: [...pairs, { id: newId(), left: "", right: "" }] });
  const update = (id: string, patch: Partial<MatchingPair>) =>
    onChange({ pairs: pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const remove = (id: string) =>
    onChange({ pairs: pairs.filter((p) => p.id !== id) });

  return (
    <div className="space-y-3">
      <SectionLabel>أزواج المطابقة</SectionLabel>
      <div className="space-y-2">
        {pairs.map((pair, i) => (
          <div
            key={pair.id}
            className="flex items-center gap-2 rounded-lg border border-studio-border bg-studio-surface p-2"
          >
            <span className="text-xs font-medium text-studio-fg-subtle">{i + 1}</span>
            <AppInput
              value={pair.left}
              disabled={disabled}
              onChange={(e) => update(pair.id, { left: e.target.value })}
              placeholder="الجانب الأول"
              className="bg-studio-soft"
            />
            <span className="text-studio-fg-subtle">↔</span>
            <AppInput
              value={pair.right}
              disabled={disabled}
              onChange={(e) => update(pair.id, { right: e.target.value })}
              placeholder="الجانب الثاني"
              className="bg-studio-soft"
            />
            <button
              type="button"
              aria-label="حذف الزوج"
              onClick={() => remove(pair.id)}
              disabled={disabled || pairs.length <= 1}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-danger disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <StudioButton variant="soft" size="sm" onClick={add} disabled={disabled}>
        <Plus className="h-3.5 w-3.5" />
        إضافة زوج
      </StudioButton>
      <div className="pt-1">
        <AppSwitch
          checked={!!value.shufflePairs}
          disabled={disabled}
          onCheckedChange={(c) => onChange({ shufflePairs: c })}
          aria-label="خلط ترتيب الأزواج عند العرض"
        />
      </div>
    </div>
  );
}

/* ---------------- Ordering ---------------- */
function OrderingEditor({
  value,
  onChange,
  disabled,
}: {
  value: QuestionContent;
  onChange: (patch: Partial<QuestionContent>) => void;
  disabled?: boolean;
}) {
  const items = value.items ?? [];

  const add = () =>
    onChange({ items: [...items, { id: newId(), text: "" }] });
  const update = (id: string, text: string) =>
    onChange({ items: items.map((it) => (it.id === id ? { ...it, text } : it)) });
  const remove = (id: string) =>
    onChange({ items: items.filter((it) => it.id !== id) });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    if (m !== undefined) {
      next.splice(to, 0, m);
      onChange({ items: next });
    }
  };

  return (
    <div className="space-y-3">
      <SectionLabel>عناصر الترتيب (بالترتيب الصحيح)</SectionLabel>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-lg border border-studio-border bg-studio-surface p-2"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-studio-fg-subtle" />
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-studio-soft text-xs font-medium text-studio-fg-muted">
              {i + 1}
            </span>
            <AppInput
              value={item.text}
              disabled={disabled}
              onChange={(e) => update(item.id, e.target.value)}
              placeholder="نص العنصر"
              className="bg-studio-soft"
            />
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                aria-label="تحريك لأعلى"
                onClick={() => move(i, i - 1)}
                disabled={disabled || i === 0}
                className="flex h-8 w-7 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="تحريك لأسفل"
                onClick={() => move(i, i + 1)}
                disabled={disabled || i === items.length - 1}
                className="flex h-8 w-7 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                aria-label="حذف العنصر"
                onClick={() => remove(item.id)}
                disabled={disabled || items.length <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-danger disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <StudioButton variant="soft" size="sm" onClick={add} disabled={disabled}>
        <Plus className="h-3.5 w-3.5" />
        إضافة عنصر
      </StudioButton>
    </div>
  );
}

/* ---------------- Numeric ---------------- */
function NumericEditor({
  value,
  onChange,
  disabled,
}: {
  value: QuestionContent;
  onChange: (patch: Partial<QuestionContent>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <SectionLabel>الإجابة الصحيحة</SectionLabel>
        <AppInput
          type="number"
          aria-label="الإجابة الصحيحة"
          value={value.answer ?? ""}
          disabled={disabled}
          onChange={(e) =>
            onChange({ answer: e.target.value === "" ? undefined : Number(e.target.value) })
          }
          className="bg-studio-soft"
        />
      </div>
      <div>
        <SectionLabel>هامش الخطأ</SectionLabel>
        <AppInput
          type="number"
          aria-label="هامش الخطأ"
          value={value.tolerance ?? ""}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              tolerance: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="bg-studio-soft"
        />
      </div>
      <div>
        <SectionLabel>الوحدة (اختياري)</SectionLabel>
        <AppInput
          aria-label="الوحدة"
          value={value.unit ?? ""}
          disabled={disabled}
          onChange={(e) => onChange({ unit: e.target.value || null })}
          placeholder="مثال: كجم"
          className="bg-studio-soft"
        />
      </div>
    </div>
  );
}

/* ---------------- File Upload ---------------- */
function FileUploadNote() {
  return (
    <StudioSurfaceCard variant="ghost" padding="md" className="border border-studio-border">
      <p className="text-sm text-studio-fg">
        سيتم تقييم المرفق يدوياً من قبل المصحح.
      </p>
      <p className="mt-1 text-xs text-studio-fg-muted">
        يمكن للطالب رفع ملف واحد أو أكثر، ويُراجَع هذا النوع يدوياً بعد التسليم.
      </p>
    </StudioSurfaceCard>
  );
}

/* ---------------- Coding ---------------- */
function CodingEditor({
  value,
  onChange,
  disabled,
}: {
  value: QuestionContent;
  onChange: (patch: Partial<QuestionContent>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <StudioSurfaceCard variant="ghost" padding="md" className="border border-studio-border">
        <p className="text-sm text-studio-fg">
          محرر الكود وقارئ الكود سيتم دمجه لاحقاً.
        </p>
        <p className="mt-1 text-xs text-studio-fg-muted">
          عند اكتمال التكامل، سيتمكن الطلاب من كتابة الكود داخل بيئة التشغيل وتقييمه آلياً.
        </p>
      </StudioSurfaceCard>
      <div>
        <SectionLabel>اللغة البرمجية</SectionLabel>
        <AppInput
          value={value.language ?? ""}
          disabled={disabled}
          onChange={(e) => onChange({ language: e.target.value || null })}
          placeholder="مثال: javascript, python"
          className="bg-studio-soft"
        />
      </div>
      <div>
        <SectionLabel>الكود الابتدائي (Starter Code)</SectionLabel>
        <AppTextarea
          value={value.starterCode ?? ""}
          disabled={disabled}
          onChange={(e) => onChange({ starterCode: e.target.value || null })}
          placeholder="الكود الذي يظهر للطالب عند البدء..."
          className="bg-studio-soft min-h-[120px] font-mono text-xs"
        />
      </div>
    </div>
  );
}
