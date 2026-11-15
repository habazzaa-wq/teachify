import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpLeft, BookOpen, CalendarDays, Clock3, Sparkles, UserRound } from "lucide-react";
import { routes } from "@/constants/routes";
import { BlogCoverImage } from "@/features/blog/BlogCoverImage";
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
  const imageClassName = `relative aspect-[16/9] overflow-hidden bg-[var(--brand-primary)] ${featured ? "h-full min-h-56" : ""}`;
  if (post.cover_image_url) {
    return (
      <BlogCoverImage
        src={post.cover_image_url}
        alt={post.title}
        className={imageClassName}
        imageClassName="transition-transform duration-500 group-hover:scale-[1.035]"
      />
    );
  }

  return (
    <div className={imageClassName}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,var(--brand-secondary),transparent_38%),linear-gradient(145deg,var(--brand-primary),#171c36)]">
        <div className="absolute -left-8 -top-12 h-36 w-36 rounded-full border border-white/15" />
        <div className="absolute bottom-3 right-5 h-32 w-32 rounded-full border border-white/15" />
        <BookOpen className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/60" strokeWidth={1} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
    </div>
  );
}

function AuthorAndMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/70 pt-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[10px] font-black text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/10">
          {post.author ? authorInitials(post.author) : <UserRound className="h-4 w-4" />}
        </span>
        <span className="max-w-32 truncate text-xs font-bold">{post.author ?? "كاتب المقال"}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-[var(--brand-primary)]" />{formatDate(post.published_at)}</span>
        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />{post.reading_minutes} د</span>
      </div>
    </div>
  );
}

function ArticleCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--brand-primary)]/35 hover:shadow-lg">
      <Link href={`/blog/${post.slug}`} aria-label={`اقرأ: ${post.title}`} className="relative overflow-hidden">
        <ArticleImage post={post} />
        {post.category && (
          <span className="absolute right-3 top-3 rounded-full border border-white/25 bg-slate-950/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
            {post.category}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="font-mono font-semibold tracking-widest text-muted-foreground/60">{String(index + 1).padStart(2, "0")}</span>
          <span className="text-muted-foreground">{formatDate(post.published_at)}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-lg font-extrabold leading-7 transition-colors group-hover:text-[var(--brand-primary)]">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>}
        <div className="mt-auto pt-4">
          <AuthorAndMeta post={post} />
          <Link href={`/blog/${post.slug}`} className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-[var(--brand-primary)]">
            اقرأ المزيد
            <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function FeaturedArticle({ post }: { post: BlogPost }) {
  return (
    <article className="group grid overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm md:grid-cols-[1.05fr_.95fr]">
      <Link href={`/blog/${post.slug}`} aria-label={`اقرأ المقال المميز: ${post.title}`} className="relative overflow-hidden">
        <ArticleImage post={post} featured />
        {post.category && (
          <span className="absolute right-3 top-3 rounded-full border border-white/25 bg-slate-950/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
            {post.category}
          </span>
        )}
      </Link>
      <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
        <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--brand-primary)]">
          <Sparkles className="h-4 w-4" />
          اقتراح للقراءة
        </p>
        <h2 className="mt-3 text-xl font-black leading-8 sm:text-2xl">
          <Link href={`/blog/${post.slug}`} className="transition-colors group-hover:text-[var(--brand-primary)]">{post.title}</Link>
        </h2>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>}
        <div className="mt-5">
          <AuthorAndMeta post={post} />
        </div>
        <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-xs font-extrabold text-[var(--brand-primary-contrast)] transition-opacity hover:opacity-90">
          اقرأ المقال
          <ArrowLeft className="h-3.5 w-3.5" />
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

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground sm:pb-16" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="relative grid gap-6 overflow-hidden border-b border-border/70 py-7 sm:py-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="pointer-events-none absolute -left-8 -top-16 h-48 w-48 rounded-full border border-[var(--brand-primary)]/10" />
          <div className="relative">
            <Link href={routes.home} className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-[var(--brand-primary)]">
              <ArrowLeft className="h-3.5 w-3.5" />
              الرئيسية
            </Link>
            <p className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-[var(--brand-primary)]">
              <span className="h-px w-7 bg-current" />
              دفتر المعرفة
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              أفكار تستحق <span className="text-[var(--brand-primary)]">القراءة.</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              مقالات مختارة ورؤى عملية تلهمك للتعلّم، والتفكير، وخوض الخطوة التالية.
            </p>
          </div>
          <div className="relative flex w-fit items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-black leading-none">{response.meta.total}</p>
              <p className="mt-1 text-xs text-muted-foreground">مقالاً منشوراً</p>
            </div>
          </div>
        </header>

        <section className="py-5 sm:py-6" aria-label="البحث والتصفية">
          <BlogListingControls
            categories={categories}
            activeCategory={category}
            search={search}
            currentPage={response.meta.current_page}
            lastPage={response.meta.last_page}
            total={response.meta.total}
          />
        </section>

        {noResults ? (
          <section className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-14 text-center sm:py-16">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
              {search || category ? <BookOpen className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </span>
            <h2 className="mt-4 text-xl font-black">
              {search || category ? "لم نعثر على مقالات مطابقة" : "مكتبة المدونة تستعد لمقالاتها الأولى"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
              {search || category
                ? "جرّب كلمة بحث أخرى أو أزل عوامل التصفية لاستكشاف جميع المقالات."
                : "سيظهر المحتوى المنشور هنا فور إضافته إلى المدونة."}
            </p>
            {(search || category) && (
              <Link href="/blog" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-xs font-bold text-[var(--brand-primary-contrast)]">
                عرض كل المقالات
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            )}
          </section>
        ) : (
          <div aria-live="polite">
            {featured && (
              <section className="border-b border-border/70 pb-7 sm:pb-8" aria-labelledby="featured-heading">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold text-[var(--brand-primary)]">قصة تستحق وقتك</p>
                    <h2 id="featured-heading" className="mt-1 text-xl font-black">مقال مميز</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">01 <span className="text-border">/</span> مميز</span>
                </div>
                <FeaturedArticle post={featured} />
              </section>
            )}

            {gridPosts.length > 0 && (
              <section className="pt-7 sm:pt-8" aria-labelledby="all-articles-heading">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold text-[var(--brand-primary)]">{search || category ? "نتائجك" : "اقرأ واكتشف"}</p>
                    <h2 id="all-articles-heading" className="mt-1 text-xl font-black sm:text-2xl">
                      {search || category ? "المقالات المطابقة" : "أحدث المقالات"}
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{response.meta.total} مقال</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post, index) => <ArticleCard key={post.id} post={post} index={index} />)}
                </div>
              </section>
            )}
          </div>
        )}

        <footer className="mt-9 flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold">المعرفة تبدأ بفضول صغير.</p>
          <Link href={routes.publicCourse} className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--brand-primary)] hover:underline">
            اكتشف الدورات على المنصة
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
