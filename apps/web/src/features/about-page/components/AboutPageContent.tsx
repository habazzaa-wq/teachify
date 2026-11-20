import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Sparkles } from "lucide-react";
import { AboutIcon } from "../icons";
import type { AboutPageSettings } from "../types";

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-extrabold tracking-wide text-[var(--brand-primary)] sm:text-sm">
      <span className="h-px w-8 bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

function safeAboutHref(value: string): string | null {
  const href = value.trim();
  if (!href || /[\u0000-\u001f\\]/.test(href)) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("#") || /^(mailto:|tel:)/i.test(href)) return href;

  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function safeImageUrl(value: string): string {
  const image = value.trim();
  if (!image || /[\u0000-\u001f\\]/.test(image)) return "";

  try {
    const url = new URL(image, "https://about-page.local");
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (url.hostname === "about-page.local" && image.startsWith("/") && !image.startsWith("//")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    return /^https?:\/\//i.test(image) ? url.href : "";
  } catch {
    return "";
  }
}

export function AboutPageContent({ content }: { content: AboutPageSettings }) {
  const heroImage = safeImageUrl(content.hero.image);
  const heroActionUrl = safeAboutHref(content.hero.primaryActionUrl);
  const ctaUrl = safeAboutHref(content.cta.buttonUrl);
  const storyParagraphs = content.story.body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());

  return (
    <div dir="rtl" className="overflow-hidden bg-background text-foreground">
      <section className="px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl sm:rounded-[2.75rem] lg:min-h-[590px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(ellipse_at_80%_90%,var(--brand-primary),transparent_45%)] opacity-70" />
          <div className="relative z-10 flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-bold text-white/85 backdrop-blur">
              <AboutIcon name={content.hero.icon} className="h-4 w-4 text-[var(--brand-secondary)]" />
              {content.hero.eyebrow}
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.2] tracking-tight sm:text-5xl lg:text-6xl">
              {content.hero.title}{" "}
              <span className="text-[var(--brand-secondary)]">{content.hero.accent}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg sm:leading-9">
              {content.hero.description}
            </p>
            {content.hero.primaryActionLabel && heroActionUrl && (
              <Link
                href={heroActionUrl}
                className="mt-8 inline-flex w-fit items-center gap-3 rounded-xl bg-[var(--brand-primary)] px-6 py-3.5 font-bold text-[var(--brand-primary-contrast)] shadow-lg transition-transform hover:-translate-y-0.5"
              >
                {content.hero.primaryActionLabel}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            <div className="mt-10 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-white/55">
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--brand-secondary)]" />
              <span>{content.story.eyebrow} · {content.story.title}</span>
            </div>
          </div>

          <div className="relative min-h-[300px] overflow-hidden sm:min-h-[400px] lg:min-h-full">
            {heroImage ? (
              <div
                role="img"
                aria-label={content.hero.title}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${heroImage.replaceAll('"', "%22")}")` }}
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,255,255,0.18),transparent_36%),linear-gradient(145deg,rgba(255,255,255,0.08),transparent_55%)]">
                <div className="absolute inset-8 rounded-[2rem] border border-white/10 sm:inset-12" />
                <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center text-white/[0.08]">
                  <AboutIcon name={content.hero.icon} className="h-56 w-56 sm:h-72 sm:w-72" strokeWidth={0.75} />
                </div>
                <div className="absolute -left-10 top-12 h-48 w-48 rounded-full border border-white/10 sm:left-8 sm:top-16 sm:h-64 sm:w-64" />
                <div className="absolute bottom-8 right-8 h-28 w-28 rounded-full bg-[var(--brand-secondary)]/20 blur-2xl sm:bottom-16 sm:right-14 sm:h-40 sm:w-40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-transparent lg:bg-gradient-to-l lg:from-slate-950/70 lg:via-slate-950/15 lg:to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-slate-950/55 p-5 backdrop-blur-md sm:bottom-10 sm:left-10 sm:right-10 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)]">
                  <AboutIcon name={content.story.icon} className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[var(--brand-secondary)]">{content.story.eyebrow}</p>
                  <p className="mt-1 text-lg font-extrabold leading-7 text-white sm:text-xl">{content.story.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {content.stats.length > 0 && (
        <section className="px-4 pb-10 sm:px-6 sm:pb-16 lg:px-8">
          <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg shadow-foreground/[0.04] sm:grid-cols-3 sm:rounded-3xl">
            {content.stats.map((stat, index) => (
              <article key={stat.id} className={`flex items-center gap-4 px-5 py-5 sm:px-7 sm:py-6 ${index > 0 ? "border-t border-border/70 sm:border-r sm:border-t-0" : ""}`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <AboutIcon name={stat.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-black text-foreground sm:text-2xl">{stat.value}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{stat.label}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-[var(--brand-primary)]/[0.06]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card p-7 shadow-xl sm:p-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">01 / {content.story.eyebrow}</span>
                <AboutIcon name={content.story.icon} className="h-6 w-6 text-[var(--brand-primary)]" />
              </div>
              <div className="my-10 flex h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)]/10 via-[var(--brand-secondary)]/10 to-transparent sm:h-44">
                <AboutIcon name={content.story.icon} className="h-20 w-20 text-[var(--brand-primary)]/80" strokeWidth={1.2} />
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                <span className="h-px w-8 bg-[var(--brand-primary)]" />
                {content.hero.eyebrow}
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{content.hero.description}</p>
              <div className="absolute -left-6 -top-8 h-24 w-24 rounded-full border-[14px] border-[var(--brand-primary)]/[0.06]" aria-hidden="true" />
            </div>
          </div>

          <div className="lg:py-8">
            <SectionLabel>{content.story.eyebrow}</SectionLabel>
            <h2 className="mt-5 max-w-2xl text-3xl font-black leading-[1.3] text-foreground sm:text-4xl lg:text-5xl">{content.story.title}</h2>
            <div className="mt-6 max-w-3xl space-y-4 text-base leading-8 text-muted-foreground sm:text-lg sm:leading-9">
              {storyParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </div>
            {content.story.quote && (
              <blockquote className="relative mt-8 max-w-3xl overflow-hidden rounded-2xl border-r-4 border-[var(--brand-primary)] bg-muted/50 px-6 py-6 text-lg font-bold leading-8 text-foreground sm:px-8 sm:py-7 sm:text-xl">
                <span className="absolute -left-1 -top-8 font-serif text-8xl leading-none text-[var(--brand-primary)]/10" aria-hidden="true">”</span>
                <span className="relative">{content.story.quote}</span>
              </blockquote>
            )}
          </div>
        </div>
      </section>

      {content.highlights.items.length > 0 && (
        <section className="relative mt-8 overflow-hidden bg-muted/40 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[var(--brand-primary)]/[0.06] blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-6 border-b border-border/70 pb-8 sm:flex-row sm:items-end sm:pb-10">
              <div className="max-w-2xl">
                <SectionLabel>{content.highlights.eyebrow}</SectionLabel>
                <h2 className="mt-4 text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">{content.highlights.title}</h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">{content.highlights.description}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
              {content.highlights.items.map((item, index) => (
                <article key={item.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--brand-primary)]/30 hover:shadow-xl sm:rounded-3xl sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] transition-colors group-hover:bg-[var(--brand-primary)] group-hover:text-[var(--brand-primary-contrast)]">
                      <AboutIcon name={item.icon} className="h-6 w-6" />
                    </span>
                    <span className="font-mono text-sm font-bold tracking-widest text-muted-foreground/50">0{index + 1}</span>
                  </div>
                  <h3 className="mt-7 text-xl font-extrabold leading-8 text-foreground">{item.title}</h3>
                  <p className="mt-3 leading-8 text-muted-foreground">{item.description}</p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[var(--brand-primary)] opacity-0 transition-opacity group-hover:opacity-100">
                    <span>{content.hero.eyebrow}</span>
                    <ArrowUpLeft className="h-4 w-4" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[var(--brand-primary)] px-6 py-12 text-[var(--brand-primary-contrast)] shadow-2xl sm:rounded-[2.5rem] sm:px-12 sm:py-16 lg:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_100%,rgba(255,255,255,0.16),transparent_40%),radial-gradient(ellipse_at_100%_0%,rgba(0,0,0,0.12),transparent_42%)]" />
          <div className="absolute -left-12 -top-28 h-64 w-64 rounded-full border border-white/15 sm:-left-4 sm:-top-36 sm:h-80 sm:w-80" aria-hidden="true" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-current/20 bg-white/10 px-4 py-2 text-sm font-bold">
                <AboutIcon name={content.cta.icon} className="h-4 w-4" />
                {content.cta.eyebrow}
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{content.cta.title}</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 opacity-80 sm:text-lg">{content.cta.description}</p>
            </div>
            {content.cta.buttonLabel && ctaUrl && (
              <Link
                href={ctaUrl}
                className="inline-flex w-fit shrink-0 items-center gap-3 rounded-xl bg-white px-6 py-4 font-extrabold text-slate-950 shadow-lg transition-transform hover:-translate-y-0.5 sm:px-8"
              >
                {content.cta.buttonLabel}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
