import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import {
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  Home,
  Layers3,
  Quote,
  Sparkles,
  Tag,
  UserRound,
} from "lucide-react";
import { routes } from "@/constants/routes";
import { JsonLd } from "@/components/seo/JsonLd";
import { BlogArticleEngagement } from "@/features/blog/BlogArticleEngagement";
import { BlogArticleHero } from "@/features/blog/BlogArticleHero";
import { BlogCoverImage } from "@/features/blog/BlogCoverImage";
import { BlogListingReveal } from "@/features/blog/BlogListingReveal";
import { extractArticleHeadings, rehypeBlogHeadingIds } from "@/features/blog/article-headings";
import { blogServerService } from "@/features/blog/server-service";
import type { BlogPost } from "@/features/blog/types";
import {
  blogSanitizeSchema,
  rehypeBlogSafeInlineStyles,
  rehypeBlogTextAlignment,
} from "@/features/blog/rendering";
import { buildSeoMetadata, getSiteName } from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";
import styles from "@/features/blog/blog-article.module.css";

export const dynamic = "force-dynamic";
const RELATED_ARTICLE_LIMIT = 48;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, tenant, origin] = await Promise.all([params, getTenantSeoContext(), getRequestOrigin()]);
  const post = await blogServerService.show(slug);
  if (!post) return { title: `المقال غير موجود — ${getSiteName(tenant)}` };

  return buildSeoMetadata(
    {
      title: { absolute: post.seo_title || `${post.title} — ${getSiteName(tenant)}` },
      description: post.seo_description || post.excerpt || `اقرأ ${post.title} على مدونة ${getSiteName(tenant)}.`,
      canonical: canonicalUrl(origin, `/blog/${post.slug}`),
      ogImage: post.cover_image_url ?? undefined,
      ogType: "article",
    },
    tenant,
    origin,
  );
}

function formatDate(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : "غير محدد";
}

function authorInitials(name: string | null): string {
  if (!name?.trim()) return "م";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function RelatedArticleCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-card shadow-[0_16px_44px_-34px_rgba(15,23,42,.5)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-primary)]/40 hover:shadow-[0_30px_60px_-30px_rgba(15,23,42,.45)]">
      <Link href={`/blog/${post.slug}`} aria-label={`اقرأ: ${post.title}`} className="relative block overflow-hidden">
        {post.cover_image_url ? (
          <BlogCoverImage
            src={post.cover_image_url}
            alt={post.title}
            className="aspect-[16/10]"
            imageClassName="transition-transform duration-500 group-hover:scale-[1.045]"
          />
        ) : (
          <div
            className="flex aspect-[16/10] items-center justify-center"
            style={{
              background:
                "linear-gradient(150deg, color-mix(in srgb, var(--brand-primary) 78%, #05080f), color-mix(in srgb, var(--brand-secondary) 40%, #05080f))",
            }}
          >
            <BookOpen className="h-9 w-9 text-white/60" strokeWidth={1} />
          </div>
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {post.category && (
          <span className="absolute right-3 top-3 rounded-full border border-white/25 bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
            {post.category}
          </span>
        )}
        <span className="absolute bottom-3 left-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/95 text-[var(--brand-primary)] opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpLeft className="h-4 w-4" />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span className={`inline-flex items-center gap-1.5 font-bold ${styles.brandText}`}>
            <span className="h-px w-4 bg-current" />
            {post.category ?? "مقال"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3 w-3" />
            {post.reading_minutes} د
          </span>
        </div>
        <h3 className="mt-2.5 line-clamp-2 text-[15px] font-black leading-7 transition-colors group-hover:text-[var(--brand-primary)]">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
            <CalendarDays className="h-3 w-3 text-[var(--brand-primary)]" />
            {formatDate(post.published_at)}
          </span>
          <span className={`inline-flex items-center gap-1 font-extrabold ${styles.brandText}`}>
            اقرأ
            <ArrowUpLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
          </span>
        </div>
      </div>
    </article>
  );
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const [post, listing, tenant, origin] = await Promise.all([
    blogServerService.show(slug),
    blogServerService.page(1, RELATED_ARTICLE_LIMIT),
    getTenantSeoContext(),
    getRequestOrigin(),
  ]);
  if (!post) notFound();

  const siteName = getSiteName(tenant);
  const headings = extractArticleHeadings(post.content ?? "");
  const allPosts = listing?.data ?? [];
  const relatedPosts = allPosts
    .filter((candidate) => candidate.id !== post.id)
    .sort((left, right) => Number(right.category === post.category) - Number(left.category === post.category))
    .slice(0, 3);
  const articleIndex = allPosts.findIndex((candidate) => candidate.id === post.id);
  const previousPost = articleIndex > 0 ? allPosts[articleIndex - 1] : null;
  const nextPost = articleIndex >= 0 ? allPosts[articleIndex + 1] ?? null : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description || post.excerpt || undefined,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    inLanguage: "ar",
    articleSection: post.category ?? undefined,
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
    timeRequired: `PT${post.reading_minutes}M`,
    author: {
      "@type": post.author ? "Person" : "Organization",
      name: post.author ?? siteName,
    },
    publisher: { "@type": "Organization", name: siteName },
    mainEntityOfPage: canonicalUrl(origin, `/blog/${post.slug}`),
  };

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground sm:pb-16" dir="rtl">
      <JsonLd data={articleJsonLd} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <BlogListingReveal>
          <nav
            aria-label="مسار التنقل"
            className="flex flex-wrap items-center gap-1.5 pt-5 text-[11px] font-semibold text-muted-foreground sm:pt-7"
          >
            <Link
              href={routes.home}
              className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-1.5 py-1 transition-colors hover:border-border hover:text-[var(--brand-primary)]"
            >
              <Home className="h-3.5 w-3.5" />
              الرئيسية
            </Link>
            <span aria-hidden="true" className="text-border">/</span>
            <Link href="/blog" className="rounded-full px-1.5 py-1 transition-colors hover:text-[var(--brand-primary)]">
              المدونة
            </Link>
            {post.category && (
              <>
                <span aria-hidden="true" className="text-border">/</span>
                <Link
                  href={`/blog?category=${encodeURIComponent(post.category)}`}
                  className={`rounded-full px-1.5 py-1 transition-colors hover:underline ${styles.brandText}`}
                >
                  {post.category}
                </Link>
              </>
            )}
            <span aria-hidden="true" className="text-border">/</span>
            <span className="max-w-40 truncate text-foreground/70 sm:max-w-sm">{post.title}</span>
          </nav>
        </BlogListingReveal>

        <BlogListingReveal delay={0.04} className="mt-4 sm:mt-6">
          <BlogArticleHero
            title={post.title}
            excerpt={post.excerpt}
            category={post.category}
            coverImageUrl={post.cover_image_url}
            author={post.author}
            publishedLabel={formatDate(post.published_at)}
            readingMinutes={post.reading_minutes}
            sectionCount={headings.length}
            siteName={siteName}
          />
        </BlogListingReveal>

        {/* Article meta bar */}
        <BlogListingReveal delay={0.06} className="mt-3 sm:mt-4">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/60 shadow-sm sm:grid-cols-4">
            {[
              { icon: CalendarDays, label: "تاريخ النشر", value: formatDate(post.published_at) },
              {
                icon: Clock3,
                label: "وقت القراءة",
                value: `${post.reading_minutes} دقائق`,
              },
              {
                icon: Layers3,
                label: "محاور المقال",
                value: `${headings.length.toLocaleString("ar-EG")} محاور`,
              },
              {
                icon: Tag,
                label: "التصنيف",
                value: post.category ?? "عام",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5 bg-card px-3.5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/[.09] text-[var(--brand-primary)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                  <p className="mt-0.5 truncate text-[11px] font-extrabold">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </BlogListingReveal>

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <main className="min-w-0 space-y-6">
            <BlogListingReveal delay={0.08}>
              <article className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-[0_24px_70px_-52px_rgba(15,23,42,.5)] sm:rounded-[2rem]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/25 px-5 py-3.5 sm:px-8">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] font-extrabold">نص المقال</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        اقرأ على مهل — كل فكرة تستحق التأمل
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      <Clock3 className="h-3 w-3 text-[var(--brand-primary)]" />
                      {post.reading_minutes} د
                    </span>
                    {post.category && (
                      <span className={`hidden items-center gap-1.5 rounded-full border border-[var(--brand-primary)]/25 bg-[var(--brand-primary)]/[.06] px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${styles.brandText}`}>
                        <Tag className="h-3 w-3" />
                        {post.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-5 py-7 sm:px-9 sm:py-9 lg:px-11 lg:py-11">
                  {post.content?.trim() ? (
                    <div id="article-content" className={`${styles.articleBody} scroll-mt-24`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[
                          rehypeRaw,
                          rehypeBlogTextAlignment,
                          [rehypeSanitize, blogSanitizeSchema],
                          [rehypeBlogHeadingIds, headings],
                          rehypeBlogSafeInlineStyles,
                        ]}
                        components={{
                          img: ({ src, alt }) => (
                            <figure>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt={alt ?? ""}
                                loading="lazy"
                                className="mx-auto h-auto max-h-[680px] w-full object-contain"
                              />
                              {alt && <figcaption>{alt}</figcaption>}
                            </figure>
                          ),
                          a: ({ href, children }) => {
                            const external = href?.startsWith("http");
                            return (
                              <a
                                href={href}
                                target={external ? "_blank" : undefined}
                                rel={external ? "noopener noreferrer" : undefined}
                              >
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {post.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center">
                      <Quote className="mx-auto h-8 w-8 text-[var(--brand-primary)]/50" />
                      <p className="mt-3 text-sm font-bold">تفاصيل المقال غير متاحة حاليًا.</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        يعمل فريق التحرير على إضافة المحتوى الكامل قريبًا.
                      </p>
                    </div>
                  )}

                  {post.tags.length > 0 && (
                    <div className="mt-10 border-t border-border/70 pt-6">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="inline-flex items-center gap-2 text-xs font-extrabold">
                          <Tag className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                          موضوعات المقال
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {post.tags.length.toLocaleString("ar-EG")} موضوعات
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/blog?search=${encodeURIComponent(tag)}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-[var(--brand-primary)]/35 hover:bg-[var(--brand-primary)]/[.05] hover:text-[var(--brand-primary)]"
                          >
                            <span className="h-1 w-1 rounded-full bg-[var(--brand-primary)]/60" />
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Author sign-off */}
                <div className="relative overflow-hidden border-t border-border/70 bg-muted/25 px-5 py-5 sm:px-9 sm:py-6">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, color-mix(in srgb, var(--brand-secondary) 18%, transparent), transparent 70%)",
                    }}
                  />
                  <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ring-2 ring-white/30"
                        style={{
                          background:
                            "linear-gradient(145deg, color-mix(in srgb, var(--brand-primary) 92%, black), color-mix(in srgb, var(--brand-secondary) 62%, black))",
                        }}
                      >
                        {post.author ? authorInitials(post.author) : <UserRound className="h-5 w-5" />}
                      </span>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground">بقلم</p>
                        <p className="mt-0.5 text-sm font-extrabold">{post.author ?? "فريق التحرير"}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          شكرًا لقراءتك — المعرفة تكبر حين نتشاركها.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/blog"
                      className={`inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-[11px] font-extrabold transition-colors hover:border-[var(--brand-primary)]/40 ${styles.brandText}`}
                    >
                      المزيد من المقالات
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            </BlogListingReveal>

            {/* Prev / next */}
            {(previousPost || nextPost) && (
              <nav aria-label="التنقل بين المقالات" className="grid gap-3 sm:grid-cols-2">
                {previousPost ? (
                  <Link
                    href={`/blog/${previousPost.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:shadow-md"
                  >
                    <span className="absolute inset-y-0 right-0 w-1 bg-[var(--brand-primary)]/25 transition-colors group-hover:bg-[var(--brand-primary)]" />
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <ArrowLeft className="h-3 w-3" />
                      المقال الأحدث
                    </span>
                    <span className="mt-2 block line-clamp-2 text-sm font-extrabold leading-6 transition-colors group-hover:text-[var(--brand-primary)]">
                      {previousPost.title}
                    </span>
                    <span className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold ${styles.brandText}`}>
                      تابع القراءة
                      <ArrowUpLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
                    </span>
                  </Link>
                ) : (
                  <span className="hidden sm:block" />
                )}
                {nextPost && (
                  <Link
                    href={`/blog/${nextPost.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-secondary)]/45 hover:shadow-md"
                  >
                    <span className="absolute inset-y-0 right-0 w-1 bg-[var(--brand-secondary)]/40 transition-colors group-hover:bg-[var(--brand-secondary)]" />
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      المقال السابق
                      <ArrowLeft className="h-3 w-3 rotate-180" />
                    </span>
                    <span className="mt-2 block line-clamp-2 text-sm font-extrabold leading-6 transition-colors group-hover:text-[var(--brand-primary)]">
                      {nextPost.title}
                    </span>
                    <span className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold ${styles.brandText}`}>
                      اقرأ أيضًا
                      <ArrowUpLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
                    </span>
                  </Link>
                )}
              </nav>
            )}

            {/* Related articles */}
            {relatedPosts.length > 0 && (
              <BlogListingReveal>
                <section
                  className="relative isolate overflow-hidden rounded-[1.6rem] border border-border/70 bg-card p-5 shadow-sm sm:rounded-[2rem] sm:p-7"
                  aria-labelledby="related-heading"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-16 -top-24 -z-10 h-56 w-56 rounded-full border border-[var(--brand-primary)]/10"
                  />
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className={`inline-flex items-center gap-2 text-[10px] font-extrabold ${styles.brandText}`}>
                        <Sparkles className="h-3.5 w-3.5" />
                        تابع الاستكشاف
                      </p>
                      <h2 id="related-heading" className="mt-1.5 text-xl font-black sm:text-2xl">
                        قد تهمك أيضًا
                      </h2>
                      <p className="mt-1.5 max-w-xl text-[11px] leading-6 text-muted-foreground sm:text-xs">
                        مقالات مختارة من المكتبة لتكمل رحلة القراءة.
                      </p>
                    </div>
                    <Link
                      href="/blog"
                      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3.5 py-2 text-[11px] font-bold text-muted-foreground transition-colors hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-primary)]"
                    >
                      جميع المقالات
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {relatedPosts.map((relatedPost) => (
                      <RelatedArticleCard key={relatedPost.id} post={relatedPost} />
                    ))}
                  </div>
                </section>
              </BlogListingReveal>
            )}

            {/* CTA */}
            <BlogListingReveal>
              <section
                className="relative isolate overflow-hidden rounded-[1.6rem] p-6 text-white shadow-[0_30px_70px_-45px_rgba(2,6,23,.9)] sm:rounded-[2rem] sm:p-8"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 88%, #05080f), color-mix(in srgb, var(--brand-secondary) 62%, #05080f))",
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
                    backgroundSize: "38px 38px",
                    maskImage: "radial-gradient(ellipse at 80% 20%, black, transparent 70%)",
                  }}
                />
                <span className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full border border-white/15" />
                <span className="pointer-events-none absolute -bottom-16 left-24 h-40 w-40 rounded-full border border-white/10" />
                <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="inline-flex items-center gap-2 text-[10px] font-extrabold tracking-wide text-white/80">
                      <span className="h-px w-6 bg-white/50" />
                      خطوتك التالية
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold leading-snug sm:text-3xl">
                      اجعل القراءة بداية رحلتك.
                    </h2>
                    <p className="mt-2 max-w-2xl text-xs leading-7 text-white/75 sm:text-sm">
                      استكشف الدورات التعليمية وانتقل من الفكرة إلى التطبيق، وفق المسار الذي يناسبك.
                    </p>
                  </div>
                  <Link
                    href={routes.publicCourse}
                    className="inline-flex w-fit items-center gap-2.5 rounded-xl bg-white px-5 py-3 text-xs font-black text-slate-900 shadow-lg transition-transform hover:-translate-y-0.5"
                  >
                    استكشف الدورات
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            </BlogListingReveal>
          </main>

          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <BlogArticleEngagement
              headings={headings}
              title={post.title}
              author={post.author}
              publishedAt={post.published_at}
              updatedAt={post.updated_at}
              readingMinutes={post.reading_minutes}
              category={post.category}
              siteName={siteName}
            />
          </div>
        </div>

        <footer className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-5 text-[11px] text-muted-foreground sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--brand-primary)]" />
            شكراً لقراءتك — المعرفة تكبر حين نتشاركها.
          </span>
          <Link
            href={routes.publicCourse}
            className={`inline-flex items-center gap-2 font-bold transition-colors hover:text-foreground ${styles.brandText}`}
          >
            استكشف الدورات
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
