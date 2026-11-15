import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { ArrowLeft, ArrowUpLeft, BookOpen, CalendarDays, Clock3, Home, Tag } from "lucide-react";
import { routes } from "@/constants/routes";
import { BlogArticleEngagement } from "@/features/blog/BlogArticleEngagement";
import { BlogCoverImage } from "@/features/blog/BlogCoverImage";
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
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/30 hover:shadow-md">
      <Link href={`/blog/${post.slug}`} aria-label={`اقرأ: ${post.title}`} className="relative block">
        {post.cover_image_url ? (
          <BlogCoverImage src={post.cover_image_url} alt={post.title} className="aspect-[16/9]" imageClassName="transition-transform duration-500 group-hover:scale-[1.035]" />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[var(--brand-primary)] to-slate-900">
            <BookOpen className="h-8 w-8 text-white/60" strokeWidth={1} />
          </div>
        )}
        {post.category && (
          <span className="absolute right-3 top-3 rounded-full border border-white/25 bg-slate-950/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
            {post.category}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          {post.category && <span className="font-bold text-[var(--brand-primary)]">{post.category}</span>}
          <span>{formatDate(post.published_at)} · {post.reading_minutes} د</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-6 transition-colors group-hover:text-[var(--brand-primary)]">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <Link href={`/blog/${post.slug}`} className="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-bold text-[var(--brand-primary)]">
          اقرأ المقال
          <ArrowUpLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
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

        <header className="mx-auto max-w-4xl pb-5 pt-7 sm:pb-7 sm:pt-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)]/10 px-3 py-1.5 text-xs font-extrabold text-[var(--brand-primary)]">
              <BookOpen className="h-3.5 w-3.5" />
              من دفتر المعرفة
            </span>
            {post.category && <span className="text-xs font-semibold text-muted-foreground">{post.category}</span>}
          </div>
          <h1 className="mt-4 text-3xl font-black leading-[1.28] tracking-tight sm:text-4xl lg:text-[2.8rem]">{post.title}</h1>
          {post.excerpt && <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">{post.excerpt}</p>}
          <div className="mt-5 grid gap-4 border-y border-border/70 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-xs font-black text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/15">
                {post.author ? post.author.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("") : <span aria-hidden="true">م</span>}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{post.author ?? "كاتب المقال"}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">كاتب المقال</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[var(--brand-primary)]" />{formatDate(post.published_at)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />{post.reading_minutes} دقائق قراءة</span>
            </div>
          </div>
        </header>

        {post.cover_image_url && (
          <figure className="mx-auto max-w-4xl">
            <BlogCoverImage src={post.cover_image_url} alt={post.title} className="aspect-[16/8] max-h-[440px] rounded-xl sm:rounded-2xl" />
          </figure>
        )}

        <div className="mx-auto mt-7 grid max-w-5xl gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
          <BlogArticleEngagement
            headings={headings}
            title={post.title}
            author={post.author}
            publishedAt={post.published_at}
            updatedAt={post.updated_at}
          />
          <article className="min-w-0">
            <div className="prose prose-base max-w-none leading-8 text-foreground/85 dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground prose-headings:scroll-mt-24 prose-h2:mb-4 prose-h2:mt-10 prose-h2:border-b prose-h2:border-border/70 prose-h2:pb-2 prose-h3:mb-3 prose-h3:mt-8 prose-p:my-5 prose-p:leading-8 prose-a:font-semibold prose-a:text-[var(--brand-primary)] prose-blockquote:rounded-l-xl prose-blockquote:border-[var(--brand-primary)] prose-blockquote:bg-muted/50 prose-blockquote:px-5 prose-blockquote:py-1 prose-img:mx-auto prose-img:my-8 prose-img:rounded-xl prose-img:shadow-md prose-figcaption:text-center prose-figcaption:text-xs prose-figcaption:text-muted-foreground prose-li:my-1 prose-li:leading-8 prose-strong:text-foreground sm:prose-lg sm:leading-9 sm:prose-p:leading-9">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                  rehypeRaw,
                  rehypeBlogHeadingIds(headings),
                  rehypeBlogTextAlignment,
                  [rehypeSanitize, blogSanitizeSchema],
                  rehypeBlogSafeInlineStyles,
                ]}
              >
                {post.content ?? ""}
              </ReactMarkdown>
            </div>

            {post.tags.length > 0 && (
              <div className="mt-9 border-t border-border/70 pt-5">
                <p className="mb-3 text-xs font-extrabold">موضوعات المقال</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      <Tag className="h-3 w-3 text-[var(--brand-primary)]" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>

        {(previousPost || nextPost) && (
          <nav aria-label="التنقل بين المقالات" className="mx-auto mt-9 grid max-w-5xl gap-3 border-t border-border/70 pt-5 sm:grid-cols-2">
            {previousPost ? (
              <Link href={`/blog/${previousPost.slug}`} className="group rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-[var(--brand-primary)]/40">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground"><ArrowLeft className="h-3 w-3" />المقال الأحدث</span>
                <span className="mt-2 block line-clamp-2 text-sm font-extrabold group-hover:text-[var(--brand-primary)]">{previousPost.title}</span>
              </Link>
            ) : <span />}
            {nextPost && (
              <Link href={`/blog/${nextPost.slug}`} className="group rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-[var(--brand-primary)]/40 sm:text-left">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">المقال السابق<ArrowLeft className="h-3 w-3" /></span>
                <span className="mt-2 block line-clamp-2 text-sm font-extrabold group-hover:text-[var(--brand-primary)]">{nextPost.title}</span>
              </Link>
            )}
          </nav>
        )}

        <div className="mx-auto mt-6 max-w-5xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-primary)] transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            العودة إلى جميع المقالات
          </Link>
        </div>

        {relatedPosts.length > 0 && (
          <section className="mx-auto mt-10 max-w-6xl border-t border-border/70 pt-7 sm:mt-14 sm:pt-9" aria-labelledby="related-heading">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-[var(--brand-primary)]">واصل رحلتك</p>
                <h2 id="related-heading" className="mt-1.5 text-xl font-black sm:text-2xl">مقالات ذات صلة</h2>
              </div>
              <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-[var(--brand-primary)]">
                كل المقالات
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relatedPost) => <RelatedArticleCard key={relatedPost.id} post={relatedPost} />)}
            </div>
          </section>
        )}

        <footer className="mx-auto mt-8 max-w-6xl border-t border-border/70 pt-5 text-xs text-muted-foreground">
          شكراً لقراءتك — المعرفة تكبر حين نتشاركها.
          <Link href={routes.publicCourse} className="mr-3 font-bold text-[var(--brand-primary)] hover:underline">استكشف الدورات</Link>
        </footer>
      </div>
    </div>
  );
}
