"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/cn";
import type { CommunityMessageContentType } from "../../types";

const CODE_BLOCK_RE = /^```(\w+)?\s*([\s\S]*?)```$/;
const INLINE_CODE_RE = /^`([^`]+)`$/;

/**
 * Renders a community message body as markdown with GFM + KaTeX.
 * Falls back to plain text for non-markdown content types.
 */
export function MessageContent({
  body,
  content_type,
  className,
}: {
  body: string;
  content_type: CommunityMessageContentType;
  className?: string;
}) {
  if (!body) return null;

  const trimmed = body.trim();
  if (content_type === "code") {
    const match = trimmed.match(CODE_BLOCK_RE);
    if (match) {
      return (
        <pre
          dir="ltr"
          className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-start font-mono text-xs text-slate-100"
        >
          <code>{match[2]!}</code>
        </pre>
      );
    }
    return (
      <pre dir="ltr" className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-start font-mono text-xs text-slate-100">
        <code>{body}</code>
      </pre>
    );
  }

  if (content_type === "math") {
    const match = trimmed.match(INLINE_CODE_RE);
    const latex = match ? match[1]! : body;
    return <InlineLatex latex={latex} className={className} />;
  }

  return (
    <div dir="auto" className={cn("message-md text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
    >
      {children}
    </a>
  ),
  p: ({ children }: { children?: React.ReactNode }) => <p className="whitespace-pre-wrap">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="my-1 list-disc ps-5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="my-1 list-decimal ps-5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="my-0.5">{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-1 border-s-2 border-primary/40 ps-3 text-muted-foreground">{children}</blockquote>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const isBlock = String(children).includes("\n");
    if (isBlock) {
      return (
        <pre dir="ltr" className="my-1 overflow-x-auto rounded-lg bg-slate-900 p-3 text-start font-mono text-xs text-slate-100">
          <code className={className}>{children}</code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>
    );
  },
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-1 overflow-x-auto">
      <table className="w-full border-collapse text-start text-xs">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-border bg-muted px-2 py-1 text-start font-bold">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-border px-2 py-1 text-start">{children}</td>
  ),
  hr: () => <hr className="my-2 border-border" />,
};

function InlineLatex({ latex, className }: { latex: string; className?: string }) {
  return (
    <span dir="ltr" className={cn("inline-block", className)}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {`$$${latex}$$`}
      </ReactMarkdown>
    </span>
  );
}
