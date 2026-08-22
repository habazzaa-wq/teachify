"use client";

import katex from "katex";
import { useMemo } from "react";
import type { ContentRun, InlineMathRun, TextRun } from "./types";

function isInlineMath(run: ContentRun): run is InlineMathRun {
  return run.kind === "inline_math";
}

export function KatexSpan({
  latex,
  className,
}: {
  latex: string;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        strict: false,
        output: "html",
      });
    } catch {
      return null;
    }
  }, [latex]);

  // Math is always LTR even inside RTL documents; inline-block keeps it
  // from being visually reordered by the surrounding bidi context.
  if (html === null) {
    return (
      <span dir="ltr" className={`inline-block font-mono text-sm ${className ?? ""}`}>
        {latex}
      </span>
    );
  }

  return (
    <span
      dir="ltr"
      className={`inline-block ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function KatexDisplay({
  latex,
  className,
}: {
  latex: string;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        strict: false,
        displayMode: true,
        output: "html",
      });
    } catch {
      return null;
    }
  }, [latex]);

  return (
    <div
      dir="ltr"
      className={`my-1 overflow-x-auto text-center ${className ?? ""}`}
      dangerouslySetInnerHTML={
        html !== null ? { __html: html } : undefined
      }
    >
      {html === null ? <code className="font-mono text-sm">{latex}</code> : null}
    </div>
  );
}

/** Renders a mixed list of text / inline-math runs in reading order. */
export function RunText({ runs }: { runs: ContentRun[] }) {
  return (
    <>
      {runs.map((run, i) =>
        isInlineMath(run) ? (
          <KatexSpan key={i} latex={run.latex} />
        ) : (
          <span key={i}>{(run as TextRun).text}</span>
        ),
      )}
    </>
  );
}
