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
  Layers3,
  Sparkles,
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
    ? new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : "التاريخ غير متاح";
}

function authorInitials(name: string | null): string {
  if (!name?.trim()) return "م";
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
}

function ArticleImage({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const className = `relative w-full overflow-hidden bg-[var(--brand-primary)] ${
    featured
      ? "aspect-[4/3] sm:aspect-[16/9] lg:h-full lg:min-h-64 lg:aspect-auto"
      : "aspect-[16/10]"
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
        className="absolute -left-10 -top-20 h-56 w-56 rounded-full border-[8px]"
        style={{ borderColor: "color-mix(in srgb, var(--brand-primary-contrast) 24%, transparent)" }}
      />
      <span
        className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full border"
        style={{ borderColor: "color-mix(in srgb, var(--brand-primary-contrast) 22%, transparent)" }}
      />
      <BookOpen
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2"
        strokeWidth={1}
        style={{ color: "color-mix(in srgb, var(--brand-primary-contrast) 72%, transparent)" }}
      />
      <span
        className="absolute bottom-4 right-4 font-mono text-[9px] tracking-[.28em]"
        style={{ color: "color-mix(in srgb, var(--brand-primary-contrast) 70%, transparent)" }}
      >
        THE MECHANIST
      </span>
    </div>
  );
}

function AuthorAndMeta({ post, inverse = false }: { post: BlogPost; inverse?: boolean }) {
  const borderColor = inverse
    ? "color-mix(in srgb, var(--brand-primary-contrast) 24%, transparent)"
    : "hsl(var(--border) / 0.7)";
  const metaColor = inverse
    ? "color-mix(in srgb, var(--brand-primary-contrast) 78%, transparent)"
    : "hsl(var(--muted-foreground))";
  const accent = inverse ? "var(--brand-primary-contrast)" : "var(--brand-primary)";

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t pt-3" style={{ borderColor }}>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
          style={{
            color: accent,
            background: colorMix(accent, inverse ? 14 : 10),
            boxShadow: `inset 0 0 0 1px ${colorMix(accent, 18)}`,
          }}
        >
          {post.author ? authorInitials(post.author) : <UserRound className="h-4 w-4" />}
        </span>
        <span className="max-w-32 truncate text-xs font-bold">{post.author ?? "كاتب المقال"}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: metaColor }}>
        <span className="inline-flex items-center gap-1" style={{ color: accent }}>
          <CalendarDays className="h-3.5 w-3.5" />
          <span style={{ color: metaColor }}>{formatDate(post.published_at)}</span>
        </span>
        <span className="inline-flex items-center gap-1" style={{ color: accent }}>
          <Clock3 className="h-3.5 w-3.5" />
          <span style={{ color: metaColor }}>{post.reading_minutes} د</span>
        </span>
      </div>
    </div>
  );
}

function colorMix(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function ArticleCard({ post, index }: { post: BlogPost; index: number }) {
  const badge =
    index % 3 === 1
      ? { background: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }
      : { background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" };

  return (
    <article
      className={`${styles.articleCard} group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft-xs`}
    >
      <Link href={`/blog/${post.slug}`} aria-label={`اقرأ: ${post.title}`} className="relative block overflow-hidden">
        <ArticleImage post={post} />
        {post.category && (
          <span className="absolute right-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-extrabold" style={badge}>
            {post.category}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-[10px] font-extrabold">
          <span className="inline-flex items-center gap-2" style={{ color: "var(--brand-primary)" }}>
            <span className="h-px w-5" style={{ background: "var(--brand-primary)" }} />
            مسار القراءة
          </span>
          <span className="font-mono tracking-widest text-muted-foreground/70">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 font-display text-lg font-black leading-8 transition-colors group-hover:text-[var(--brand-primary)] sm:text-xl">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-[13px] leading-7 text-muted-foreground">{post.excerpt}</p>}
        <div className="mt-auto pt-5">
          <AuthorAndMeta post={post} />
          <Link
            href={`/blog/${post.slug}`}
            className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-[11px] font-extrabold"
            style={{ color: "var(--brand-primary)" }}
          >
            <span>تابع القراءة</span>
            <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function FeaturedArticle({ post }: { post: BlogPost }) {
  const contrast = "var(--brand-primary-contrast)";

  return (
    <article
      className="group relative isolate overflow-hidden rounded-[2rem]"
      style={{ background: "var(--brand-primary)", color: contrast }}
    >
      <span
        aria-hidden="true"
        className={`${styles.featureGhost} pointer-events-none absolute -left-8 -top-16 -z-10 select-none`}
        style={{ color: colorMix(contrast, 11) }}
      >
        01
      </span>
      <div className="relative grid lg:grid-cols-[1.02fr_.98fr]">
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wide"
            style={{ borderColor: colorMix(contrast, 38) }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            المقال المميز
          </span>
          <h3 className="mt-5 font-display text-3xl font-black leading-[1.4] sm:text-4xl lg:text-[2.6rem]">
            <Link href={`/blog/${post.slug}`} className="transition-opacity hover:opacity-80">
              {post.title}
            </Link>
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-8 sm:text-base" style={{ color: colorMix(contrast, 80) }}>
            {post.excerpt ?? "فكرة جديدة تبدأ من هنا. افتح المقال واكتشف تفاصيله."}
          </p>
          <div className="mt-7">
            <AuthorAndMeta post={post} inverse />
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="mt-7 inline-flex w-fit items-center gap-3 rounded-xl px-6 py-3.5 text-xs font-extrabold transition-transform hover:-translate-y-0.5"
            style={{ background: contrast, color: "var(--brand-primary)" }}
          >
            اقرأ المقال
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <Link
          href={`/blog/${post.slug}`}
          aria-label={`اقرأ المقال المميز: ${post.title}`}
          className={`${styles.featureMedia} relative block overflow-hidden`}
        >
          <ArticleImage post={post} featured />
          {post.category && (
            <span
              className="absolute bottom-5 right-5 rounded-full px-3 py-1.5 text-[10px] font-extrabold"
              style={{ background: "var(--brand-primary)", color: contrast }}
            >
              {post.category}
            </span>
          )}
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
  const articleCountDescription = search ? "نتائج مطابقة" : category ? "مقالات في هذا الموضوع" : "مقالات منشورة";

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground sm:pb-16" dir="rtl">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* ── Hero ─────────────────────────────────────────── */}
        <BlogListingReveal>
          <header className="relative mt-5 overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-soft-lg sm:mt-7">
            <div className="grid lg:grid-cols-[1.03fr_.97fr] lg:items-stretch">
              <div className="relative z-10 flex flex-col justify-center p-6 sm:p-10 lg:p-14">
                <Link
                  href={routes.home}
                  className="mb-7 inline-flex w-fit items-center gap-2 text-[11px] font-bold text-muted-foreground transition-colors hover:text-[var(--brand-primary)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  العودة إلى الرئيسية
                </Link>
                <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-wide text-muted-foreground">
                  <span className="h-px w-8" style={{ background: "var(--brand-primary)" }} />
                  مجلة المعرفة · THE MECHANIST
                </p>
                <h1 className="mt-5 max-w-2xl font-display text-4xl font-black leading-[1.3] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                  كل فكرة عظيمة
                  <span className="mt-1 block" style={{ color: "var(--brand-primary)" }}>
                    تبدأ بفضول.
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">
                  مساحة للقراءة والاكتشاف؛ مقالات وأفكار تعليمية تساعدك على رؤية الموضوع من زاوية جديدة.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="#browse-articles"
                    className="group inline-flex items-center gap-3 rounded-xl px-6 py-3.5 text-xs font-extrabold transition-transform hover:-translate-y-0.5"
                    style={{ background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
                  >
                    ابدأ الاستكشاف
                    <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                  </a>
                  <Link
                    href="#latest-articles"
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3.5 text-xs font-extrabold transition-colors hover:text-[var(--brand-primary)]"
                  >
                    <Compass className="h-4 w-4" />
                    أحدث المقالات
                  </Link>
                </div>
                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border/70 pt-6">
                  {[
                    { value: articleCountLabel, label: articleCountDescription, color: "var(--brand-primary)" },
                    { value: categoryCountLabel, label: "موضوعات للقراءة", color: "var(--brand-secondary)" },
                    { value: "٠١", label: "مسار واحد، أفكار كثيرة", color: "hsl(var(--foreground))" },
                  ].map(({ value, label, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="h-7 w-1 rounded-full" style={{ background: color }} />
                      <div>
                        <p className="font-display text-2xl font-black tabular-nums leading-none">{value}</p>
                        <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CSS-only 3D magazine stack — transform + opacity only */}
              <div className={`${styles.stage} border-t border-border/70 lg:border-l lg:border-t-0`} aria-hidden="true">
                <div className={styles.stageGrid} />
                <div className={styles.ring} />
                <div className={styles.ringInner} />
                <div className={styles.deck}>
                  <div className={`${styles.slot} ${styles.slotBack}`}>
                    <div className={`${styles.card} ${styles.cardBack}`}>
                      <span className={styles.cardEyebrow}>The Mechanist / 02</span>
                      <span className={styles.cardTitle}>مسارات<br />القراءة</span>
                      <span className={styles.cardFoot}><span>اكتشف المزيد</span><ArrowUpLeft className="h-4 w-4" /></span>
                    </div>
                  </div>
                  <div className={`${styles.slot} ${styles.slotMid}`}>
                    <div className={`${styles.card} ${styles.cardMid}`}>
                      <span className={styles.cardEyebrow}>Journal / 01</span>
                      <span className={styles.cardTitle}>فضول<br />بلا حدود</span>
                      <span className={styles.cardFoot}><span>من دفتر المعرفة</span><ArrowUpLeft className="h-4 w-4" /></span>
                    </div>
                  </div>
                  <div className={`${styles.slot} ${styles.slotFront}`}>
                    <div className={`${styles.card} ${styles.cardFront}`}>
                      <div className="flex items-center justify-between">
                        <span className={styles.cardEyebrow}>العدد ٠١</span>
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-primary)" }} />
                          <span className="h-1.5 w-1.5 rounded-full opacity-30" style={{ background: "var(--brand-primary)" }} />
                        </span>
                      </div>
                      <div className={styles.cardThumb}>
                        <BookOpen className="h-9 w-9" strokeWidth={1.25} />
                      </div>
                      <div>
                        <span className="block font-display text-base font-black leading-7">كيف تبدأ فكرة؟</span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">٨ دقائق قراءة · مقال مميز</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className={`${styles.chip} shadow-lg`}>
                  ISSUE<br />01
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-border/70 px-6 py-3 text-[10px] font-bold tracking-wide text-muted-foreground sm:px-10 lg:px-14">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-primary)" }} />
              <span>اقرأ · تأمّل · تعلّم</span>
              <span className="mr-auto hidden sm:inline">مساحة واحدة، أفكار كثيرة</span>
              <span className="font-mono">01 — {articleCountLabel}</span>
            </div>
          </header>
        </BlogListingReveal>

        {/* ── Ticker ───────────────────────────────────────── */}
        <div className={`${styles.ticker} mt-4 overflow-hidden rounded-full border border-border/70 bg-card py-3`} aria-hidden="true">
          <div className={`${styles.tickerTrack} items-center gap-8 whitespace-nowrap`}>
            {Array.from({ length: 2 }).map((_, group) => (
              <div key={group} className="flex items-center gap-8">
                {["مساحة للفضول", "أفكار تستحق القراءة", "تعلّم على مهل", "من الفكرة إلى التطبيق", "مجلة المعرفة"].map((item) => (
                  <span key={`${group}-${item}`} className="flex items-center gap-8 text-[10px] font-extrabold tracking-wide text-muted-foreground">
                    {item}
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-primary)" }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Featured ─────────────────────────────────────── */}
        {featured && (
          <BlogListingReveal delay={0.06} className="mt-9 sm:mt-12">
            <FeaturedArticle post={featured} />
          </BlogListingReveal>
        )}

        {/* ── Filters ──────────────────────────────────────── */}
        <section id="browse-articles" className="scroll-mt-24">
          <BlogListingReveal delay={0.08} className="mt-9 rounded-[1.6rem] border border-border/70 bg-card p-5 shadow-soft-xs sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-end gap-3">
                <span className="hidden h-10 w-1 rounded-full sm:block" style={{ background: "var(--brand-primary)" }} />
                <div>
                  <p className="text-[11px] font-extrabold" style={{ color: "var(--brand-primary)" }}>مسارات القراءة</p>
                  <h2 className="mt-1 font-display text-xl font-black sm:text-2xl">تصفّح حسب الموضوع</h2>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">{categoryCountLabel} موضوعات</span>
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
          <section className="mt-5 rounded-2xl border border-dashed border-border bg-card/60 px-5 py-14 text-center sm:py-16">
            <span
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: colorMix("var(--brand-primary)", 12), color: "var(--brand-primary)" }}
            >
              {search || category ? <BookOpen className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </span>
            <h2 className="mt-4 font-display text-xl font-black">
              {search || category ? "لم نعثر على مقالات مطابقة" : "مكتبة المدونة تستعد لمقالاتها الأولى"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
              {search || category
                ? "جرّب كلمة بحث أخرى أو أزل عوامل التصفية لاستكشاف جميع المقالات."
                : "سيظهر المحتوى المنشور هنا فور إضافته إلى المدونة."}
            </p>
            {(search || category) && (
              <Link
                href="/blog"
                className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold"
                style={{ background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }}
              >
                عرض كل المقالات
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            )}
          </section>
        ) : (
          <div aria-live="polite">
            {gridPosts.length > 0 && (
              <section id="latest-articles" className="scroll-mt-24 pt-9 sm:pt-12" aria-labelledby="all-articles-heading">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-4">
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-[11px] font-extrabold" style={{ color: "var(--brand-primary)" }}>
                        {search || category ? "نتائج البحث" : "من دفتر المعرفة"}
                      </p>
                      <h2 id="all-articles-heading" className="mt-1 font-display text-2xl font-black sm:text-3xl">
                        {search || category ? "مقالات تناسب بحثك" : "أحدث المقالات"}
                      </h2>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" style={{ color: "var(--brand-primary)" }} />
                    {response.meta.total.toLocaleString("ar-EG")} مقال
                  </span>
                </div>
                <div className={`${styles.cardGrid} grid gap-5 sm:grid-cols-2 xl:grid-cols-3`}>
                  {gridPosts.map((post, index) => (
                    <BlogListingReveal key={post.id} delay={Math.min(index * 0.05, 0.25)} className="h-full">
                      <ArticleCard post={post} index={featured ? index + 1 : index} />
                    </BlogListingReveal>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Topic tiles — one solid brand colour per tile ── */}
        {!noResults && categories.length > 0 && (
          <BlogListingReveal className="mt-12 sm:mt-16">
            <section aria-labelledby="topics-heading">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold" style={{ color: "var(--brand-secondary)" }}>ابحث عن اهتمامك</p>
                  <h2 id="topics-heading" className="mt-1 font-display text-xl font-black sm:text-2xl">موضوعات للقراءة</h2>
                </div>
                <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Layers3 className="h-3.5 w-3.5" />
                  {categoryCountLabel} موضوعات
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.slice(0, 6).map((item, index) => {
                  const tone =
                    index % 3 === 0
                      ? { background: "var(--brand-primary)", color: "var(--brand-primary-contrast)" }
                      : index % 3 === 1
                        ? { background: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }
                        : { background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" };
                  const topicIcons = [BookOpen, Layers3, Feather] as const;
                  const Icon = topicIcons[index % topicIcons.length] ?? BookOpen;
                  return (
                    <Link
                      key={item}
                      href={`/blog?category=${encodeURIComponent(item)}`}
                      className="group flex min-h-32 flex-col justify-between rounded-2xl border border-border/60 p-5 transition-transform duration-300 hover:-translate-y-1"
                      style={tone}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                        <span className="font-mono text-[10px] tracking-widest opacity-70">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <div className="mt-6">
                        <h3 className="font-display text-lg font-black leading-7">{item}</h3>
                        <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold opacity-80">
                          تصفّح الموضوع <ArrowUpLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </BlogListingReveal>
        )}

        {/* ── CTA — the other brand colour, on its own ────── */}
        {!noResults && (
          <BlogListingReveal className="mt-12 sm:mt-16">
            <section
              className="relative isolate overflow-hidden rounded-[2rem] p-7 sm:p-10 lg:p-14"
              style={{ background: "var(--brand-secondary)", color: "var(--brand-secondary-contrast)" }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 -top-20 -z-10 h-64 w-64 rounded-full border"
                style={{ borderColor: colorMix("var(--brand-secondary-contrast)", 18) }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-4 -top-8 -z-10 h-36 w-36 rounded-full border"
                style={{ borderColor: colorMix("var(--brand-secondary-contrast)", 18) }}
              />
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-extrabold opacity-70">خطوتك التالية</p>
                  <h2 className="mt-2 font-display text-2xl font-black leading-[1.45] sm:text-3xl">
                    اجعل القراءة بداية رحلتك.
                  </h2>
                  <p className="mt-2 text-sm leading-7 opacity-80">
                    استكشف الدورات التعليمية وانتقل من الفكرة إلى التطبيق، وفق المسار الذي يناسبك.
                  </p>
                </div>
                <Link
                  href={routes.publicCourse}
                  className="inline-flex w-fit items-center gap-3 rounded-xl px-6 py-3.5 text-xs font-extrabold transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--brand-secondary-contrast)", color: "var(--brand-secondary)" }}
                >
                  استكشف الدورات
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </BlogListingReveal>
        )}

        <footer className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 text-sm font-bold">
            <Feather className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
            المعرفة تبدأ بفضول صغير.
          </p>
          <Link href={routes.home} className="inline-flex w-fit items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-[var(--brand-primary)]">
            العودة إلى الرئيسية
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
