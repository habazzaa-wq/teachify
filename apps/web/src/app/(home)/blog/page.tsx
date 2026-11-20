import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  Compass,
  Feather,
  Hash,
  Layers3,
  Lightbulb,
  ScanSearch,
  Sparkles,
  Target,
  TimerReset,
  UserRound,
} from "lucide-react";
import styles from "@/features/blog/blog-listing.module.css";
import { routes } from "@/constants/routes";
import { BlogCoverImage } from "@/features/blog/BlogCoverImage";
import { BlogListingReveal } from "@/features/blog/BlogListingReveal";
import { BlogListingControls } from "@/features/blog/BlogListingControls";
import { blogServerService } from "@/features/blog/server-service";
import type { BlogPost } from "@/features/blog/types";
import { buildSeoMetadata, getSiteName } from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";

export const dynamic = "force-dynamic";
const ARTICLES_PER_PAGE = 12;

type Props = {
  searchParams: Promise<{ page?: string; search?: string; category?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, origin] = await Promise.all([getTenantSeoContext(), getRequestOrigin()]);
  return buildSeoMetadata(
    {
      title: { absolute: `المدونة — ${getSiteName(tenant)}` },
      description: `مقالات ونصائح تعليمية من ${getSiteName(tenant)}.`,
      canonical: canonicalUrl(origin, "/blog"),
    },
    tenant,
    origin,
  );
}

function formatDate(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
    : "—";
}

function authorInitials(name: string | null): string {
  if (!name?.trim()) return "م";
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
}

function colorMix(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function ArticleImage({ post, compact = false }: { post: BlogPost; compact?: boolean }) {
  const className = `relative w-full overflow-hidden bg-[var(--brand-primary)] ${
    compact ? "aspect-[16/10] sm:aspect-[5/3]" : "aspect-[16/10]"
  }`;

  if (post.cover_image_url) {
    return (
      <BlogCoverImage
        src={post.cover_image_url}
        alt={post.title}
        className={className}
        imageClassName="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <span
        className="absolute -left-8 -top-10 h-28 w-28 rounded-full border-4"
        style={{ borderColor: colorMix("var(--brand-primary-contrast)", 22) }}
      />
      <span
        className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full border"
        style={{ borderColor: colorMix("var(--brand-primary-contrast)", 20) }}
      />
      <BookOpen
        className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2"
        strokeWidth={1.2}
        style={{ color: colorMix("var(--brand-primary-contrast)", 70) }}
      />
      <span
        className="absolute bottom-2.5 right-3 font-mono text-[8px] tracking-[.22em]"
        style={{ color: colorMix("var(--brand-primary-contrast)", 65) }}
      >
        JOURNAL
      </span>
    </div>
  );
}

function MetaRow({ post, inverse = false }: { post: BlogPost; inverse?: boolean }) {
  const borderColor = inverse ? colorMix("var(--brand-primary-contrast)", 22) : "hsl(var(--border) / 0.7)";
  const metaColor = inverse ? colorMix("var(--brand-primary-contrast)", 78) : "hsl(var(--muted-foreground))";
  const accent = inverse ? "var(--brand-primary-contrast)" : "var(--brand-primary)";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-t pt-2.5" style={{ borderColor }}>
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-black"
          style={{ color: accent, background: colorMix(accent, inverse ? 14 : 10), boxShadow: `inset 0 0 0 1px ${colorMix(accent, 18)}` }}
        >
          {post.author ? authorInitials(post.author) : <UserRound className="h-3.5 w-3.5" />}
        </span>
        <span className="max-w-28 truncate text-[11px] font-bold">{post.author ?? "كاتب المقال"}</span>
      </div>
      <div className="flex items-center gap-2.5 text-[10px]" style={{ color: metaColor }}>
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" style={{ color: accent }} />{formatDate(post.published_at)}</span>
        <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" style={{ color: accent }} />{post.reading_minutes} د</span>
      </div>
    </div>
  );
}

function ArticleCard({ post, index }: { post: BlogPost; index: number }) {
  const badge =
    index % 3 === 1
      ? { background: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }
      : { background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" };

  return (
    <article className={`${styles.articleCard} group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card`}>
      <Link href={`/blog/${post.slug}`} aria-label={`اقرأ: ${post.title}`} className="relative block overflow-hidden">
        <ArticleImage post={post} compact />
        {post.category && (
          <span className="absolute right-2.5 top-2.5 rounded-md px-2 py-1 text-[9px] font-extrabold" style={badge}>
            {post.category}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-bold">
          <span className="inline-flex items-center gap-1.5" style={{ color: "var(--brand-primary)" }}>
            <span className={styles.geoIndex}>{String(index + 1).padStart(2, "0")}</span>
            <span>مسار</span>
          </span>
          <ArrowUpLeft className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--brand-primary)]" />
        </div>
        <h3 className="line-clamp-2 font-display text-[15px] font-black leading-6 transition-colors group-hover:text-[var(--brand-primary)] sm:text-base sm:leading-7">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && <p className="mt-1.5 line-clamp-2 text-[12px] leading-6 text-muted-foreground">{post.excerpt}</p>}
        <div className="mt-auto pt-3">
          <MetaRow post={post} />
        </div>
      </div>
    </article>
  );
}

function FeaturedArticle({ post }: { post: BlogPost }) {
  const contrast = "var(--brand-primary-contrast)";
  return (
    <article
      className={`${styles.featuredCard} ${styles.facet} group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60`}
      style={{ background: "var(--brand-primary)", color: contrast }}
    >
      <div className="grid h-full sm:grid-cols-[1.05fr_.95fr]">
        <div className="flex flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] font-extrabold" style={{ borderColor: colorMix(contrast, 30) }}>
              <Sparkles className="h-3 w-3" /> اختيار المحرر
            </span>
            {post.category && (
              <span className="rounded-md px-2 py-1 text-[9px] font-extrabold" style={{ background: colorMix(contrast, 16), color: contrast }}>
                {post.category}
              </span>
            )}
          </div>
          <h3 className="mt-3 font-display text-xl font-black leading-[1.45] sm:text-2xl">
            <Link href={`/blog/${post.slug}`} className="transition-opacity hover:opacity-85">{post.title}</Link>
          </h3>
          <p className="mt-2 line-clamp-3 text-[13px] leading-7 sm:text-sm" style={{ color: colorMix(contrast, 82) }}>
            {post.excerpt ?? "فكرة جديدة تستحق القراءة — افتح المقال واكتشف تفاصيله."}
          </p>
          <div className="mt-auto pt-3">
            <MetaRow post={post} inverse />
            <Link
              href={`/blog/${post.slug}`}
              className="mt-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] font-extrabold transition-transform hover:-translate-y-0.5"
              style={{ background: contrast, color: "var(--brand-primary)" }}
            >
              اقرأ الآن <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <Link href={`/blog/${post.slug}`} aria-label={`اقرأ: ${post.title}`} className="relative block min-h-[180px] overflow-hidden sm:min-h-0">
          <ArticleImage post={post} />
          <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] font-bold tracking-widest" style={{ color: colorMix(contrast, 60) }}>01 · FEATURED</span>
        </Link>
      </div>
    </article>
  );
}

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const search = (params.search ?? "").trim().slice(0, 100);
  const category = (params.category ?? "").trim().slice(0, 80);
  const response = await blogServerService.page(currentPage, ARTICLES_PER_PAGE, search, category);
  if (!response) notFound();

  const posts = response.data;
  const showFeatured = currentPage === 1 && !search && !category && posts.length > 0;
  const featured = showFeatured ? posts[0] : null;
  const gridPosts = featured ? posts.slice(1) : posts;
  const categories = response.categories ?? [];
  const noResults = posts.length === 0;
  const articleCountLabel = response.meta.total.toLocaleString("ar-EG");
  const categoryCountLabel = categories.length.toLocaleString("ar-EG");
  const visibleMinutes = posts.map((p) => p.reading_minutes).filter((n) => Number.isFinite(n) && n > 0);
  const avgRead = visibleMinutes.length ? Math.round(visibleMinutes.reduce((a, b) => a + b, 0) / visibleMinutes.length) : null;
  const readLabel = avgRead ? `${avgRead.toLocaleString("ar-EG")} د` : "—";
  const articleCountDescription = search ? "نتيجة مطابقة" : category ? "في هذا الموضوع" : "مقال منشور";

  const readingCues = [
    { icon: ScanSearch, title: "استكشف", text: "تصفّح العناوين والموضوعات للوصول إلى ما يهمك بسرعة." },
    { icon: BookOpen, title: "اقرأ بعمق", text: "افتح المقال وتابع الفكرة بخطواتها من الفكرة إلى التطبيق." },
    { icon: Lightbulb, title: "طبّق", text: "حوّل ما قرأته إلى ممارسة أو خطوة عملية في مسارك." },
  ];

  return (
    <div className="min-h-screen bg-background pb-8 text-foreground sm:pb-10" dir="rtl">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
        {/* ── Compact Hero ─────────────────────────────────── */}
        <BlogListingReveal>
          <header className="relative mt-3 overflow-hidden rounded-xl border border-border/70 bg-card sm:mt-4">
            <div className="grid lg:grid-cols-[1.08fr_.92fr]">
              <div className="relative z-10 flex flex-col p-4 sm:p-5 lg:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-[10px] font-extrabold tracking-wide text-muted-foreground">
                    <span className="h-px w-6" style={{ background: "var(--brand-primary)" }} />
                    مجلة المعرفة · THE MECHANIST
                  </p>
                  <Link href={routes.home} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground transition-colors hover:text-[var(--brand-primary)]">
                    <ArrowLeft className="h-3 w-3" /> الرئيسية
                  </Link>
                </div>
                <h1 className="mt-3 max-w-xl font-display text-2xl font-black leading-[1.35] tracking-tight sm:text-3xl lg:text-[2rem]">
                  أفكار تُقرأ بوضوح،
                  <span style={{ color: "var(--brand-primary)" }}> وتُبنى عليها خطوات.</span>
                </h1>
                <p className="mt-2 max-w-xl text-[13px] leading-7 text-muted-foreground sm:text-sm">
                  مكتبة مقالات تعليمية مرتّبة حسب الموضوع والاهتمام — تصفّح، اقرأ، وارجع للفكرة وقتما احتجتها.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a href="#browse-articles" className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] font-extrabold transition-transform hover:-translate-y-0.5" style={{ background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}>
                    تصفّح المقالات <ArrowDown className="h-3.5 w-3.5" />
                  </a>
                  <a href="#latest-articles" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-extrabold transition-colors hover:text-[var(--brand-primary)]">
                    <Compass className="h-3.5 w-3.5" /> الأحدث
                  </a>
                  <span className="mr-auto hidden items-center gap-2 text-[10px] font-bold text-muted-foreground sm:inline-flex">
                    <span className={styles.stepBar} aria-hidden="true"><span /><span /><span /></span>
                    قراءة · تأمّل · تطبيق
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/70 pt-3 sm:grid-cols-4">
                  {[
                    { icon: BookOpen, value: articleCountLabel, label: articleCountDescription, color: "var(--brand-primary)" },
                    { icon: Layers3, value: categoryCountLabel, label: "موضوع", color: "var(--brand-secondary)" },
                    { icon: TimerReset, value: readLabel, label: "متوسط قراءة", color: "hsl(var(--foreground))" },
                    { icon: Hash, value: response.meta.current_page.toLocaleString("ar-EG"), label: `صفحة من ${response.meta.last_page.toLocaleString("ar-EG")}`, color: "var(--brand-primary)" },
                  ].map(({ icon: Icon, value, label, color }) => (
                    <div key={label} className={`${styles.facet} flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2.5`}>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: colorMix(color, 12), color }}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-base font-black leading-none tabular-nums">{value}</p>
                        <p className="mt-0.5 truncate text-[10px] font-semibold text-muted-foreground">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3D isometric geometric scene */}
              <div className={`${styles.stage} border-t border-border/70 lg:border-r lg:border-t-0`} aria-hidden="true">
                <div className={styles.isoGrid} />
                <div className={`${styles.orbit} ${styles.orbitA}`} />
                <div className={`${styles.orbit} ${styles.orbitB}`} />
                <div className={styles.scene}>
                  <div className={`${styles.prism} ${styles.p1}`}><span className={styles.prismTop} /><span className={styles.prismLeft} /><span className={styles.prismRight} /></div>
                  <div className={`${styles.prism} ${styles.p2}`}><span className={styles.prismTop} /><span className={styles.prismLeft} /><span className={styles.prismRight} /></div>
                  <div className={`${styles.prism} ${styles.p3}`}><span className={styles.prismTop} /><span className={styles.prismLeft} /><span className={styles.prismRight} /></div>
                  <div className={`${styles.prism} ${styles.p4}`}><span className={styles.prismTop} /><span className={styles.prismLeft} /><span className={styles.prismRight} /></div>
                </div>
                <span className={`${styles.floatGlyph} ${styles.glyphA}`}>٣D</span>
                <span className={`${styles.floatGlyph} ${styles.glyphB}`}>IDEAS</span>
              </div>
            </div>
          </header>
        </BlogListingReveal>

        {/* ── Ticker ───────────────────────────────────────── */}
        <div className={`${styles.ticker} mt-2.5 overflow-hidden rounded-lg border border-border/60 bg-card py-2`} aria-hidden="true">
          <div className={`${styles.tickerTrack} items-center gap-6 whitespace-nowrap`}>
            {Array.from({ length: 2 }).map((_, group) => (
              <div key={group} className="flex items-center gap-6">
                {["فضول", "قراءة مركّزة", "فكرة قابلة للتطبيق", "معرفة منظّمة", "تعلّم مستمر"].map((item) => (
                  <span key={`${group}-${item}`} className="flex items-center gap-6 text-[10px] font-extrabold tracking-wide text-muted-foreground">
                    {item}
                    <span className="h-1 w-1 rotate-45 rounded-[2px]" style={{ background: "var(--brand-primary)" }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Featured + reading guide ─────────────────────── */}
        {featured && (
          <BlogListingReveal delay={0.05} className="mt-4 sm:mt-5">
            <div className="grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
              <FeaturedArticle post={featured} />
              <aside className={`${styles.facet} flex flex-col rounded-xl border border-border/70 bg-card p-4`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-extrabold" style={{ color: "var(--brand-secondary)" }}>دليل القراءة</p>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
                <h2 className="mt-1 font-display text-base font-black">كيف تستفيد من المقال؟</h2>
                <ul className="mt-3 space-y-2.5">
                  {readingCues.map(({ icon: Icon, title, text }, i) => (
                    <li key={title} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: i === 1 ? "var(--brand-primary)" : colorMix("var(--brand-primary)", 10), color: i === 1 ? "var(--brand-primary-contrast)" : "var(--brand-primary)" }}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-extrabold leading-5">{title}</p>
                        <p className="text-[11px] leading-5 text-muted-foreground">{text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto border-t border-border/70 pt-3">
                  <p className="text-[10px] font-bold text-muted-foreground">في هذا العدد</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="rounded-md border border-border/70 px-2 py-1 text-[10px] font-bold">{articleCountLabel} مقال</span>
                    <span className="rounded-md border border-border/70 px-2 py-1 text-[10px] font-bold">{categoryCountLabel} موضوع</span>
                    {avgRead ? <span className="rounded-md border border-border/70 px-2 py-1 text-[10px] font-bold">~{readLabel}</span> : null}
                  </div>
                </div>
              </aside>
            </div>
          </BlogListingReveal>
        )}

        {/* ── Filters ──────────────────────────────────────── */}
        <section id="browse-articles" className="scroll-mt-20">
          <BlogListingReveal delay={0.06} className="mt-4 rounded-xl border border-border/70 bg-card p-3.5 shadow-soft-xs sm:mt-5 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={styles.geoIndex} aria-hidden="true">§</span>
                <div>
                  <p className="text-[10px] font-extrabold" style={{ color: "var(--brand-primary)" }}>مسارات القراءة</p>
                  <h2 className="font-display text-base font-black leading-6 sm:text-lg">تصفّح حسب الموضوع أو ابحث</h2>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">{categoryCountLabel} موضوع</span>
            </div>
            <BlogListingControls
              categories={categories}
              activeCategory={category}
              search={search}
              currentPage={response.meta.current_page}
              lastPage={response.meta.last_page}
              total={response.meta.total}
            />
          </BlogListingReveal>
        </section>

        {noResults ? (
          <section className="mt-4 rounded-xl border border-dashed border-border bg-card/60 px-5 py-10 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: colorMix("var(--brand-primary)", 12), color: "var(--brand-primary)" }}>
              {search || category ? <BookOpen className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </span>
            <h2 className="mt-3 font-display text-lg font-black">
              {search || category ? "لم نعثر على مقالات مطابقة" : "المكتبة تستعد لمقالاتها الأولى"}
            </h2>
            <p className="mx-auto mt-1.5 max-w-lg text-[13px] leading-6 text-muted-foreground">
              {search || category ? "جرّب كلمة بحث أخرى أو أزل عوامل التصفية لاستكشاف جميع المقالات." : "سيظهر المحتوى المنشور هنا فور إضافته إلى المدونة."}
            </p>
            {(search || category) && (
              <Link href="/blog" className="mt-4 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] font-bold" style={{ background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}>
                عرض كل المقالات <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            )}
          </section>
        ) : (
          <div aria-live="polite">
            {gridPosts.length > 0 && (
              <section id="latest-articles" className="scroll-mt-20 pt-4 sm:pt-5" aria-labelledby="all-articles-heading">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-border/70 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={styles.geoIndex} aria-hidden="true"><Feather className="h-3.5 w-3.5" /></span>
                    <div>
                      <p className="text-[10px] font-extrabold" style={{ color: "var(--brand-primary)" }}>
                        {search || category ? "نتائج البحث" : "من دفتر المعرفة"}
                      </p>
                      <h2 id="all-articles-heading" className="font-display text-lg font-black leading-7 sm:text-xl">
                        {search || category ? "مقالات تناسب بحثك" : "أحدث المقالات"}
                      </h2>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                    <BookOpen className="h-3 w-3" style={{ color: "var(--brand-primary)" }} />
                    {response.meta.total.toLocaleString("ar-EG")} مقال
                  </span>
                </div>
                <div className={`${styles.cardGrid} grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
                  {gridPosts.map((post, index) => (
                    <BlogListingReveal key={post.id} delay={Math.min(index * 0.04, 0.2)} className="h-full">
                      <ArticleCard post={post} index={featured ? index + 1 : index} />
                    </BlogListingReveal>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Topics + principles (fill space) ─────────────── */}
        {!noResults && categories.length > 0 && (
          <BlogListingReveal className="mt-5 sm:mt-6">
            <section aria-labelledby="topics-heading" className="grid gap-3 lg:grid-cols-[1fr_.38fr]">
              <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={styles.geoIndex} aria-hidden="true"><Layers3 className="h-3.5 w-3.5" /></span>
                    <div>
                      <p className="text-[10px] font-extrabold" style={{ color: "var(--brand-secondary)" }}>خريطة الاهتمامات</p>
                      <h2 id="topics-heading" className="font-display text-base font-black leading-6 sm:text-lg">موضوعات للقراءة</h2>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">{categoryCountLabel} موضوع</span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.slice(0, 6).map((item, index) => {
                    const tone =
                      index % 3 === 0
                        ? { background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }
                        : index % 3 === 1
                          ? { background: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }
                          : { background: "hsl(var(--background))", color: "hsl(var(--foreground))" };
                    const topicIcons = [BookOpen, Layers3, Feather] as const;
                    const Icon = topicIcons[index % topicIcons.length] ?? BookOpen;
                    return (
                      <Link
                        key={item}
                        href={`/blog?category=${encodeURIComponent(item)}`}
                        className={`${styles.topicTile} group flex min-h-[92px] flex-col justify-between rounded-lg border border-border/60 p-3`}
                        style={tone}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Icon className="h-4 w-4" strokeWidth={1.6} />
                          <span className="font-mono text-[9px] tracking-widest opacity-70">{String(index + 1).padStart(2, "0")}</span>
                        </div>
                        <div>
                          <h3 className="font-display text-sm font-black leading-6">{item}</h3>
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold opacity-80">
                            تصفّح <ArrowUpLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <aside className="flex flex-col gap-3">
                <div className={`${styles.facet} rounded-xl border border-border/70 bg-card p-4`}>
                  <p className="text-[10px] font-extrabold" style={{ color: "var(--brand-primary)" }}>مبادئ التحرير</p>
                  <ul className="mt-2.5 space-y-2 text-[11px] leading-5 text-muted-foreground">
                    <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rotate-45 rounded-[2px]" style={{ background: "var(--brand-primary)" }} /><span><strong className="text-foreground">وضوح:</strong> فكرة واحدة في كل مقطع.</span></li>
                    <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rotate-45 rounded-[2px]" style={{ background: "var(--brand-primary)" }} /><span><strong className="text-foreground">سياق:</strong> ربط المعرفة بالتطبيق.</span></li>
                    <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rotate-45 rounded-[2px]" style={{ background: "var(--brand-primary)" }} /><span><strong className="text-foreground">اختصار:</strong> قيمة عالية في وقت قراءة مناسب.</span></li>
                  </ul>
                </div>
                <div className={`${styles.facet} flex flex-1 flex-col justify-between rounded-xl p-4`} style={{ background: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }}>
                  <div>
                    <p className="text-[10px] font-extrabold opacity-75">خطوتك التالية</p>
                    <h3 className="mt-1 font-display text-base font-black leading-7">من القراءة إلى الممارسة</h3>
                    <p className="mt-1 text-[11px] leading-6 opacity-85">انتقل إلى الدورات وطبّق الأفكار ضمن مسار تعلّم واضح.</p>
                  </div>
                  <Link href={routes.publicCourse} className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] font-extrabold transition-transform hover:-translate-y-0.5" style={{ background: "var(--brand-secondary-contrast)", color: "var(--brand-secondary)" }}>
                    استكشف الدورات <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </aside>
            </section>
          </BlogListingReveal>
        )}

        <footer className="mt-5 flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 text-[12px] font-bold text-muted-foreground">
            <Feather className="h-3.5 w-3.5" style={{ color: "var(--brand-primary)" }} />
            المعرفة تبدأ بفضول صغير.
          </p>
          <Link href={routes.home} className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:text-[var(--brand-primary)]">
            العودة إلى الرئيسية <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
