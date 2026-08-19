"use client";

import { useState, useEffect } from "react";
import {
  AppInput,
  AppTextarea,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
} from "@/components/ui";
import { StudioSurfaceCard, StudioChip } from "@/components/studio";
import { DIFFICULTY_OPTIONS, QUESTION_TYPE_CONFIG, QUESTION_FORMAT_CONFIG } from "@/features/exam-bank/constants";
import { QuestionBuilderForm } from "./QuestionBuilderForm";
import { ScannedQuestionEditor } from "./ScannedQuestionEditor";
import type {
  Question,
  QuestionContent,
  ExamQuestion,
  Difficulty,
  QuestionType,
  QuestionFormat,
} from "@/features/exam-bank/types";

interface QuestionBuilderProps {
  question: Question;
  examQuestionLink?: ExamQuestion | null;
  onChange?: (payload: Record<string, unknown>) => void;
}

export function QuestionBuilder({
  question,
  onChange,
}: QuestionBuilderProps) {
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(question.difficulty);
  const [points, setPoints] = useState<number>(question.points);
  const [explanation, setExplanation] = useState(question.explanation ?? "");
  const [hint, setHint] = useState(question.hint ?? "");
  const [content, setContent] = useState<QuestionContent>(question.content ?? {});

  useEffect(() => {
    setTitle(question.title);
    setDescription(question.description ?? "");
    setDifficulty(question.difficulty);
    setPoints(question.points);
    setExplanation(question.explanation ?? "");
    setHint(question.hint ?? "");
    setContent(question.content ?? {});
  }, [question]);

  const emit = (patch: Record<string, unknown>) => {
    onChange?.({
      title,
      description: description || null,
      difficulty,
      points,
      explanation: explanation || null,
      hint: hint || null,
      content,
      ...patch,
    });
  };

  const typeCfg = QUESTION_TYPE_CONFIG[question.type as QuestionType];

  const isImageFormat = ((question.questionFormat as QuestionFormat) ?? "text") === "image";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StudioChip variant="accent" size="sm">
          {typeCfg.label}
        </StudioChip>
        {isImageFormat && (
          <StudioChip variant="success" size="sm">
            {QUESTION_FORMAT_CONFIG.image.label}
          </StudioChip>
        )}
        <span className="text-xs text-studio-fg-subtle">
          {points} نقطة
        </span>
      </div>

      {!isImageFormat && (
        <>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-studio-fg-muted">العنوان</p>
            <AppInput
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                emit({ title: e.target.value });
              }}
              placeholder="عنوان السؤال"
              className="bg-studio-soft"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-studio-fg-muted">الوصف (اختياري)</p>
            <AppTextarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                emit({ description: e.target.value || null });
              }}
              placeholder="وصف مختصر للسؤال..."
              className="bg-studio-soft"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-studio-fg-muted">الصعوبة</p>
          <AppSelect
            value={difficulty}
            onValueChange={(v) => {
              setDifficulty(v as Difficulty);
              emit({ difficulty: v });
            }}
          >
            <AppSelectTrigger className="bg-studio-soft">
              <AppSelectValue />
            </AppSelectTrigger>
            <AppSelectContent>
              {DIFFICULTY_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-studio-fg-muted">النقاط</p>
          <AppInput
            type="number"
            min={0}
            value={points}
            onChange={(e) => {
              const value = Number(e.target.value) || 0;
              setPoints(value);
              emit({ points: value });
            }}
            className="bg-studio-soft"
          />
        </div>
      </div>

      <StudioSurfaceCard variant="default" padding="md">
        <p className="mb-3 text-sm font-semibold text-studio-fg">
          {isImageFormat ? "صورة السؤال" : "محتوى السؤال"}
        </p>
        {isImageFormat ? (
          <ScannedQuestionEditor
            questionId={question.id}
            scanUrl={question.scanUrl}
            disabled={false}
          />
        ) : (
          <QuestionBuilderForm
            type={question.type}
            value={content}
            onChange={(next) => {
              setContent(next);
              emit({ content: next });
            }}
          />
        )}
      </StudioSurfaceCard>

      {isImageFormat && (
        <StudioSurfaceCard variant="default" padding="md">
          <p className="mb-3 text-sm font-semibold text-studio-fg">خيارات الإجابة</p>
          <QuestionBuilderForm
            type={question.type}
            value={content}
            onChange={(next) => {
              setContent(next);
              emit({ content: next });
            }}
          />
        </StudioSurfaceCard>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-studio-fg-muted">الشرح (اختياري)</p>
          <AppTextarea
            value={explanation}
            onChange={(e) => {
              setExplanation(e.target.value);
              emit({ explanation: e.target.value || null });
            }}
            placeholder="شرح الإجابة..."
            className="bg-studio-soft"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-studio-fg-muted">تلميح (اختياري)</p>
          <AppTextarea
            value={hint}
            onChange={(e) => {
              setHint(e.target.value);
              emit({ hint: e.target.value || null });
            }}
            placeholder="تلميح للطالب..."
            className="bg-studio-soft"
          />
        </div>
      </div>
    </div>
  );
}

export default QuestionBuilder;
