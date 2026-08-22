/**
 * Structured question document contract — version 1.
 * Mirrors the backend DocumentComposer / QuestionDocumentValidator schema.
 */

export type TextRunKind = "text" | "inline_math";

export interface TextRun {
  kind: "text";
  text: string;
}

export interface InlineMathRun {
  kind: "inline_math";
  latex: string;
  confidence?: number;
}

export type ContentRun = TextRun | InlineMathRun;

export interface ParagraphBlock {
  type: "paragraph";
  runs: ContentRun[];
  confidence?: number;
}

export interface HeadingBlock {
  type: "heading";
  level: 2 | 3;
  runs: ContentRun[];
}

export interface MathBlock {
  type: "math";
  latex: string;
  display?: boolean;
  confidence?: number;
}

export interface DiagramLabel {
  text: string;
  x: number;
  y: number;
  confidence?: number;
}

export interface DiagramBlock {
  type: "diagram";
  format: "svg";
  svg: string;
  shapes?: string[];
  labels?: DiagramLabel[];
  confidence?: number;
}

export interface ListItem {
  marker: string;
  runs: ContentRun[];
}

export interface ListBlock {
  type: "list";
  ordered?: boolean;
  items: ListItem[];
}

export interface TableBlock {
  type: "table";
  rows: string[][];
  headerRow?: boolean;
}

export interface UnresolvedVisualBlock {
  type: "unresolved_visual";
  reason?: string;
  region?: { x: number; y: number; w: number; h: number };
  bounds?: { x: number; y: number; width: number; height: number };
  confidence?: number;
  description?: string;
}

export interface ImageBlock {
  type: "image";
  src: string;
  alt?: string | null;
  caption?: string | null;
}

export interface ChemicalEquationBlock {
  type: "chemical_equation";
  content: string;
  latex?: string;
}

export interface CalloutBlock {
  type: "callout";
  variant?: "info" | "warning" | "success";
  text?: string;
  runs?: ContentRun[];
}

export interface SeparatorBlock {
  type: "separator";
}

export type DocumentBlock =
  | ParagraphBlock
  | HeadingBlock
  | MathBlock
  | DiagramBlock
  | ListBlock
  | TableBlock
  | ImageBlock
  | ChemicalEquationBlock
  | CalloutBlock
  | SeparatorBlock
  | UnresolvedVisualBlock;

export interface QuestionDocumentMeta {
  ocr?: "ok" | "unavailable" | "failed";
  ocrConfidence?: number;
  [key: string]: unknown;
}

export interface QuestionDocument {
  version: 1;
  direction: "rtl" | "ltr";
  language: "ar" | "en" | "mixed";
  meta?: QuestionDocumentMeta;
  blocks: DocumentBlock[];
}

/** Runtime guard for documents coming from the API or drafts. */
export function parseQuestionDocument(value: unknown): QuestionDocument | null {
  if (!value || typeof value !== "object") return null;
  const doc = value as Partial<QuestionDocument>;
  if (doc.version !== 1) return null;
  if (!Array.isArray(doc.blocks)) return null;
  return {
    version: 1,
    direction: doc.direction === "ltr" ? "ltr" : "rtl",
    language:
      doc.language === "en" || doc.language === "mixed" ? doc.language : "ar",
    meta: doc.meta,
    blocks: doc.blocks as DocumentBlock[],
  };
}
