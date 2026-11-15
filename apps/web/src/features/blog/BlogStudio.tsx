"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";
import { instructorApi, instructorApiErrorMessage } from "@/features/instructors/api";
import { blogService } from "./services";
import type { BlogPost, BlogPostPayload } from "./types";
import { uploadPendingImagesInContent, type PendingBlogImage } from "./pending-images";
import { BlogRichTextEditor } from "./BlogRichTextEditor";
import {
  blogSanitizeSchema,
  rehypeBlogSafeInlineStyles,
  rehypeBlogTextAlignment,
} from "./rendering";

type Props = { instructor?: boolean; accessToken?: string | null };

const EMPTY_POST: BlogPostPayload = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  category: "",
  tags: [],
  status: "draft",
  published_at: null,
  seo_title: "",
  seo_description: "",
};

const statuses = {
  draft: "مسودة",
  published: "منشور",
  scheduled: "مجدول",
} as const;

const blogPreviewSanitizeSchema = {
  ...blogSanitizeSchema,
  protocols: {
    ...blogSanitizeSchema.protocols,
    src: [...(blogSanitizeSchema.protocols?.src ?? []), "blob"],
  },
};

function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function BlogStudio({ instructor = false, accessToken = null }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<BlogPostPayload>(EMPTY_POST);
  const [tagsText, setTagsText] = useState("");
  const [preview, setPreview] = useState(false);
  const [editorGeneration, setEditorGeneration] = useState(0);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pendingBlogImagesRef = useRef(new Map<string, PendingBlogImage>());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = instructor
        ? await instructorApi.blogList(accessToken!)
        : await blogService.list(search);
      setPosts(response.data);
    } catch (error) {
      toast.error(instructor ? instructorApiErrorMessage(error) : "تعذر تحميل مقالات المدونة.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, instructor, search]);

  useEffect(() => {
    if (!instructor || accessToken) {
      const timer = window.setTimeout(() => void refresh(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [accessToken, instructor, refresh]);

  const update = (key: keyof BlogPostPayload, value: string | null | string[]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const uploadBlogImage = useCallback((file: File) => {
    if (instructor) {
      if (!accessToken) throw new Error("انتهت جلسة الدخول، سجّل الدخول مرة أخرى.");
      return instructorApi.blogUploadImage(accessToken, file);
    }
    return blogService.uploadImage(file);
  }, [accessToken, instructor]);

  const addPendingBlogImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    pendingBlogImagesRef.current.set(url, { file });
    return url;
  }, []);

  const clearPendingBlogImages = useCallback(() => {
    for (const url of pendingBlogImagesRef.current.keys()) URL.revokeObjectURL(url);
    pendingBlogImagesRef.current.clear();
  }, []);

  useEffect(() => clearPendingBlogImages, [clearPendingBlogImages]);

  const startNew = () => {
    clearPendingBlogImages();
    setEditing(null);
    setForm(EMPTY_POST);
    setTagsText("");
    setPreview(false);
    setEditorGeneration((generation) => generation + 1);
  };

  const startEdit = async (post: BlogPost) => {
    try {
      const result = instructor
        ? (await instructorApi.blogShow(accessToken!, post.id)).data
        : await blogService.show(post.id);
      clearPendingBlogImages();
      setEditing(post.id);
      setForm({
        ...EMPTY_POST,
        ...result,
        status: result.status === "draft" ? "draft" : "published",
        published_at: toLocalDateTime(result.published_at),
        cover_image_url: result.cover_image_url ?? "",
        excerpt: result.excerpt ?? "",
        category: result.category ?? "",
        seo_title: result.seo_title ?? "",
        seo_description: result.seo_description ?? "",
        content: result.content ?? "",
      });
      setTagsText(result.tags.join(", "));
      setPreview(false);
      setEditorGeneration((generation) => generation + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(instructor ? instructorApiErrorMessage(error) : "تعذر فتح المقال.");
    }
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("اكتب عنوان المقال ومحتواه أولاً.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      status,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12),
    };
    try {
      payload.content = await uploadPendingImagesInContent(
        payload.content,
        pendingBlogImagesRef.current,
        uploadBlogImage,
      );
      if (instructor) {
        await instructorApi.blogSave(accessToken!, payload, editing ?? undefined);
      } else {
        await blogService.save(payload, editing ?? undefined);
      }
      const isScheduled = status === "published"
        && payload.published_at !== null
        && new Date(payload.published_at).getTime() > Date.now();
      toast.success(
        status === "draft"
          ? "تم حفظ المقال كمسودة."
          : isScheduled
            ? "تم حفظ المقال وجدولته لموعد النشر المحدد."
            : "تم حفظ المقال ونشره.",
      );
      startNew();
      await refresh();
    } catch (error) {
      toast.error(instructor ? instructorApiErrorMessage(error) : "تعذر حفظ المقال.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (post: BlogPost) => {
    if (!window.confirm(`هل تريد حذف «${post.title}»؟`)) return;
    try {
      if (instructor) await instructorApi.blogRemove(accessToken!, post.id);
      else await blogService.remove(post.id);
      toast.success("تم حذف المقال.");
      if (editing === post.id) startNew();
      await refresh();
    } catch (error) {
      toast.error(instructor ? instructorApiErrorMessage(error) : "تعذر حذف المقال.");
    }
  };

  const uploadCover = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("اختر ملف صورة صالحاً.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("يجب ألا يتجاوز حجم صورة الغلاف 10 ميجابايت.");
      return;
    }

    setUploadingCover(true);
    try {
      const url = await uploadBlogImage(file);
      update("cover_image_url", url);
      toast.success("تم رفع الصورة مباشرةً إلى خادم الموقع.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع صورة الغلاف.");
    } finally {
      setUploadingCover(false);
    }
  };

  const draftCount = useMemo(() => posts.filter((post) => post.status === "draft").length, [posts]);

  return (
    <div className="space-y-8" dir="rtl">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-7 text-white shadow-xl md:p-10">
        <div className="absolute -left-12 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-sm font-semibold text-violet-200">استوديو المحتوى · المدونة</p>
            <h1 className="text-3xl font-black md:text-4xl">أفكارك تستحق أن تُقرأ</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              أنشئ مقالات غنية، نظّمها بالتصنيفات والوسوم، جهّز ظهورها في محركات البحث، ثم انشرها فوراً أو احتفظ بها كمسودة.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">{posts.length} مقال · {draftCount} مسودة</span>
            <button type="button" onClick={startNew} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-violet-100">
              + مقال جديد
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{editing ? "تحرير المقال" : "مقال جديد"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">اكتب ونسّق مقالك بصرياً، وأدرج الصور مباشرة داخل النص.</p>
            </div>
            {editing && <button type="button" onClick={startNew} className="text-sm text-primary hover:underline">إلغاء التحرير</button>}
          </div>

          <div className="space-y-5">
            <label className="block space-y-2 text-sm font-semibold">
              عنوان المقال
              <input value={form.title} onChange={(event) => update("title", event.target.value)} maxLength={255} className="w-full rounded-xl border bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="عنوان يجذب القارئ ويعبّر عن الفكرة" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-semibold">
                الرابط المختصر
                <input value={form.slug} onChange={(event) => update("slug", event.target.value)} dir="ltr" className="w-full rounded-xl border bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="يُنشأ تلقائياً من العنوان" />
              </label>
              <label className="block space-y-2 text-sm font-semibold">
                التصنيف
                <input value={form.category} onChange={(event) => update("category", event.target.value)} maxLength={80} className="w-full rounded-xl border bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="مثال: نصائح دراسية" />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-semibold">
              ملخص المقال
              <textarea value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} maxLength={500} rows={2} className="w-full resize-y rounded-xl border bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="نبذة قصيرة تظهر في بطاقات المقالات..." />
            </label>
            <div className="space-y-2">
                <p className="text-sm font-semibold">صورة المقال الخارجية</p>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={(event) => {
                  void uploadCover(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              {form.cover_image_url ? (
                <div className="relative overflow-hidden rounded-xl border">
                  {/* The cover image URL is tenant-managed and may come from any configured CDN. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.cover_image_url} alt="معاينة صورة الغلاف" className="h-52 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => update("cover_image_url", "")}
                    className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/70 px-3 py-2 text-xs font-semibold text-white hover:bg-black"
                  >
                    <X className="h-4 w-4" /> إزالة الصورة
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    void uploadCover(event.dataTransfer.files[0]);
                  }}
                  className="rounded-xl"
                >
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/20 px-4 py-6 text-sm transition hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
                  >
                    {uploadingCover ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImagePlus className="h-6 w-6 text-primary" />}
                    <span>{uploadingCover ? "جارٍ رفع الصورة إلى خادم الموقع..." : "اختر صورة تظهر على بطاقة المقال"}</span>
                    <span className="text-xs font-normal text-muted-foreground">ترفع مباشرةً إلى خادم الموقع · حتى 10 ميجابايت</span>
                  </button>
                </div>
              )}
              {form.cover_image_url && (
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className="text-xs font-semibold text-primary hover:underline">
                  {uploadingCover ? "جارٍ رفع الصورة..." : "تغيير صورة الغلاف"}
                </button>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 p-3">
                <div>
                  <h3 className="text-sm font-bold">محتوى المقال</h3>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">أدرج الصور داخل النص، ثم حرّكها واسحب مقابضها لتغيير حجمها.</p>
                </div>
                <button type="button" onClick={() => setPreview((value) => !value)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">{preview ? "العودة للتحرير" : "معاينة المقال"}</button>
              </div>
              {preview ? (
                <article className="prose prose-slate min-h-72 max-w-none p-5 leading-8 dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[
                      rehypeRaw,
                      rehypeBlogTextAlignment,
                      [rehypeSanitize, blogPreviewSanitizeSchema],
                      rehypeBlogSafeInlineStyles,
                    ]}
                  >
                    {form.content || "ستظهر معاينة المقال هنا..."}
                  </ReactMarkdown>
                </article>
              ) : (
                <BlogRichTextEditor
                  key={editorGeneration}
                  value={form.content}
                  onChange={(content) => update("content", content)}
                  addImage={addPendingBlogImage}
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-semibold">
                الوسوم (افصل بينها بفاصلة)
                <input value={tagsText} onChange={(event) => setTagsText(event.target.value)} className="w-full rounded-xl border bg-background px-4 py-3 font-normal outline-none focus:border-primary" placeholder="تعلم, مهارات, إرشادات" />
              </label>
              <label className="block space-y-2 text-sm font-semibold">
                موعد النشر
                <input type="datetime-local" value={form.published_at ?? ""} onChange={(event) => update("published_at", event.target.value || null)} className="w-full rounded-xl border bg-background px-4 py-3 font-normal outline-none focus:border-primary" />
              </label>
            </div>

            <details className="rounded-xl border p-4">
              <summary className="cursor-pointer font-semibold">إعدادات تحسين محركات البحث (SEO)</summary>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2 text-sm font-semibold">عنوان SEO
                  <input value={form.seo_title} onChange={(event) => update("seo_title", event.target.value)} maxLength={255} className="w-full rounded-lg border bg-background px-3 py-2 font-normal" placeholder="اتركه فارغاً لاستخدام عنوان المقال" />
                </label>
                <label className="block space-y-2 text-sm font-semibold">وصف SEO
                  <textarea value={form.seo_description} onChange={(event) => update("seo_description", event.target.value)} maxLength={320} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 font-normal" placeholder="وصف مختصر يساعد القارئ ومحركات البحث..." />
                </label>
              </div>
            </details>

            <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
              <button type="button" disabled={saving} onClick={() => void save("draft")} className="rounded-xl border px-5 py-3 text-sm font-bold transition hover:bg-muted disabled:opacity-50">{saving ? "جارٍ رفع الصور وحفظ المقال..." : "حفظ كمسودة"}</button>
              <button type="button" disabled={saving} onClick={() => void save("published")} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">{saving ? "جارٍ رفع الصور وحفظ المقال..." : "نشر المقال"}</button>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">مقالاتك</h2>
              <p className="mt-1 text-sm text-muted-foreground">المسودات والمنشورات الخاصة بك.</p>
            </div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void refresh(); }} className="w-36 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="ابحث..." />
          </div>
          {loading ? <p className="py-12 text-center text-sm text-muted-foreground">جارٍ تحميل المقالات...</p> : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد مقالات بعد. ابدأ مقالك الأول الآن.</div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <article key={post.id} className="rounded-xl border p-4 transition hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${post.status === "published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : post.status === "scheduled" ? "bg-sky-500/10 text-sky-700 dark:text-sky-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{statuses[post.status]}</span>
                      <h3 className="mt-2 line-clamp-2 font-bold">{post.title}</h3>
                    </div>
                    <button type="button" onClick={() => void remove(post)} aria-label={`حذف ${post.title}`} className="rounded-lg px-2 py-1 text-sm text-destructive hover:bg-destructive/10">حذف</button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground">{post.excerpt || "لا يوجد ملخص."}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.views} مشاهدة · {post.reading_minutes} د قراءة</span>
                    <button type="button" onClick={() => void startEdit(post)} className="font-semibold text-primary hover:underline">تحرير</button>
                  </div>
                  {post.status === "published" && <Link href={`/blog/${post.slug}`} target="_blank" className="mt-3 inline-block text-xs text-primary hover:underline">عرض المقال ↗</Link>}
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

export function InstructorBlogStudio() {
  const { accessToken } = useInstructorAuth();
  return <BlogStudio instructor accessToken={accessToken} />;
}
