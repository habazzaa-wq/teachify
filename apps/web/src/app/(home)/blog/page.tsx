import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUpLeft, BookOpen, CalendarDays, Clock3, Feather, Layers3, Sparkles, UserRound } from "lucide-react";
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
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-card shadow-[0_8px_30px_-24px_rgba(15,23,42,.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-primary)]/40 hover:shadow-[0_24px_50px_-28px_rgba(15,23,42,.35)]">
      <Link href={`/blog/${post.slug}`} aria-label={`اقرأ: ${post.title}`} className="relative overflow-hidden">
        <ArticleImage post={post} />
        {post.category && (
          <span className="absolute right-4 top-4 rounded-full border border-white/25 bg-slate-950/65 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur">
            {post.category}
          </span>
        )}
        <span className="absolute bottom-4 left-4 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white/95 text-[var(--brand-primary)] opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpLeft className="h-4 w-4" />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-2 text-[var(--brand-primary)]">
            <span className="h-px w-5 bg-current" />
            {post.category ?? "مقال"}
          </span>
          <span className="font-mono tracking-widest text-muted-foreground/65">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-black leading-8 transition-colors group-hover:text-[var(--brand-primary)] sm:text-xl">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-7 text-muted-foreground">{post.excerpt}</p>}
        <div className="mt-auto pt-5">
          <AuthorAndMeta post={post} />
          <Link href={`/blog/${post.slug}`} className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-xs font-extrabold text-[var(--brand-primary)]">
            <span>تابع القراءة</span>
            <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function FeaturedArticle({ post }: { post: BlogPost }) {
  return (
    <article className="group grid overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-[0_24px_70px_-48px_rgba(15,23,42,.45)] md:grid-cols-[1.05fr_.95fr]">
      <Link href={`/blog/${post.slug}`} aria-label={`اقرأ المقال المميز: ${post.title}`} className="relative order-1 overflow-hidden md:order-2">
        <ArticleImage post={post} featured />
        {post.category && (
          <span className="absolute right-4 top-4 rounded-full border border-white/25 bg-slate-950/65 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur">
            {post.category}
          </span>
        )}
      </Link>
      <div className="relative order-2 flex flex-col justify-center overflow-hidden p-6 sm:p-8 lg:p-10 md:order-1">
        <span className="pointer-events-none absolute -left-12 -top-14 h-44 w-44 rounded-full border border-[var(--brand-primary)]/10" />
        <span className="pointer-events-none absolute -left-5 -top-7 h-28 w-28 rounded-full border border-[var(--brand-primary)]/10" />
        <p className="relative inline-flex items-center gap-2 text-xs font-extrabold text-[var(--brand-primary)]">
          <Sparkles className="h-4 w-4" />
          نافذة على المعرفة
          <span className="h-px w-8 bg-current/50" />
          <span className="font-mono text-[10px] tracking-widest opacity-70">01</span>
        </p>
        <h2 className="relative mt-4 text-2xl font-black leading-[1.45] tracking-tight sm:text-3xl">
          <Link href={`/blog/${post.slug}`} className="transition-colors group-hover:text-[var(--brand-primary)]">{post.title}</Link>
        </h2>
        {post.excerpt
          ? <p className="relative mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground sm:text-base">{post.excerpt}</p>
          : <p className="relative mt-3 text-sm leading-7 text-muted-foreground">فكرة جديدة تبدأ من هنا. افتح المقال واكتشف تفاصيله.</p>}
        <div className="relative mt-6">
          <AuthorAndMeta post={post} />
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-4">
          <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-3 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-xs font-extrabold text-[var(--brand-primary-contrast)] shadow-lg shadow-[var(--brand-primary)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl">
            اقرأ المقال
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Feather className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            {post.reading_minutes} دقائق من القراءة
          </span>
        </div>
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <BlogListingReveal>
          <header className="relative isolate mt-5 overflow-hidden rounded-[1.75rem] bg-[#171c2a] text-white shadow-[0_32px_80px_-48px_rgba(15,23,42,.7)] sm:mt-7">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_12%,color-mix(in_srgb,var(--brand-secondary)_30%,transparent),transparent_35%),radial-gradient(ellipse_at_8%_95%,color-mix(in_srgb,var(--brand-primary)_45%,transparent),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10" />
            <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_290px] lg:items-end lg:p-12">
              <div>
                <Link href={routes.home} className="mb-7 inline-flex items-center gap-2 text-xs font-bold text-white/65 transition-colors hover:text-white">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  الرئيسية
                </Link>
                <p className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-white/75">
                  <span className="h-px w-8 bg-[var(--brand-secondary)]" />
                  مجلة المعرفة · THE MECHANIST
                </p>
                <h1 className="mt-4 max-w-3xl text-3xl font-black leading-[1.35] tracking-tight sm:text-4xl lg:text-5xl">
                  كل فكرة عظيمة
                  <span className="mt-1 block text-[var(--brand-secondary)]">تبدأ بفضول.</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
                  مساحة للقراءة والاكتشاف؛ مقالات وأفكار تعليمية تساعدك على رؤية الموضوع من زاوية جديدة.
                </p>
                <a href="#browse-articles" className="group mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-white transition-colors hover:text-[var(--brand-secondary)]">
                  ابدأ الاستكشاف
                  <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                </a>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[.07] p-5 backdrop-blur-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-white/75">
                    <BookOpen className="h-4 w-4 text-[var(--brand-secondary)]" />
                    مكتبة المدونة
                  </span>
                  <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold text-white/55">مفتوحة للقراءة</span>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-black/15 p-4">
                    <p className="text-3xl font-black tabular-nums">{articleCountLabel}</p>
                    <p className="mt-1 text-[11px] font-semibold text-white/60">{articleCountDescription}</p>
                  </div>
                  <div className="rounded-xl bg-black/15 p-4">
                    <p className="text-3xl font-black tabular-nums">{categoryCountLabel}</p>
                    <p className="mt-1 text-[11px] font-semibold text-white/60">موضوعات للقراءة</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/55">
                  <span>تعلّم على مهل</span>
                  <span className="h-px flex-1 mx-3 bg-white/15" />
                  <span>اكتشف باستمرار</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-white/10 px-6 py-3 text-[10px] font-bold tracking-wide text-white/55 sm:px-9 lg:px-12">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-secondary)]" />
              <span>اقرأ · تأمّل · تعلّم</span>
              <span className="mr-auto hidden sm:inline">مساحة واحدة، أفكار كثيرة</span>
              <span className="font-mono">01 — {articleCountLabel}</span>
            </div>
          </header>
        </BlogListingReveal>

        <BlogListingReveal delay={0.06} className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { icon: BookOpen, label: "المقالات", value: articleCountLabel, detail: articleCountDescription },
            { icon: Layers3, label: "الموضوعات", value: categoryCountLabel, detail: "تصفّح حسب اهتماماتك" },
            { icon: Feather, label: "أسلوب القراءة", value: "على مهل", detail: "محتوى موجز وواضح" },
          ].map(({ icon: Icon, label, value, detail }) => (
            <div key={label} className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/30 hover:shadow-md sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                <p className="mt-0.5 truncate text-lg font-black">{value}</p>
              </div>
              <span className="hidden text-[10px] text-muted-foreground/70 xl:block">{detail}</span>
            </div>
          ))}
        </BlogListingReveal>

        {featured && (
          <BlogListingReveal delay={0.1} className="mt-9 sm:mt-12">
            <section aria-labelledby="featured-heading">
              <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
                <div>
                  <p className="flex items-center gap-2 text-[11px] font-extrabold text-[var(--brand-primary)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    ابدأ من هنا
                  </p>
                  <h2 id="featured-heading" className="mt-1.5 text-xl font-black sm:text-2xl">مقال يستحق انتباهك</h2>
                </div>
                <span className="hidden items-center gap-2 text-[11px] font-semibold text-muted-foreground sm:inline-flex">
                  <span className="h-px w-8 bg-border" />
                  واجهة القراءة
                </span>
              </div>
              <FeaturedArticle post={featured} />
            </section>
          </BlogListingReveal>
        )}

        <section id="browse-articles" className="scroll-mt-24">
        <BlogListingReveal delay={0.08} className="mt-8 rounded-[1.4rem] border border-border/70 bg-card p-4 shadow-sm sm:mt-10 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold text-[var(--brand-primary)]">مسارات القراءة</p>
              <h2 className="mt-1 text-base font-black sm:text-lg">تصفّح حسب الموضوع</h2>
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
            {gridPosts.length > 0 && (
              <section id="latest-articles" className="scroll-mt-24 pt-8 sm:pt-10" aria-labelledby="all-articles-heading">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-4 sm:mb-6">
                  <div className="flex items-end gap-3">
                    <span className="hidden h-10 w-1 rounded-full bg-[var(--brand-primary)] sm:block" />
                    <div>
                      <p className="text-[11px] font-extrabold text-[var(--brand-primary)]">{search || category ? "نتائج البحث" : "من دفتر المعرفة"}</p>
                      <h2 id="all-articles-heading" className="mt-1 text-xl font-black sm:text-2xl">
                        {search || category ? "مقالات تناسب بحثك" : "أحدث المقالات"}
                      </h2>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    {response.meta.total.toLocaleString("ar-EG")} مقال
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post, index) => (
                    <BlogListingReveal key={post.id} delay={Math.min(index * 0.06, 0.24)} className="h-full">
                      <ArticleCard post={post} index={featured ? index + 1 : index} />
                    </BlogListingReveal>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!noResults && (
          <BlogListingReveal className="mt-10 sm:mt-14">
            <section className="relative isolate overflow-hidden rounded-[1.5rem] border border-[var(--brand-primary)]/15 bg-[var(--brand-primary)]/[.06] p-6 sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute -left-12 -top-16 -z-10 h-52 w-52 rounded-full border border-[var(--brand-primary)]/10" />
              <div className="pointer-events-none absolute -left-3 -top-7 -z-10 h-32 w-32 rounded-full border border-[var(--brand-primary)]/10" />
              <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-[11px] font-extrabold text-[var(--brand-primary)]">خطوتك التالية</p>
                  <h2 className="mt-2 text-xl font-black sm:text-2xl">اجعل القراءة بداية رحلتك.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    استكشف الدورات التعليمية وانتقل من الفكرة إلى التطبيق، وفق المسار الذي يناسبك.
                  </p>
                </div>
                <Link href={routes.publicCourse} className="inline-flex w-fit items-center gap-3 rounded-xl border border-[var(--brand-primary)]/20 bg-card px-5 py-3 text-xs font-extrabold text-[var(--brand-primary)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  استكشف الدورات
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </BlogListingReveal>
        )}

        <footer className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 text-sm font-bold"><BookOpen className="h-4 w-4 text-[var(--brand-primary)]" />المعرفة تبدأ بفضول صغير.</p>
          <Link href={routes.home} className="inline-flex w-fit items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-[var(--brand-primary)]">
            العودة إلى الرئيسية
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
