import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { ArrowLeft, ArrowUpLeft, BookOpen, CalendarDays, Clock3, Feather, Home, Quote, Sparkles, Tag } from "lucide-react";
import { routes } from "@/constants/routes";
import { BlogArticleEngagement } from "@/features/blog/BlogArticleEngagement";
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

function RelatedArticleCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-border/70 bg-card shadow-[0_12px_36px_-30px_rgba(15,23,42,.5)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-primary)]/40 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,.4)]">
      <Link href={`/blog/${post.slug}`} aria-label={`اقرأ: ${post.title}`} className="relative block">
        {post.cover_image_url ? (
          <BlogCoverImage src={post.cover_image_url} alt={post.title} className="aspect-[16/9]" imageClassName="transition-transform duration-500 group-hover:scale-[1.035]" />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[var(--brand-primary)] to-slate-900">
            <BookOpen className="h-8 w-8 text-white/60" strokeWidth={1} />
          </div>
        )}
        {post.category && (
          <span className="absolute right-4 top-4 rounded-full border border-white/25 bg-slate-950/65 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur">
            {post.category}
          </span>
        )}
        <span className="absolute bottom-3 left-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/95 text-[var(--brand-primary)] opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpLeft className="h-4 w-4" />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          {post.category && <span className="font-bold text-[var(--brand-primary)]">{post.category}</span>}
          <span>{formatDate(post.published_at)} · {post.reading_minutes} د</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-black leading-7 transition-colors group-hover:text-[var(--brand-primary)]">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground">{post.excerpt}</p>}
        <Link href={`/blog/${post.slug}`} className="mt-auto flex items-center justify-between border-t border-border/70 pt-4 text-xs font-extrabold text-[var(--brand-primary)]">
          <span>اقرأ المقال</span>
          <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
        </Link>
      </div>
    </article>
  );
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const [post, listing] = await Promise.all([
    blogServerService.show(slug),
    blogServerService.page(1, RELATED_ARTICLE_LIMIT),
  ]);
  if (!post) notFound();

  const headings = extractArticleHeadings(post.content ?? "");
  const allPosts = listing?.data ?? [];
  const relatedPosts = allPosts
    .filter((candidate) => candidate.id !== post.id)
    .sort((left, right) => Number(right.category === post.category) - Number(left.category === post.category))
    .slice(0, 3);
  const articleIndex = allPosts.findIndex((candidate) => candidate.id === post.id);
  const previousPost = articleIndex > 0 ? allPosts[articleIndex - 1] : null;
  const nextPost = articleIndex >= 0 ? allPosts[articleIndex + 1] ?? null : null;

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground sm:pb-16" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <BlogListingReveal>
          <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-2 pt-5 text-xs font-semibold text-muted-foreground sm:pt-7">
            <Link href={routes.home} className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--brand-primary)]">
              <Home className="h-3.5 w-3.5" />
              الرئيسية
            </Link>
            <span aria-hidden="true" className="text-border">/</span>
            <Link href="/blog" className="transition-colors hover:text-[var(--brand-primary)]">المدونة</Link>
            {post.category && (
              <>
                <span aria-hidden="true" className="text-border">/</span>
                <span className="text-[var(--brand-primary)]">{post.category}</span>
              </>
            )}
            <span aria-hidden="true" className="text-border">/</span>
            <span className="max-w-40 truncate text-foreground/75 sm:max-w-sm">{post.title}</span>
          </nav>
        </BlogListingReveal>

        <BlogListingReveal delay={0.05} className="mt-5 sm:mt-7">
          <header className="relative isolate overflow-hidden rounded-[1.8rem] bg-[#171c2a] text-white shadow-[0_32px_80px_-48px_rgba(15,23,42,.75)] sm:rounded-[2rem]">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_88%_8%,color-mix(in_srgb,var(--brand-secondary)_32%,transparent),transparent_35%),radial-gradient(ellipse_at_4%_98%,color-mix(in_srgb,var(--brand-primary)_48%,transparent),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-[.07] [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:44px_44px]" />
            <div className="pointer-events-none absolute -left-20 -top-24 -z-10 h-64 w-64 rounded-full border border-white/10 transition-transform duration-1000 group-hover:rotate-12" />
            <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end lg:p-12">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3 py-1.5 text-[11px] font-extrabold text-white/85 backdrop-blur">
                    <BookOpen className="h-3.5 w-3.5 text-[var(--brand-secondary)]" />
                    من دفتر المعرفة
                  </span>
                  {post.category && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-secondary)]/35 bg-[var(--brand-secondary)]/10 px-3 py-1.5 text-[11px] font-bold text-[var(--brand-secondary)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {post.category}
                    </span>
                  )}
                </div>
                <h1 className="mt-5 max-w-4xl text-3xl font-black leading-[1.42] tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.35]">{post.title}</h1>
                {post.excerpt && (
                  <p className="mt-4 max-w-3xl border-r-2 border-[var(--brand-secondary)]/70 pr-4 text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
                    {post.excerpt}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/[.07] p-4 backdrop-blur-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-secondary)]/15 text-[var(--brand-secondary)]">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-xl font-black tabular-nums">{post.reading_minutes}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-white/55">دقائق للقراءة</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.07] p-4 backdrop-blur-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)]/25 text-white">
                    <Feather className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-xl font-black tabular-nums">{headings.length.toLocaleString("ar-EG")}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-white/55">محاور في المقال</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 px-6 py-4 sm:px-9 lg:px-12">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-black text-[var(--brand-secondary)]">
                  {post.author ? post.author.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") : "م"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-white">{post.author ?? "فريق التحرير"}</p>
                  <p className="mt-0.5 text-[10px] text-white/50">كاتب المقال</p>
                </div>
              </div>
              <span className="hidden h-8 w-px bg-white/15 sm:block" />
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/65">
                <CalendarDays className="h-3.5 w-3.5 text-[var(--brand-secondary)]" />
                {formatDate(post.published_at)}
              </span>
              {post.updated_at && post.published_at && post.updated_at !== post.published_at && (
                <span className="text-[11px] text-white/50">
                  آخر تحديث: {formatDate(post.updated_at)}
                </span>
              )}
              <span className="mr-auto hidden items-center gap-2 text-[10px] font-bold tracking-widest text-white/40 sm:inline-flex">
                <span className="h-px w-8 bg-white/25" />
                THE MECHANIST · JOURNAL
              </span>
            </div>
          </header>
        </BlogListingReveal>

        <BlogListingReveal delay={0.1} className="mt-5 sm:mt-7">
          <figure className="group relative isolate overflow-hidden rounded-[1.6rem] border border-border/70 bg-[#171c2a] shadow-[0_28px_70px_-46px_rgba(15,23,42,.65)] sm:rounded-[2rem]">
            {post.cover_image_url ? (
              <BlogCoverImage
                src={post.cover_image_url}
                alt={post.title}
                className="aspect-[16/8] max-h-[560px] min-h-56"
                imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.025]"
              />
            ) : (
              <div className="relative aspect-[16/8] min-h-56 overflow-hidden bg-[radial-gradient(ellipse_at_78%_16%,color-mix(in_srgb,var(--brand-secondary)_55%,transparent),transparent_35%),linear-gradient(135deg,var(--brand-primary),#171c2a_72%)]">
                <span className="absolute -left-12 -top-20 h-64 w-64 rounded-full border border-white/20" />
                <span className="absolute -left-2 -top-10 h-44 w-44 rounded-full border border-white/15" />
                <BookOpen className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-white/50" strokeWidth={1} />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/10" />
            <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 text-white sm:p-8">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/75">
                <Sparkles className="h-4 w-4 text-[var(--brand-secondary)]" />
                مساحة للأفكار التي تستحق التوقف عندها
              </span>
              <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-[10px] font-bold backdrop-blur">
                {post.category ?? "المدونة"}
              </span>
            </figcaption>
          </figure>
        </BlogListingReveal>

        <div className="mx-auto mt-7 grid max-w-6xl gap-6 lg:mt-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          <BlogListingReveal className="order-2 lg:order-1">
            <BlogArticleEngagement
              headings={headings}
              title={post.title}
              author={post.author}
              publishedAt={post.published_at}
              updatedAt={post.updated_at}
            />
          </BlogListingReveal>
          <BlogListingReveal delay={0.08} className="order-1 min-w-0 lg:order-2">
            <article className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-[0_18px_60px_-48px_rgba(15,23,42,.45)] sm:rounded-[2rem]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/25 px-5 py-4 sm:px-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold">وقت القراءة</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">خذ وقتك واستمتع بالتفاصيل</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  {post.reading_minutes} دقائق
                </span>
              </div>
              <div className="px-5 py-7 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
                {post.content?.trim() ? (
                  <div className="prose prose-base max-w-none leading-8 text-foreground/85 dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground prose-headings:scroll-mt-24 prose-h2:mb-5 prose-h2:mt-12 prose-h2:border-b prose-h2:border-border/70 prose-h2:pb-3 prose-h2:first:mt-0 prose-h3:mb-3 prose-h3:mt-9 prose-h3:border-r-2 prose-h3:border-[var(--brand-primary)] prose-h3:pr-3 prose-p:my-6 prose-p:leading-[2.15] prose-a:font-bold prose-a:text-[var(--brand-primary)] prose-a:decoration-[var(--brand-primary)]/40 prose-a:underline-offset-4 hover:prose-a:decoration-[var(--brand-primary)] prose-blockquote:relative prose-blockquote:my-9 prose-blockquote:rounded-2xl prose-blockquote:border-r-4 prose-blockquote:border-[var(--brand-primary)] prose-blockquote:bg-[var(--brand-primary)]/[.06] prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:text-foreground prose-blockquote:before:hidden prose-img:mx-auto prose-img:my-9 prose-img:rounded-2xl prose-img:shadow-[0_18px_45px_-24px_rgba(15,23,42,.5)] prose-figcaption:mt-3 prose-figcaption:text-center prose-figcaption:text-xs prose-figcaption:text-muted-foreground prose-li:my-2 prose-li:leading-8 prose-li:marker:text-[var(--brand-primary)] prose-strong:font-black prose-strong:text-foreground prose-hr:my-10 prose-hr:border-border/70 sm:prose-lg sm:leading-9 sm:prose-p:leading-[2.2]">
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
                        blockquote: ({ children }) => (
                          <blockquote className="not-prose my-9 flex gap-4 rounded-2xl border-r-4 border-[var(--brand-primary)] bg-[var(--brand-primary)]/[.06] px-5 py-5 sm:px-7">
                            <Quote className="mt-1 h-5 w-5 shrink-0 text-[var(--brand-primary)]" />
                            <div className="min-w-0 text-sm font-semibold leading-8 text-foreground/85 sm:text-base">{children}</div>
                          </blockquote>
                        ),
                        img: ({ src, alt }) => (
                          <figure className="my-9 overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={alt ?? ""} loading="lazy" className="mx-auto h-auto max-h-[680px] w-full object-contain" />
                            {alt && <figcaption className="border-t border-border/60 px-4 py-3 text-center text-xs text-muted-foreground">{alt}</figcaption>}
                          </figure>
                        ),
                      }}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center">
                    <BookOpen className="mx-auto h-8 w-8 text-[var(--brand-primary)]/60" />
                    <p className="mt-3 text-sm font-bold">تفاصيل المقال غير متاحة حاليًا.</p>
                  </div>
                )}

                {post.tags.length > 0 && (
                  <div className="mt-10 border-t border-border/70 pt-6 sm:mt-12">
                    <p className="mb-3 text-xs font-extrabold">موضوعات المقال</p>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[var(--brand-primary)]/35 hover:text-[var(--brand-primary)]">
                          <Tag className="h-3 w-3 text-[var(--brand-primary)]" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          </BlogListingReveal>
        </div>

        {(previousPost || nextPost) && (
          <nav aria-label="التنقل بين المقالات" className="mx-auto mt-8 grid max-w-6xl gap-3 sm:mt-10 sm:grid-cols-2">
            {previousPost ? (
              <Link href={`/blog/${previousPost.slug}`} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:shadow-md">
                <span className="absolute inset-y-0 right-0 w-1 bg-[var(--brand-primary)]/25 transition-colors group-hover:bg-[var(--brand-primary)]" />
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground"><ArrowLeft className="h-3 w-3" />المقال الأحدث</span>
                <span className="mt-2 block line-clamp-2 text-sm font-extrabold leading-6 transition-colors group-hover:text-[var(--brand-primary)]">{previousPost.title}</span>
              </Link>
            ) : <span />}
            {nextPost && (
              <Link href={`/blog/${nextPost.slug}`} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:shadow-md sm:text-left">
                <span className="absolute inset-y-0 right-0 w-1 bg-[var(--brand-secondary)]/50 transition-colors group-hover:bg-[var(--brand-secondary)]" />
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">المقال السابق<ArrowLeft className="h-3 w-3" /></span>
                <span className="mt-2 block line-clamp-2 text-sm font-extrabold leading-6 transition-colors group-hover:text-[var(--brand-primary)]">{nextPost.title}</span>
              </Link>
            )}
          </nav>
        )}

        <div className="mx-auto mt-6 max-w-5xl">
          <Link href="/blog" className="group inline-flex items-center gap-3 rounded-xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/[.06] px-5 py-3 text-sm font-extrabold text-[var(--brand-primary)] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary)]/10">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            اكتشف بقية المقالات
          </Link>
        </div>

        {relatedPosts.length > 0 && (
          <BlogListingReveal className="mx-auto mt-12 max-w-6xl sm:mt-16">
            <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm sm:rounded-[2rem] sm:p-8 lg:p-10" aria-labelledby="related-heading">
              <div className="pointer-events-none absolute -left-14 -top-20 -z-10 h-60 w-60 rounded-full border border-[var(--brand-primary)]/10" />
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-[11px] font-extrabold text-[var(--brand-primary)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    تابع الاستكشاف
                  </p>
                  <h2 id="related-heading" className="mt-2 text-2xl font-black sm:text-3xl">قد تهمك أيضًا</h2>
                  <p className="mt-2 max-w-xl text-xs leading-6 text-muted-foreground sm:text-sm">
                    مقالات أخرى من المكتبة، اختيرت من المحتوى المنشور لتكمل رحلة القراءة.
                  </p>
                </div>
                <Link href="/blog" className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-primary)]">
                  جميع المقالات
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <BlogListingReveal key={relatedPost.id} className="h-full">
                    <RelatedArticleCard post={relatedPost} />
                  </BlogListingReveal>
                ))}
              </div>
            </section>
          </BlogListingReveal>
        )}

        <footer className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-[var(--brand-primary)]" />شكراً لقراءتك — المعرفة تكبر حين نتشاركها.</span>
          <Link href={routes.publicCourse} className="inline-flex items-center gap-2 font-bold text-[var(--brand-primary)] transition-colors hover:text-foreground">
            استكشف الدورات
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
