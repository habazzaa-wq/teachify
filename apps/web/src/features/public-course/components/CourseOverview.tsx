"use client";

import { cn } from "@/lib/cn";
import { FileText } from "lucide-react";

interface CourseOverviewProps {
  description: string | null;
  fullDescription: string | null;
}

export function CourseOverview({ description, fullDescription }: CourseOverviewProps) {
  const html = fullDescription || description;

  if (!html) return null;

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary/70" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          وصف الدورة
        </h2>
      </div>

      <div
        dir="rtl"
        className={cn(
          "prose prose-slate dark:prose-invert",
          "prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground",
          "prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4",
          "prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3",
          "prose-p:leading-relaxed prose-p:text-muted-foreground",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-strong:text-foreground",
          "prose-code:text-primary prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-muted prose-pre:border prose-pre:rounded-xl",
          "prose-img:rounded-2xl prose-img:shadow-md",
          "prose-li:text-muted-foreground prose-li:marker:text-primary",
          "prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/50 prose-blockquote:rounded-r-xl prose-blockquote:py-1",
          "max-w-none rounded-2xl border border-border/30 bg-card/40 p-6 sm:p-8",
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
