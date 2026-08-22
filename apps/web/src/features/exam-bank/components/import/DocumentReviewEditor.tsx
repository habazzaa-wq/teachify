"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import {
  KatexSpan,
  RunText,
} from "@/components/structured-question";
import type {
  ContentRun,
  DocumentBlock,
  QuestionDocument,
} from "@/components/structured-question";
import { StudioButton } from "@/components/studio";
import { AppTextarea } from "@/components/ui";
import { cn } from "@/lib/cn";

interface DocumentReviewEditorProps {
  document: QuestionDocument;
  onChange: (next: QuestionDocument) => void;
  disabled?: boolean;
}

const UNSUPPORTED_TEXT_TYPES = new Set(["diagram", "unresolved_visual"]);

/**
 * Teacher review workspace for an extracted document.
 *
 * Honest editing: every text-bearing block can be corrected inline, blocks
 * can be removed or reordered, and unresolved visuals stay flagged until the
 * teacher deletes them or completes the missing content manually.
 */
export function DocumentReviewEditor({
  document: doc,
  onChange,
  disabled,
}: DocumentReviewEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const updateBlock = (index: number, next: DocumentBlock) => {
    const blocks = doc.blocks.map((b, i) => (i === index ? next : b));
    onChange({ ...doc, blocks });
  };

  const removeBlock = (index: number) => {
    onChange({ ...doc, blocks: doc.blocks.filter((_, i) => i !== index) });
    setEditingIndex(null);
  };

  const moveBlock = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= doc.blocks.length) return;
    const current = doc.blocks[index];
    const swapped = doc.blocks[target];
    if (!current || !swapped) return;
    const blocks = [...doc.blocks];
    blocks[index] = swapped;
    blocks[target] = current;
    onChange({ ...doc, blocks });
    setEditingIndex(null);
  };

  const blockText = (block: DocumentBlock): string => {
    switch (block.type) {
      case "paragraph":
        return runsToPlainText(block.runs);
      case "heading":
        return runsToPlainText(block.runs);
      case "list":
        return block.items.map((item) => `${item.marker} ${runsToPlainText(item.runs)}`).join("\n");
      case "table":
        return block.rows.map((row) => row.join(" | ")).join("\n");
      case "math":
        return block.latex;
      default:
        return "";
    }
  };

  const setBlockText = (block: DocumentBlock, raw: string): DocumentBlock => {
    switch (block.type) {
      case "paragraph": {
        const lines = splitLines(raw);
        const first = lines[0];
        if (first === undefined) return block;
        return { ...block, runs: [{ kind: "text", text: first } satisfies ContentRun] };
      }
      case "heading":
        return { ...block, runs: [{ kind: "text", text: raw.trim() } satisfies ContentRun] };
      case "list":
        return {
          ...block,
          items: splitLines(raw)
            .map((line) => {
              const match = line.match(/^(\(?\s*(?:\d{1,3}|[A-Za-z\u0621-\u064A])\s*[.\)\-–—:]|-)\s*(.+)$/u);
              const marker = match?.[1]?.trim() ?? "-";
              const text = match?.[2]?.trim() ?? line.trim();
              return { marker, runs: [{ kind: "text", text } satisfies ContentRun] };
            })
            .filter((item) => item.runs[0]?.text !== ""),
        };
      case "table":
        return {
          ...block,
          rows: splitLines(raw).map((line) => line.split("|").map((cell) => cell.trim())),
        };
      case "math":
        return { ...block, latex: raw.trim() };
      default:
        return block;
    }
  };

  const hasUnresolved = doc.blocks.some(
    (b): b is Extract<DocumentBlock, { type: "unresolved_visual" }> =>
      b.type === "unresolved_visual",
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-studio-fg-muted">
          راجع المحتوى المستخرج وصحّح أي أخطاء قبل إنشاء السؤال.
        </p>
        <span dir="auto" className="rounded-md bg-studio-soft px-2 py-0.5 text-[11px] text-studio-fg-muted">
          {doc.direction === "rtl" ? "من اليمين لليسار" : "من اليسار لليمين"} · {doc.language === "ar" ? "عربي" : doc.language === "en" ? "إنجليزي" : "مختلط"}
        </span>
      </div>

      {hasUnresolved && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/60 bg-amber-50/50 p-3 text-xs text-amber-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            يوجد عناصر بصرية لم يستخرجها النظام. أكمل محتواها يدوياً كنص أو معادلة، أو احذفها إذا لم تكن ضرورية.
          </span>
        </div>
      )}

      {doc.blocks.map((block, index) => {
        const isEditableText = !UNSUPPORTED_TEXT_TYPES.has(block.type);
        const isEditing = editingIndex === index;

        return (
          <div
            key={index}
            data-block-index={index}
            className={cn(
              "group relative rounded-xl border p-3 transition-colors",
              block.type === "unresolved_visual"
                ? "border-dashed border-amber-400 bg-amber-50/40"
                : "border-studio-border bg-studio-surface",
            )}
          >
            {!disabled && (
              <div className="absolute end-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {isEditableText && (
                  <button
                    type="button"
                    aria-label={`تعديل الكتلة ${index + 1}`}
                    onClick={() => setEditingIndex(isEditing ? null : index)}
                    className="rounded-md p-1.5 text-studio-fg-muted hover:bg-studio-soft hover:text-studio-fg"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`تحريك الكتلة ${index + 1} للأعلى`}
                  onClick={() => moveBlock(index, -1)}
                  disabled={index === 0}
                  className="rounded-md p-1.5 text-studio-fg-muted hover:bg-studio-soft hover:text-studio-fg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`تحريك الكتلة ${index + 1} للأسفل`}
                  onClick={() => moveBlock(index, 1)}
                  disabled={index === doc.blocks.length - 1}
                  className="rounded-md p-1.5 text-studio-fg-muted hover:bg-studio-soft hover:text-studio-fg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`حذف الكتلة ${index + 1}`}
                  onClick={() => removeBlock(index)}
                  className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-2 pe-24">
                <AppTextarea
                  autoFocus
                  value={blockText(block)}
                  disabled={disabled}
                  rows={Math.min(8, Math.max(2, blockText(block).split("\n").length))}
                  dir={block.type === "math" ? "ltr" : doc.direction}
                  onChange={(e) => updateBlock(index, setBlockText(block, e.target.value))}
                />
                {block.type === "math" && (
                  <KatexSpan latex={block.latex} className="text-xs text-studio-fg-muted" />
                )}
                <StudioButton variant="secondary" size="sm" onClick={() => setEditingIndex(null)}>
                  تم
                </StudioButton>
              </div>
            ) : (
              <BlockPreview block={block} direction={doc.direction} index={index} />
            )}
          </div>
        );
      })}

      {doc.blocks.length === 0 && (
        <p className="rounded-xl border border-dashed border-studio-border p-6 text-center text-sm text-studio-fg-muted">
          لم يتم استخراج أي محتوى من الصورة. أعد رفع صورة أوضح.
        </p>
      )}
    </div>
  );
}

function BlockPreview({
  block,
  direction,
  index,
}: {
  block: DocumentBlock;
  direction: "rtl" | "ltr";
  index: number;
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <p dir={direction} className="pe-24 leading-relaxed text-studio-fg">
          <RunText runs={block.runs} />
        </p>
      );
    case "heading":
      return (
        <h4 dir={direction} className="pe-24 font-semibold text-studio-fg">
          <RunText runs={block.runs} />
        </h4>
      );
    case "list":
      return (
        <ul dir={direction} className="pe-24 space-y-1 text-studio-fg">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 font-medium text-studio-fg-muted">{item.marker}</span>
              <span>
                <RunText runs={item.runs} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="overflow-x-auto pe-24">
          <table className="min-w-full border-collapse text-sm">
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} dir="auto" className="border border-studio-border px-2 py-1 text-studio-fg">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "math":
      return <MathPreview latex={block.latex} />;
    case "unresolved_visual":
      return (
        <div className="flex items-start gap-2 pe-24 text-xs text-amber-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>عنصر بصري غير مستخرج — أكمله يدوياً أو احذفه.</span>
        </div>
      );
    default:
      return <span className="text-xs text-studio-fg-subtle">كتلة #{index + 1}</span>;
  }
}

function MathPreview({ latex }: { latex: string }) {
  return (
    <div dir="ltr" className="overflow-x-auto rounded-lg bg-studio-soft/50 p-2 pe-28 text-center">
      <KatexSpan latex={latex} />
    </div>
  );
}

function runsToPlainText(runs: Array<{ kind: string; text?: string; latex?: string }>): string {
  return runs
    .map((r) => (r.kind === "inline_math" ? ` $${r.latex ?? ""}$ ` : (r.text ?? "")))
    .join("")
    .trim();
}

function splitLines(raw: string): string[] {
  return raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}
