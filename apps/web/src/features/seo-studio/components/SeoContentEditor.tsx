"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ExternalLink,
  Link2,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import {
  AppButton,
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
  AppErrorState,
  AppInput,
  AppLoadingState,
  AppProgress,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  AppSwitch,
  AppTabs,
  AppTabsContent,
  AppTabsList,
  AppTabsTrigger,
  AppTextarea,
  Label,
  PermissionGuard,
} from "@/components/ui";
import { routes } from "@/constants/routes";
import { useCan } from "@/hooks/useCan";
import { useTenantStore } from "@/stores/tenant.store";
import {
  SEO_CONTENT_TYPE_OPTIONS,
  SEO_KEYWORD_TYPE_OPTIONS,
  SEO_SEARCH_INTENT_OPTIONS,
  SEO_STATUS_OPTIONS,
  SEO_STRUCTURED_DATA_OPTIONS,
} from "../constants";
import {
  useCreateSeoContent,
  usePublishSeoContent,
  useSeoContent,
  useSeoLinkSearch,
  useUnpublishSeoContent,
  useUpdateSeoContent,
} from "../hooks";
import { SeoHealthBadge, SeoStatusBadge } from "./SeoBadges";
import { SeoImageField } from "./SeoImageField";
import type {
  SeoContentStatus,
  SeoContentType,
  SeoImageData,
  SeoKeywordType,
  SeoLinkSearchResult,
  SeoSearchIntent,
  SeoStructuredDataType,
} from "../types";

// ── Editor form state ────────────────────────────────────────────────────────

interface EditorFaq {
  tempId: number;
  id?: number;
  question: string;
  answer: string;
  isPublished: boolean;
}

interface EditorKeyword {
  tempId: number;
  id?: number;
  keyword: string;
  keywordType: SeoKeywordType;
  searchIntent: SeoSearchIntent | "";
  notes: string;
}

interface EditorLink {
  tempId: number;
  id?: number;
  targetSeoContentId: number | null;
  targetUrl: string;
  anchorText: string;
}

interface EditorState {
  contentType: SeoContentType;
  title: string;
  slug: string;
  status: SeoContentStatus;
  excerpt: string;
  content: string;
  indexable: boolean;
  inSitemap: boolean;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  secondaryKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  structuredDataType: SeoStructuredDataType;
  featuredImageAssetId: number | null;
  ogImageAssetId: number | null;
  twitterImageAssetId: number | null;
  faqs: EditorFaq[];
  keywords: EditorKeyword[];
  links: EditorLink[];
}

interface EditorImages {
  featuredImage: SeoImageData | null;
  ogImage: SeoImageData | null;
  twitterImage: SeoImageData | null;
}

const EMPTY_STATE: EditorState = {
  contentType: "article",
  title: "",
  slug: "",
  status: "draft",
  excerpt: "",
  content: "",
  indexable: true,
  inSitemap: true,
  seoTitle: "",
  seoDescription: "",
  focusKeyword: "",
  secondaryKeywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  twitterTitle: "",
  twitterDescription: "",
  structuredDataType: "none",
  featuredImageAssetId: null,
  ogImageAssetId: null,
  twitterImageAssetId: null,
  faqs: [],
  keywords: [],
  links: [],
};

const EMPTY_IMAGES: EditorImages = {
  featuredImage: null,
  ogImage: null,
  twitterImage: null,
};

type ImageField = "featuredImageAssetId" | "ogImageAssetId" | "twitterImageAssetId";
type ImageSlot = keyof EditorImages;

// ── Reusable labeled field ──────────────────────────────────────────────────

function Field({
  label,
  hint,
  counter,
  children,
}: {
  label: string;
  hint?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        {counter ? (
          <span
            className={`text-xs ${
              counter.startsWith("danger") ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {counter.replace("danger", "")}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function fieldCounter(value: string, max: number): string | undefined {
  if (value.length > max) {
    return `danger${value.length}/${max}`;
  }
  return `${value.length}/${max}`;
}

// ── Main editor ──────────────────────────────────────────────────────────────

function SeoContentEditor({ id, initialType }: { id?: string; initialType?: SeoContentType }) {
  const t = useTranslations("seo");
  const router = useRouter();
  const isEdit = Boolean(id);
  const canPublish = useCan("seo.publish");
  const domain = useTenantStore((state) => state.domain);
  const origin = useMemo(
    () => (domain ? `https://${domain}` : ""),
    [domain],
  );

  const tempIdRef = useRef(0);
  const nextTempId = useCallback(() => {
    tempIdRef.current += 1;
    return tempIdRef.current;
  }, []);

  const [state, setState] = useState<EditorState>(() =>
    initialType ? { ...EMPTY_STATE, contentType: initialType } : EMPTY_STATE,
  );
  const [images, setImages] = useState<EditorImages>(EMPTY_IMAGES);
  const [activeTab, setActiveTab] = useState("content");

  const { data: content, isLoading, isError, refetch } = useSeoContent(id ?? null);

  const update = useCallback((key: keyof EditorState, value: unknown) => {
    setState((prev) => ({ ...prev, [key]: value }) as EditorState);
  }, []);

  const [loadedId, setLoadedId] = useState<string | null>(null);

  if (content && content.id !== loadedId) {
    setLoadedId(content.id);
    setState({
      contentType: content.contentType,
      title: content.title,
      slug: content.slug,
      status: content.status,
      excerpt: content.excerpt ?? "",
      content: content.content ?? "",
      indexable: content.indexable,
      inSitemap: content.inSitemap,
      seoTitle: content.seo.title ?? "",
      seoDescription: content.seo.description ?? "",
      focusKeyword: content.seo.focusKeyword ?? "",
      secondaryKeywords: (content.seo.secondaryKeywords ?? []).join(", "),
      canonicalUrl: content.seo.canonicalUrl ?? "",
      ogTitle: content.seo.ogTitle ?? "",
      ogDescription: content.seo.ogDescription ?? "",
      twitterTitle: content.seo.twitterTitle ?? "",
      twitterDescription: content.seo.twitterDescription ?? "",
      structuredDataType:
        (content.seo.structuredDataType as SeoStructuredDataType) ?? "none",
      featuredImageAssetId: content.images.featuredImage
        ? Number(content.images.featuredImage.id)
        : null,
      ogImageAssetId: content.images.ogImage
        ? Number(content.images.ogImage.id)
        : null,
      twitterImageAssetId: content.images.twitterImage
        ? Number(content.images.twitterImage.id)
        : null,
      faqs: (content.faqs ?? []).map((f, index) => ({
        tempId: -index - 1,
        id: f.id ? Number(f.id) : undefined,
        question: f.question,
        answer: f.answer,
        isPublished: f.isPublished ?? true,
      })),
      keywords: (content.keywords ?? []).map((k, index) => ({
        tempId: -index - 1,
        id: k.id ? Number(k.id) : undefined,
        keyword: k.keyword,
        keywordType: k.keywordType ?? "related",
        searchIntent: k.searchIntent ?? "",
        notes: k.notes ?? "",
      })),
      links: (content.links ?? []).map((l, index) => ({
        tempId: -index - 1,
        id: l.id ? Number(l.id) : undefined,
        targetSeoContentId: l.targetSeoContentId ? Number(l.targetSeoContentId) : null,
        targetUrl: l.targetUrl ?? "",
        anchorText: l.anchorText ?? "",
      })),
    });
    setImages({
      featuredImage: content.images.featuredImage,
      ogImage: content.images.ogImage,
      twitterImage: content.images.twitterImage,
    });
  }

  const handleImageSelect = useCallback(
    (field: ImageField, slot: ImageSlot, assetId: number | null, title?: string) => {
      update(field, assetId);
      setImages((prev) => ({
        ...prev,
        [slot]: assetId
          ? { id: String(assetId), url: null, title: title ?? null }
          : null,
      }));
    },
    [update],
  );

  const createMutation = useCreateSeoContent();
  const updateMutation = useUpdateSeoContent();
  const publishMutation = usePublishSeoContent();
  const unpublishMutation = useUnpublishSeoContent();

  const mutationsPending =
    createMutation.isPending || updateMutation.isPending || publishMutation.isPending || unpublishMutation.isPending;

  const validate = useCallback((): boolean => {
    if (!state.title.trim()) {
      toast.error(t("titleRequired"));
      setActiveTab("content");
      return false;
    }
    for (const faq of state.faqs) {
      if (!faq.question.trim() || !faq.answer.trim()) {
        toast.error(t("faqFieldsRequired"));
        setActiveTab("faqs");
        return false;
      }
    }
    for (const keyword of state.keywords) {
      if (!keyword.keyword.trim()) {
        toast.error(t("keywordRequired"));
        setActiveTab("keywords");
        return false;
      }
    }
    return true;
  }, [state, t]);

  const buildPayload = useCallback(
    (statusOverride?: SeoContentStatus) => ({
      content_type: state.contentType,
      title: state.title,
      slug: state.slug.trim() || undefined,
      status: statusOverride ?? state.status,
      indexable: state.indexable,
      in_sitemap: state.inSitemap,
      excerpt: state.excerpt.trim() || null,
      content: state.content || null,
      content_format: "markdown" as const,
      seo_title: state.seoTitle.trim() || null,
      seo_description: state.seoDescription.trim() || null,
      focus_keyword: state.focusKeyword.trim() || null,
      secondary_keywords: state.secondaryKeywords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      canonical_url: state.canonicalUrl.trim() || null,
      og_title: state.ogTitle.trim() || null,
      og_description: state.ogDescription.trim() || null,
      twitter_title: state.twitterTitle.trim() || null,
      twitter_description: state.twitterDescription.trim() || null,
      structured_data_type: state.structuredDataType,
      featured_image_asset_id: state.featuredImageAssetId,
      og_image_asset_id: state.ogImageAssetId,
      twitter_image_asset_id: state.twitterImageAssetId,
      faqs: state.faqs.map((f, index) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        sort_order: index,
        is_published: f.isPublished,
      })),
      keywords: state.keywords.map((k, index) => ({
        id: k.id,
        keyword: k.keyword,
        keyword_type: k.keywordType,
        search_intent: k.searchIntent || null,
        notes: k.notes.trim() || null,
        sort_order: index,
      })),
      links: state.links.map((l, index) => ({
        id: l.id,
        target_seo_content_id: l.targetSeoContentId,
        target_url: l.targetUrl.trim() || null,
        anchor_text: l.anchorText.trim() || null,
        sort_order: index,
      })),
    }),
    [state],
  );

  const save = useCallback(
    (statusOverride?: SeoContentStatus) => {
      if (!validate()) return;
      const payload = buildPayload(statusOverride);

      const handleSuccess = (result?: { id: string }) => {
        toast.success(t("saveSuccess"));
        if (!isEdit && result?.id) {
          router.push(routes.seoContentEdit.replace("[id]", result.id));
        }
      };

      if (isEdit && id) {
        updateMutation.mutate(
          { id, payload },
          { onSuccess: () => handleSuccess({ id }) },
        );
      } else {
        createMutation.mutate(payload, { onSuccess: handleSuccess });
      }
    },
    [validate, buildPayload, isEdit, id, updateMutation, createMutation, router, t],
  );

  const publish = useCallback(() => {
    if (isEdit && id) {
      publishMutation.mutate(id, {
        onSuccess: () => {
          toast.success(t("publishSuccess"));
          refetch();
        },
      });
    } else {
      save("published");
    }
  }, [isEdit, id, publishMutation, refetch, save, t]);

  const unpublish = useCallback(() => {
    if (!isEdit || !id) return;
    unpublishMutation.mutate(id, {
      onSuccess: () => {
        toast.success(t("unpublishSuccess"));
        refetch();
      },
    });
  }, [isEdit, id, unpublishMutation, refetch, t]);

  if (isEdit && isLoading) {
    return <AppLoadingState label={t("loading")} />;
  }
  if (isEdit && isError) {
    return <AppErrorState onRetry={() => refetch()} />;
  }

  const isPublished = state.status === "published";

  const previewTitle = state.seoTitle || state.title || t("serpTitle");
  const previewPath = isEdit && content?.publicPath ? content.publicPath : `/${state.slug}`;
  const previewUrl = `${origin}${previewPath}`;
  const previewDescription = state.seoDescription || state.excerpt || t("serpDescription");
  const previewImage = images.ogImage?.url || images.featuredImage?.url || null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AppButton
            variant="ghost"
            size="icon"
            onClick={() => router.push(routes.seoContent)}
            aria-label={t("backToList")}
          >
            <ArrowRight className="h-4 w-4" />
          </AppButton>
          <div>
            <h1 className="text-lg font-semibold">
              {isEdit ? t("contentEdit") : t("contentNew")}
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              <SeoStatusBadge status={state.status} />
              {state.slug && <span dir="ltr" className="text-xs">{state.slug}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && isPublished && (
            <PermissionGuard permission="seo.publish">
              <AppButton
                variant="outline"
                disabled={mutationsPending}
                onClick={unpublish}
              >
                <ArrowDown className="h-4 w-4" />
                {t("unpublish")}
              </AppButton>
            </PermissionGuard>
          )}
          {isEdit && content?.publicPath && (
            <AppButton variant="outline" asChild>
              <a href={content.publicPath} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t("preview")}
              </a>
            </AppButton>
          )}
          {isPublished ? (
            <AppButton
              variant="outline"
              disabled={mutationsPending}
              onClick={() => save()}
            >
              {t("saveChanges")}
            </AppButton>
          ) : (
            <AppButton
              variant="outline"
              disabled={mutationsPending}
              onClick={() => save()}
            >
              {t("saveDraft")}
            </AppButton>
          )}
          {!isPublished && canPublish && (
            <AppButton disabled={mutationsPending} onClick={publish}>
              <Send className="h-4 w-4" />
              {t("publish")}
            </AppButton>
          )}
        </div>
      </div>

      <AppTabs value={activeTab} onValueChange={setActiveTab}>
        <AppTabsList className="w-full justify-start overflow-x-auto">
          <AppTabsTrigger value="content">{t("contentTab")}</AppTabsTrigger>
          <AppTabsTrigger value="seo">{t("seoTab")}</AppTabsTrigger>
          <AppTabsTrigger value="faqs">
            {t("faqTab")}
            {state.faqs.length > 0 && ` (${state.faqs.length})`}
          </AppTabsTrigger>
          <AppTabsTrigger value="keywords">
            {t("keywordsTab")}
            {state.keywords.length > 0 && ` (${state.keywords.length})`}
          </AppTabsTrigger>
          <AppTabsTrigger value="links">
            {t("linksTab")}
            {state.links.length > 0 && ` (${state.links.length})`}
          </AppTabsTrigger>
          <AppTabsTrigger value="preview">{t("previewTab")}</AppTabsTrigger>
        </AppTabsList>

        <AppTabsContent value="content">
          <ContentTab
            state={state}
            update={update}
            images={images}
            onImageSelect={handleImageSelect}
            t={t}
          />
        </AppTabsContent>

        <AppTabsContent value="seo">
          <SeoPanelTab
            state={state}
            update={update}
            images={images}
            onImageSelect={handleImageSelect}
            score={content?.score ?? null}
            t={t}
          />
        </AppTabsContent>

        <AppTabsContent value="faqs">
          <FaqsTab state={state} update={update} nextTempId={nextTempId} t={t} />
        </AppTabsContent>

        <AppTabsContent value="keywords">
          <KeywordsTab state={state} update={update} nextTempId={nextTempId} t={t} />
        </AppTabsContent>

        <AppTabsContent value="links">
          <LinksTab state={state} update={update} nextTempId={nextTempId} t={t} />
        </AppTabsContent>

        <AppTabsContent value="preview">
          <PreviewTab
            title={previewTitle}
            description={previewDescription}
            url={previewUrl}
            image={previewImage}
            t={t}
          />
        </AppTabsContent>
      </AppTabs>
    </div>
  );
}

// ── Content tab ──────────────────────────────────────────────────────────────

function ContentTab({
  state,
  update,
  images,
  onImageSelect,
  t,
}: {
  state: EditorState;
  update: (key: keyof EditorState, value: unknown) => void;
  images: EditorImages;
  onImageSelect: (field: ImageField, slot: ImageSlot, assetId: number | null, title?: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>{t("contentTab")}</AppCardTitle>
            <AppCardDescription>{t("seoPanelHint")}</AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("type")}>
                <AppSelect
                  value={state.contentType}
                  onValueChange={(value) => update("contentType", value as SeoContentType)}
                >
                  <AppSelectTrigger>
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {SEO_CONTENT_TYPE_OPTIONS.map((option) => (
                      <AppSelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </Field>
              <Field label={t("status")}>
                <AppSelect
                  value={state.status}
                  onValueChange={(value) => update("status", value as SeoContentStatus)}
                >
                  <AppSelectTrigger>
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {SEO_STATUS_OPTIONS.map((option) => (
                      <AppSelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </Field>
            </div>

            <Field label={t("title")}>
              <AppInput
                value={state.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder={t("title")}
              />
            </Field>

            <Field label={t("slug")} hint={t("slugHint")}>
              <AppInput
                value={state.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="page-slug"
                dir="ltr"
              />
            </Field>

            <Field label={t("excerpt")}>
              <AppTextarea
                value={state.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
                rows={3}
              />
            </Field>

            <Field label={t("contentBody")} hint={t("markdownHint")}>
              <AppTextarea
                value={state.content}
                onChange={(e) => update("content", e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </Field>
          </AppCardContent>
        </AppCard>
      </div>

      <div className="space-y-4">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>{t("featuredImage")}</AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <SeoImageField
              label={t("featuredImage")}
              image={images.featuredImage}
              onSelect={(assetId) => onImageSelect("featuredImageAssetId", "featuredImage", assetId)}
            />
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <AppCardTitle>{t("contentSettings")}</AppCardTitle>
          </AppCardHeader>
          <AppCardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label>{t("indexable")}</Label>
                <p className="text-xs text-muted-foreground">{t("indexableHint")}</p>
              </div>
              <AppSwitch
                checked={state.indexable}
                onCheckedChange={(checked) => update("indexable", checked)}
              />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label>{t("inSitemap")}</Label>
                <p className="text-xs text-muted-foreground">{t("inSitemapHint")}</p>
              </div>
              <AppSwitch
                checked={state.inSitemap}
                onCheckedChange={(checked) => update("inSitemap", checked)}
              />
            </div>
          </AppCardContent>
        </AppCard>
      </div>
    </div>
  );
}

// ── SEO tab ─────────────────────────────────────────────────────────────────

function SeoPanelTab({
  state,
  update,
  images,
  onImageSelect,
  score,
  t,
}: {
  state: EditorState;
  update: (key: keyof EditorState, value: unknown) => void;
  images: EditorImages;
  onImageSelect: (field: ImageField, slot: ImageSlot, assetId: number | null, title?: string) => void;
  score: { score: number; health: string; checks: { label: string; status: string; pass: boolean }[] } | null;
  t: (key: string) => string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>{t("seoPanel")}</AppCardTitle>
            <AppCardDescription>{t("seoPanelHint")}</AppCardDescription>
          </AppCardHeader>
          <AppCardContent className="space-y-4">
            <Field label={t("seoTitle")} counter={fieldCounter(state.seoTitle, 60)}>
              <AppInput
                value={state.seoTitle}
                onChange={(e) => update("seoTitle", e.target.value)}
              />
            </Field>
            <Field label={t("seoDescription")} counter={fieldCounter(state.seoDescription, 155)}>
              <AppTextarea
                value={state.seoDescription}
                onChange={(e) => update("seoDescription", e.target.value)}
                rows={3}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("focusKeyword")}>
                <AppInput
                  value={state.focusKeyword}
                  onChange={(e) => update("focusKeyword", e.target.value)}
                />
              </Field>
              <Field label={t("secondaryKeywords")} hint={t("secondaryKeywordsHint")}>
                <AppInput
                  value={state.secondaryKeywords}
                  onChange={(e) => update("secondaryKeywords", e.target.value)}
                />
              </Field>
            </div>
            <Field label={t("canonicalUrl")} hint={t("canonicalHint")}>
              <AppInput
                value={state.canonicalUrl}
                onChange={(e) => update("canonicalUrl", e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />
            </Field>
            <Field label={t("structuredDataType")}>
              <AppSelect
                value={state.structuredDataType}
                onValueChange={(value) => update("structuredDataType", value as SeoStructuredDataType)}
              >
                <AppSelectTrigger>
                  <AppSelectValue />
                </AppSelectTrigger>
                <AppSelectContent>
                  {SEO_STRUCTURED_DATA_OPTIONS.map((option) => (
                    <AppSelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </Field>
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <AppCardTitle>{t("ogTitle")}</AppCardTitle>
          </AppCardHeader>
          <AppCardContent className="space-y-4">
            <Field label={t("ogTitle")} counter={fieldCounter(state.ogTitle, 60)}>
              <AppInput
                value={state.ogTitle}
                onChange={(e) => update("ogTitle", e.target.value)}
              />
            </Field>
            <Field label={t("ogDescription")} counter={fieldCounter(state.ogDescription, 200)}>
              <AppTextarea
                value={state.ogDescription}
                onChange={(e) => update("ogDescription", e.target.value)}
                rows={2}
              />
            </Field>
            <SeoImageField
              label={t("ogImage")}
              image={images.ogImage}
              onSelect={(assetId) => onImageSelect("ogImageAssetId", "ogImage", assetId)}
            />
          </AppCardContent>
        </AppCard>

        <AppCard>
          <AppCardHeader>
            <AppCardTitle>{t("twitterTitle")}</AppCardTitle>
          </AppCardHeader>
          <AppCardContent className="space-y-4">
            <Field label={t("twitterTitle")} counter={fieldCounter(state.twitterTitle, 60)}>
              <AppInput
                value={state.twitterTitle}
                onChange={(e) => update("twitterTitle", e.target.value)}
              />
            </Field>
            <Field label={t("twitterDescription")} counter={fieldCounter(state.twitterDescription, 200)}>
              <AppTextarea
                value={state.twitterDescription}
                onChange={(e) => update("twitterDescription", e.target.value)}
                rows={2}
              />
            </Field>
            <SeoImageField
              label={t("twitterImage")}
              image={images.twitterImage}
              onSelect={(assetId) => onImageSelect("twitterImageAssetId", "twitterImage", assetId)}
            />
          </AppCardContent>
        </AppCard>
      </div>

      <div className="space-y-4">
        <AppCard>
          <AppCardHeader>
            <AppCardTitle>{t("healthScore")}</AppCardTitle>
          </AppCardHeader>
          <AppCardContent className="space-y-4">
            {score ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-3xl font-bold tabular-nums">{score.score}</span>
                  <SeoHealthBadge health={score.health} score={score.score} />
                </div>
                <AppProgress value={score.score} max={100} variant="default" />
                <div className="space-y-2 pt-1">
                  {score.checks.map((check) => (
                    <div key={check.label} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{check.label}</span>
                      <span
                        className={
                          check.status === "good"
                            ? "text-success"
                            : check.status === "warning"
                              ? "text-warning"
                              : "text-destructive"
                        }
                      >
                        {check.pass ? "✓" : "✗"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noScore")}</p>
            )}
          </AppCardContent>
        </AppCard>
      </div>
    </div>
  );
}

// ── FAQ tab ──────────────────────────────────────────────────────────────────

function FaqsTab({
  state,
  update,
  nextTempId,
  t,
}: {
  state: EditorState;
  update: (key: keyof EditorState, value: unknown) => void;
  nextTempId: () => number;
  t: (key: string) => string;
}) {
  const faqs = state.faqs;

  const addFaq = () => {
    update("faqs", [
      ...faqs,
      { tempId: nextTempId(), question: "", answer: "", isPublished: true },
    ]);
  };

  const removeFaq = (tempId: number) => {
    update("faqs", faqs.filter((f) => f.tempId !== tempId));
  };

  const moveFaq = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= faqs.length) return;
    const copy = [...faqs];
    const a = copy[index]!;
    const b = copy[target]!;
    copy[index] = b;
    copy[target] = a;
    update("faqs", copy);
  };

  const patchFaq = (tempId: number, patch: Partial<EditorFaq>) => {
    update(
      "faqs",
      faqs.map((f) => (f.tempId === tempId ? { ...f, ...patch } : f)),
    );
  };

  return (
    <AppCard>
      <AppCardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <AppCardTitle>{t("faqTab")}</AppCardTitle>
          <AppCardDescription>{t("faqHint")}</AppCardDescription>
        </div>
        <AppButton size="sm" onClick={addFaq}>
          <Plus className="h-4 w-4" />
          {t("addFaq")}
        </AppButton>
      </AppCardHeader>
      <AppCardContent className="space-y-3">
        {faqs.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("noFaqs")}</p>
        )}
        {faqs.map((faq, index) => (
          <div key={faq.tempId} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {t("faqQuestion")} {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <AppButton
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moveFaq(index, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === faqs.length - 1}
                  onClick={() => moveFaq(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeFaq(faq.tempId)}
                >
                  <Trash2 className="h-4 w-4" />
                </AppButton>
              </div>
            </div>
            <Field label={t("faqQuestion")}>
              <AppInput
                value={faq.question}
                onChange={(e) => patchFaq(faq.tempId, { question: e.target.value })}
              />
            </Field>
            <Field label={t("faqAnswer")}>
              <AppTextarea
                value={faq.answer}
                onChange={(e) => patchFaq(faq.tempId, { answer: e.target.value })}
                rows={2}
              />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <Label>{t("faqPublished")}</Label>
              <AppSwitch
                checked={faq.isPublished}
                onCheckedChange={(checked) => patchFaq(faq.tempId, { isPublished: checked })}
              />
            </div>
          </div>
        ))}
      </AppCardContent>
    </AppCard>
  );
}

// ── Keywords tab ─────────────────────────────────────────────────────────────

function KeywordsTab({
  state,
  update,
  nextTempId,
  t,
}: {
  state: EditorState;
  update: (key: keyof EditorState, value: unknown) => void;
  nextTempId: () => number;
  t: (key: string) => string;
}) {
  const keywords = state.keywords;

  const addKeyword = () => {
    update("keywords", [
      ...keywords,
      { tempId: nextTempId(), keyword: "", keywordType: "related" as SeoKeywordType, searchIntent: "" as SeoSearchIntent | "", notes: "" },
    ]);
  };

  const removeKeyword = (tempId: number) => {
    update("keywords", keywords.filter((k) => k.tempId !== tempId));
  };

  const patchKeyword = (tempId: number, patch: Partial<EditorKeyword>) => {
    update(
      "keywords",
      keywords.map((k) => (k.tempId === tempId ? { ...k, ...patch } : k)),
    );
  };

  return (
    <AppCard>
      <AppCardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <AppCardTitle>{t("keywordsTab")}</AppCardTitle>
          <AppCardDescription>{t("keywordsHint")}</AppCardDescription>
        </div>
        <AppButton size="sm" onClick={addKeyword}>
          <Plus className="h-4 w-4" />
          {t("addKeyword")}
        </AppButton>
      </AppCardHeader>
      <AppCardContent className="space-y-3">
        {keywords.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("noKeywords")}</p>
        )}
        {keywords.map((keyword) => (
          <div key={keyword.tempId} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{t("keyword")}</span>
              <AppButton
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => removeKeyword(keyword.tempId)}
              >
                <Trash2 className="h-4 w-4" />
              </AppButton>
            </div>
            <Field label={t("keyword")}>
              <AppInput
                value={keyword.keyword}
                onChange={(e) => patchKeyword(keyword.tempId, { keyword: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("keywordType")}>
                <AppSelect
                  value={keyword.keywordType}
                  onValueChange={(value) => patchKeyword(keyword.tempId, { keywordType: value as SeoKeywordType })}
                >
                  <AppSelectTrigger>
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {SEO_KEYWORD_TYPE_OPTIONS.map((option) => (
                      <AppSelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </Field>
              <Field label={t("searchIntent")}>
                <AppSelect
                  value={keyword.searchIntent}
                  onValueChange={(value) => patchKeyword(keyword.tempId, { searchIntent: value as SeoSearchIntent | "" })}
                >
                  <AppSelectTrigger>
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {SEO_SEARCH_INTENT_OPTIONS.map((option) => (
                      <AppSelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </Field>
            </div>
            <Field label={t("notes")}>
              <AppInput
                value={keyword.notes}
                onChange={(e) => patchKeyword(keyword.tempId, { notes: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </AppCardContent>
    </AppCard>
  );
}

// ── Internal links tab ───────────────────────────────────────────────────────

function LinksTab({
  state,
  update,
  nextTempId,
  t,
}: {
  state: EditorState;
  update: (key: keyof EditorState, value: unknown) => void;
  nextTempId: () => number;
  t: (key: string) => string;
}) {
  const links = state.links;
  const [query, setQuery] = useState("");
  const { data: results, isLoading: searching } = useSeoLinkSearch(query);

  const addLink = (result: SeoLinkSearchResult) => {
    update("links", [
      ...links,
      {
        tempId: nextTempId(),
        targetSeoContentId: result.type === "seo_content" ? Number(result.id) : null,
        targetUrl: result.url ?? "",
        anchorText: result.title,
      },
    ]);
    setQuery("");
  };

  const removeLink = (tempId: number) => {
    update("links", links.filter((l) => l.tempId !== tempId));
  };

  const patchLink = (tempId: number, patch: Partial<EditorLink>) => {
    update(
      "links",
      links.map((l) => (l.tempId === tempId ? { ...l, ...patch } : l)),
    );
  };

  return (
    <div className="space-y-4">
      <AppCard>
        <AppCardHeader>
          <AppCardTitle>{t("linksTab")}</AppCardTitle>
          <AppCardDescription>{t("linkHint")}</AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-3">
          {links.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("noLinks")}</p>
          )}
          {links.map((link, index) => (
            <div key={link.tempId} className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Link2 className="h-4 w-4" />
                  {t("linkTarget")} {index + 1}
                </span>
                <AppButton
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeLink(link.tempId)}
                >
                  <Trash2 className="h-4 w-4" />
                </AppButton>
              </div>
              <Field label={t("linkAnchor")}>
                <AppInput
                  value={link.anchorText}
                  onChange={(e) => patchLink(link.tempId, { anchorText: e.target.value })}
                />
              </Field>
              <Field label={t("linkTarget")}>
                <AppInput
                  value={link.targetUrl}
                  onChange={(e) => patchLink(link.tempId, { targetUrl: e.target.value })}
                  dir="ltr"
                  className="text-left"
                />
              </Field>
            </div>
          ))}
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>{t("addLink")}</AppCardTitle>
          <AppCardDescription>{t("searchLinksEmpty")}</AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <AppInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("linkSearchPlaceholder")}
              className="ps-9"
            />
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {searching && (
              <p className="py-3 text-center text-sm text-muted-foreground">{t("loading")}</p>
            )}
            {!searching && results?.length === 0 && (
              <p className="py-3 text-center text-sm text-muted-foreground">{t("noResults")}</p>
            )}
            {(results ?? []).map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{result.title}</p>
                  <p className="truncate text-xs text-muted-foreground" dir="ltr">
                    {result.url}
                  </p>
                </div>
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() => addLink(result)}
                >
                  <Plus className="h-4 w-4" />
                  {t("addLink")}
                </AppButton>
              </div>
            ))}
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

// ── Preview tab ──────────────────────────────────────────────────────────────

function PreviewTab({
  title,
  description,
  url,
  image,
  t,
}: {
  title: string;
  description: string;
  url: string;
  image: string | null;
  t: (key: string) => string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AppCard>
        <AppCardHeader>
          <AppCardTitle>{t("previewGoogle")}</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="space-y-1 rounded-lg border bg-white p-4 font-sans">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
                G
              </span>
              <span>{t("previewGoogle")}</span>
            </div>
            <p className="truncate text-xs text-neutral-500" dir="ltr">
              {url || t("previewNotAvailable")}
            </p>
            <p className="text-lg leading-snug text-[#1a0dab]">
              {title.slice(0, 60) || "…"}
            </p>
            <p className="line-clamp-2 text-sm leading-snug text-neutral-700">
              {description.slice(0, 155) || "…"}
            </p>
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>{t("previewFacebook")}</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="overflow-hidden rounded-lg border bg-white font-sans">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-neutral-200 text-sm text-neutral-500">
                {t("previewNotAvailable")}
              </div>
            )}
            <div className="space-y-1 p-3">
              <p className="truncate text-xs text-neutral-500" dir="ltr">
                {url}
              </p>
              <p className="text-sm font-semibold leading-snug text-neutral-800">
                {title.slice(0, 60) || "…"}
              </p>
              <p className="line-clamp-2 text-xs leading-snug text-neutral-600">
                {description.slice(0, 155) || "…"}
              </p>
            </div>
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>{t("previewTwitter")}</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="overflow-hidden rounded-lg border bg-white font-sans">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-neutral-200 text-sm text-neutral-500">
                {t("previewNotAvailable")}
              </div>
            )}
            <div className="space-y-1 p-3">
              <p className="text-sm font-semibold leading-snug text-neutral-800">
                {title.slice(0, 60) || "…"}
              </p>
              <p className="line-clamp-2 text-xs leading-snug text-neutral-600">
                {description.slice(0, 155) || "…"}
              </p>
              <p className="truncate text-xs text-neutral-500" dir="ltr">
                {url}
              </p>
            </div>
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader>
          <AppCardTitle>{t("previewHint")}</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t("serpTitle")}: {title.slice(0, 60)}</p>
          <p>{t("serpDescription")}: {description.slice(0, 155)}</p>
          <p dir="ltr" className="text-left">{url}</p>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

export { SeoContentEditor };
