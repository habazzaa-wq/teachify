import Link from "next/link";
import type { LegalContent } from "@/features/legal/types";

const STATUS_COLORS: Record<string, string> = {
  "01": "var(--brand-primary)",
  "02": "var(--brand-secondary)",
  "03": "var(--brand-primary)",
  "04": "var(--brand-secondary)",
  "05": "var(--brand-primary)",
  "06": "var(--brand-secondary)",
  "07": "var(--brand-primary)",
  "08": "var(--brand-secondary)",
  "09": "var(--brand-primary)",
  "10": "var(--brand-secondary)",
};

function SectionBlock({ index, heading, body }: { index: number; heading: string; body: string }) {
  const label = String(index + 1).padStart(2, "0");
  const accent = STATUS_COLORS[label] ?? "var(--brand-secondary)";
  return (
    <section className="relative rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] text-sm font-extrabold"
          style={{ borderColor: accent, backgroundColor: "transparent", color: accent }}
        >
          {label}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-[3px] w-6 shrink-0 rounded-full"
              style={{ background: `linear-gradient(90deg, ${
                index % 2 === 0 ? "var(--brand-secondary)" : "var(--brand-primary)"
              }, transparent)` }}
            />
            <h2 className="font-display text-xl font-bold leading-tight text-foreground sm:text-[22px]">
              {heading}
            </h2>
          </div>
          <p className="mt-3 whitespace-pre-line text-[15px] font-normal leading-8 text-muted-foreground">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}

export function LegalPageContent({ content }: { content: LegalContent }) {
  return (
    <article dir="rtl" className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground transition-colors hover:text-[var(--brand-primary)]"
      >
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-0.5">
          ←
        </span>
        العودة إلى الرئيسية
      </Link>

      <div className="mt-8">
        <span
          aria-hidden="true"
          className="h-px w-14 rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))",
          }}
        />
        <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
          {content.title}
        </h1>
        {content.updatedAt && (
          <p className="mt-3 text-[13px] font-medium text-muted-foreground">
            آخر تحديث: <span className="text-foreground/80">{content.updatedAt}</span>
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:gap-5">
        {content.sections.map((section, index) => (
          <SectionBlock
            key={`${section.heading}-${index}`}
            index={index}
            heading={section.heading}
            body={section.body}
          />
        ))}
      </div>
    </article>
  );
}