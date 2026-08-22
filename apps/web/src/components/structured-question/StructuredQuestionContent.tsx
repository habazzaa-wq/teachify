"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { KatexDisplay, KatexSpan, RunText } from "./Katex";
import type {
  ContentRun,
  DiagramBlock,
  DocumentBlock,
  ListBlock,
  MathBlock,
  ParagraphBlock,
  QuestionDocument,
  TableBlock,
  UnresolvedVisualBlock,
} from "./types";

/**
 * Shared renderer for structured question documents.
 * Used by the question bank preview, the exam-taking view and results review
 * so all surfaces show identical content.
 */
export function StructuredQuestionContent({
  document: doc,
  className,
}: {
  document: QuestionDocument;
  className?: string;
}) {
  return (
    <div dir={doc.direction} className={cn("space-y-3 text-sm leading-relaxed", className)}>
      {doc.blocks.map((block, i) => (
        <BlockView key={i} block={block} index={i} />
      ))}
    </div>
  );
}

function BlockView({ block, index }: { block: DocumentBlock; index: number }) {
  const t = (block as { type: string }).type;
  if (t === "legacy_image") {
    const b = block as unknown as { url?: string; src?: string; alt?: string };
    return <ImageView block={{ type: "image", src: b.url ?? b.src ?? "", alt: b.alt ?? null } as import("./types").ImageBlock} />;
  }
  switch (block.type) {
    case "paragraph":
      return <ParagraphView block={block} />;
    case "heading":
      return <HeadingView block={block} />;
    case "math":
      return <MathView block={block} />;
    case "diagram":
      return <DiagramView block={block} />;
    case "list":
      return <ListView block={block} />;
    case "table":
      return <TableView block={block} />;
    case "image":
      return <ImageView block={block} />;
    case "chemical_equation":
      return <ChemicalView block={block} />;
    case "callout":
      return <CalloutView block={block} />;
    case "separator":
      return <hr className="my-2 border-studio-border" />;
    case "unresolved_visual":
      return <UnresolvedView block={block} index={index} />;
    default:
      return null;
  }
}

function ParagraphView({ block }: { block: ParagraphBlock }) {
  return (
    <p className="text-studio-fg">
      <RunText runs={block.runs} />
    </p>
  );
}

function HeadingView({ block }: { block: import("./types").HeadingBlock }) {
  const Tag = block.level === 2 ? "h3" : "h4";
  return (
    <Tag className={cn("font-semibold text-studio-fg", block.level === 2 ? "text-base" : "text-sm")}>
      <RunText runs={block.runs as ContentRun[]} />
    </Tag>
  );
}

function MathView({ block }: { block: MathBlock }) {
  const lowConfidence = typeof block.confidence === "number" && block.confidence < 0.7;

  return (
    <figure
      className={cn(
        "rounded-lg border p-2",
        lowConfidence ? "border-amber-400/60 bg-amber-50/40" : "border-studio-border bg-studio-soft/40",
      )}
    >
      <KatexDisplay latex={block.latex} />
    </figure>
  );
}

const SVG_UNSAFE = /<\s*(script|foreignObject|iframe|object|embed|use|image)\b|javascript\s*:/i;

function DiagramView({ block }: { block: DiagramBlock }) {
  if (SVG_UNSAFE.test(block.svg)) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-400/60 bg-amber-50/40 p-3 text-xs text-amber-700">
        <AlertTriangle className="h-4 w-4" />
        تم إخفاء رسم قد يكون غير آمن. عدّل الرسم في محرر السؤال.
      </div>
    );
  }

  const lowConfidence = typeof block.confidence === "number" && block.confidence < 0.7;

  return (
    <figure className="space-y-1">
      <div
        className="mx-auto max-w-md overflow-x-auto rounded-lg border border-studio-border bg-white p-3 text-studio-fg [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: block.svg }}
      />
      {lowConfidence && (
        <figcaption dir="rtl" className="text-center text-[11px] text-amber-600">
          دقة التعرف على الرسم منخفضة — راجعه قبل النشر
        </figcaption>
      )}
    </figure>
  );
}

function ListView({ block }: { block: ListBlock }) {
  const Tag = block.ordered ? "ol" : "ul";

  return (
    <Tag className="space-y-1.5 pr-5">
      {block.items.map((item, i) => (
        <li key={i} className="list-outside text-studio-fg" style={{ listStyleType: block.ordered ? "arabic-indic" : "disc" }}>
          <RunText runs={item.runs} />
        </li>
      ))}
    </Tag>
  );
}

function TableView({ block }: { block: TableBlock }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  dir="auto"
                  className={cn(
                    "border border-studio-border px-3 py-1.5",
                    block.headerRow && r === 0
                      ? "bg-studio-soft font-medium text-studio-fg"
                      : "text-studio-fg-muted",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImageView({ block }: { block: import("./types").ImageBlock }) {
  if (!block.src) return null;
  const safe = !/^\s*javascript:/i.test(block.src);
  if (!safe) return null;
  return (
    <figure className="space-y-1">
      <img src={block.src} alt={block.alt ?? ""} className="mx-auto max-w-full rounded-lg border border-studio-border" loading="lazy" />
      {block.caption && <figcaption className="text-center text-xs text-studio-fg-muted">{block.caption}</figcaption>}
    </figure>
  );
}

function ChemicalView({ block }: { block: import("./types").ChemicalEquationBlock }) {
  const content = block.content ?? block.latex ?? "";
  return (
    <div dir="ltr" className="rounded-lg border border-studio-border bg-studio-soft/40 p-2 text-center font-mono text-sm">
      {content}
    </div>
  );
}

function CalloutView({ block }: { block: import("./types").CalloutBlock }) {
  const text = block.text ?? "";
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
      {block.runs ? <RunText runs={block.runs} /> : text}
    </div>
  );
}

const REASON_LABELS: Record<string, string> = {
  complex_or_unclear_diagram: "رسم معقد أو غير واضح — أعد رسمه أو أرفق صورة بديلة",
  empty_region: "منطقة فارغة في الصورة الأصلية",
  svg_generation_failed: "تعذر توليد الرسم آلياً",
  reconstruction_error: "حدث خطأ أثناء تحليل الرسم",
};

function UnresolvedView({ block, index }: { block: UnresolvedVisualBlock; index: number }) {
  return (
    <div
      data-unresolved-index={index}
      className="flex items-start gap-2 rounded-lg border border-dashed border-amber-400 bg-amber-50/50 p-3 text-xs text-amber-800"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {REASON_LABELS[block.reason ?? ""] ?? "عنصر بصري لم يتمكن النظام من استخراجه"} — أكمل هذا الجزء يدوياً قبل النشر.
      </span>
    </div>
  );
}
