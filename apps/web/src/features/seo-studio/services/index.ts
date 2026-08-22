import { api } from "@/services/api";
import type {
  SeoContent,
  SeoContentFilterParams,
  SeoContentKeyword,
  SeoContentLink,
  SeoContentPayload,
  SeoKeyword,
  SeoKeywordFilterParams,
  SeoKeywordPayloadCreate,
  SeoKeywordPayloadUpdate,
  SeoLinkSearchResult,
  SeoOverviewData,
  SeoRevision,
  SeoSetting,
  SeoSettingPayload,
} from "../types";

const SEO_PAGE_SIZE_DEFAULT = 25;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatImage(raw: any): SeoContent["images"]["featuredImage"] {
  if (!raw) return null;
  return {
    id: String(raw.id),
    url: raw.url ?? null,
    thumbnailUrl: raw.thumbnailUrl ?? raw.thumbnail_url ?? null,
    width: raw.width ?? null,
    height: raw.height ?? null,
    mimeType: raw.mimeType ?? raw.mime_type ?? null,
    size: raw.size ?? 0,
    title: raw.title ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatContent(raw: Record<string, any>): SeoContent {
  const seo = raw.seo ?? {};
  const images = raw.images ?? {};
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? raw.tenant_id),
    contentType: raw.contentType ?? raw.content_type ?? "article",
    title: raw.title ?? "",
    slug: raw.slug ?? "",
    status: raw.status ?? "draft",
    indexable: raw.indexable ?? true,
    inSitemap: raw.inSitemap ?? raw.in_sitemap ?? true,
    excerpt: raw.excerpt ?? null,
    content: raw.content ?? null,
    contentFormat: raw.contentFormat ?? raw.content_format ?? "markdown",
    publicPath: raw.publicPath ?? raw.public_path ?? null,
    isPublished: raw.isPublished ?? raw.is_published ?? false,
    isSitemapEligible: raw.isSitemapEligible ?? raw.is_sitemap_eligible ?? false,
    author: raw.author ?? null,
    seo: {
      title: seo.title ?? null,
      description: seo.description ?? null,
      focusKeyword: seo.focusKeyword ?? null,
      secondaryKeywords: seo.secondaryKeywords ?? [],
      canonicalUrl: seo.canonicalUrl ?? null,
      ogTitle: seo.ogTitle ?? null,
      ogDescription: seo.ogDescription ?? null,
      twitterTitle: seo.twitterTitle ?? null,
      twitterDescription: seo.twitterDescription ?? null,
      structuredDataType: seo.structuredDataType ?? null,
    },
    images: {
      featuredImage: formatImage(images.featuredImage),
      ogImage: formatImage(images.ogImage),
      twitterImage: formatImage(images.twitterImage),
    },
    faqs: Array.isArray(raw.faqs)
      ? raw.faqs.map((f: Record<string, unknown>) => ({
          id: f.id !== undefined && f.id !== null ? String(f.id) : undefined,
          question: String(f.question ?? ""),
          answer: String(f.answer ?? ""),
          sortOrder: Number(f.sortOrder ?? f.sort_order ?? 0),
          isPublished: Boolean(f.isPublished ?? f.is_published ?? true),
        }))
      : undefined,
    keywords: Array.isArray(raw.keywords)
      ? raw.keywords.map((k: Record<string, unknown>): SeoContentKeyword => ({
          id: k.id !== undefined && k.id !== null ? String(k.id) : undefined,
          keyword: String(k.keyword ?? ""),
          keywordType: (k.keywordType ?? k.keyword_type ?? "related") as SeoContentKeyword["keywordType"],
          searchIntent: (k.searchIntent ?? k.search_intent ?? null) as SeoContentKeyword["searchIntent"],
          notes: (k.notes ?? null) as SeoContentKeyword["notes"],
          sortOrder: Number(k.sortOrder ?? k.sort_order ?? 0),
        }))
      : undefined,
    links: Array.isArray(raw.links)
      ? raw.links.map((l: Record<string, unknown>): SeoContentLink => ({
          id: l.id !== undefined && l.id !== null ? String(l.id) : undefined,
          targetSeoContentId: l.targetSeoContentId !== undefined && l.targetSeoContentId !== null ? String(l.targetSeoContentId) : null,
          targetType: (l.targetType ?? null) as SeoContentLink["targetType"],
          targetId: l.targetId !== undefined && l.targetId !== null ? String(l.targetId) : null,
          targetUrl: (l.targetUrl ?? null) as SeoContentLink["targetUrl"],
          anchorText: (l.anchorText ?? null) as SeoContentLink["anchorText"],
          sortOrder: Number(l.sortOrder ?? l.sort_order ?? 0),
        }))
      : undefined,
    revisionsCount: raw.revisionsCount ?? raw.revisions_count ?? 0,
    score: raw.score ?? null,
    publishedAt: raw.publishedAt ?? raw.published_at ?? null,
    archivedAt: raw.archivedAt ?? raw.archived_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatKeyword(raw: Record<string, any>): SeoKeyword {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? raw.tenant_id),
    seoContentId: raw.seoContentId !== undefined && raw.seoContentId !== null ? String(raw.seoContentId) : null,
    keyword: raw.keyword ?? "",
    keywordType: raw.keywordType ?? raw.keyword_type ?? "related",
    searchIntent: raw.searchIntent ?? raw.search_intent ?? null,
    notes: raw.notes ?? null,
    sortOrder: Number(raw.sortOrder ?? raw.sort_order ?? 0),
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
    seoContent: raw.seoContent ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatSetting(raw: Record<string, any>): SeoSetting {
  return {
    tenantId: String(raw.tenantId ?? raw.tenant_id),
    defaultTitleTemplate: raw.defaultTitleTemplate ?? raw.default_title_template ?? null,
    defaultDescription: raw.defaultDescription ?? raw.default_description ?? null,
    defaultOgImage: formatImage(raw.defaultOgImage ?? raw.default_og_image),
    defaultTwitterImage: formatImage(raw.defaultTwitterImage ?? raw.default_twitter_image),
    defaultRobotsPolicy: raw.defaultRobotsPolicy ?? raw.default_robots_policy ?? "index",
    sitemapIncludeDefault: Boolean(raw.sitemapIncludeDefault ?? raw.sitemap_include_default ?? true),
    organizationName: raw.organizationName ?? raw.organization_name ?? null,
    organizationDescription: raw.organizationDescription ?? raw.organization_description ?? null,
    socialProfiles: raw.socialProfiles ?? raw.social_profiles ?? [],
    homepageTitle: raw.homepageTitle ?? raw.homepage_title ?? null,
    homepageDescription: raw.homepageDescription ?? raw.homepage_description ?? null,
    googleVerification: raw.googleVerification ?? raw.google_verification ?? null,
    bingVerification: raw.bingVerification ?? raw.bing_verification ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatOverviewItem(raw: Record<string, any>) {
  return {
    id: String(raw.id),
    title: raw.title ?? "",
    contentType: raw.contentType ?? raw.content_type ?? "article",
    status: raw.status ?? "draft",
    slug: raw.slug ?? "",
    seoTitle: raw.seoTitle ?? raw.seo_title ?? null,
    seoDescription: raw.seoDescription ?? raw.seo_description ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    publishedAt: raw.publishedAt ?? raw.published_at ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatOverview(raw: Record<string, any>): SeoOverviewData {
  const data = raw.data ?? raw;
  const summary = data.summary ?? {};
  const issues = data.issues ?? {};
  const resources = data.resourceStats ?? {};
  const consoleInfo = data.searchConsole ?? {};
  const dist = data.scoreDistribution ?? {};
  return {
    summary: {
      totalContents: summary.totalContents ?? 0,
      published: summary.published ?? 0,
      draft: summary.draft ?? 0,
      review: summary.review ?? 0,
      archived: summary.archived ?? 0,
      averageScore: summary.averageScore ?? null,
      health: summary.health ?? null,
    },
    typeBreakdown: data.typeBreakdown ?? {},
    scoreDistribution: {
      excellent: dist.excellent ?? 0,
      good: dist.good ?? 0,
      fair: dist.fair ?? 0,
      poor: dist.poor ?? 0,
    },
    issues: {
      weakTitles: (issues.weakTitles ?? []).map(formatOverviewItem),
      weakDescriptions: (issues.weakDescriptions ?? []).map(formatOverviewItem),
      duplicateDescriptions: (issues.duplicateDescriptions ?? []).map(
        (g: Record<string, unknown>) => ({
          description: String(g.description ?? ""),
          count: Number(g.count ?? 0),
          contents: ((g.contents ?? []) as Array<Record<string, unknown>>).map((c) =>
            formatOverviewItem(c),
          ),
        }),
      ),
      needsAttention: (issues.needsAttention ?? []).map((n: Record<string, unknown>) => ({
        id: String(n.id),
        title: String(n.title ?? ""),
        status: n.status as SeoOverviewData["issues"]["needsAttention"][number]["status"],
        slug: String(n.slug ?? ""),
        updatedAt: (n.updatedAt as string | null) ?? null,
        score: Number(n.score ?? 0),
        health: n.health as SeoOverviewData["issues"]["needsAttention"][number]["health"],
        critical: Number(n.critical ?? 0),
        warning: Number(n.warning ?? 0),
      })),
    },
    resourceStats: {
      keywords: resources.keywords ?? 0,
      faqs: resources.faqs ?? 0,
      internalLinks: resources.internalLinks ?? resources.internal_links ?? 0,
      revisions: resources.revisions ?? 0,
    },
    searchConsole: {
      connected: Boolean(consoleInfo.connected ?? false),
      note: String(consoleInfo.note ?? ""),
    },
    recentActivity: (data.recentActivity ?? []).map(formatOverviewItem),
  };
}

function buildContentParams(params?: SeoContentFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.content_type && params.content_type !== "all") q.content_type = params.content_type;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.sort) q.sort = params.sort;
  if (params.sort_dir) q.sort_dir = params.sort_dir;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);
  return q;
}

function buildKeywordParams(params?: SeoKeywordFilterParams): Record<string, string> {
  if (!params) return {};
  const q: Record<string, string> = {};
  if (params.search) q.search = params.search;
  if (params.keyword_type && params.keyword_type !== "all") q.keyword_type = params.keyword_type;
  if (params.search_intent && params.search_intent !== "all") q.search_intent = params.search_intent;
  if (params.sort) q.sort = params.sort;
  if (params.sort_dir) q.sort_dir = params.sort_dir;
  if (params.page) q.page = String(params.page);
  if (params.per_page) q.per_page = String(params.per_page);
  return q;
}

export const seoContentService = {
  async list(params?: SeoContentFilterParams): Promise<{
    data: SeoContent[];
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  }> {
    const { data } = await api.get("/seo/contents", { params: buildContentParams(params) });
    return {
      data: (data.data ?? []).map(formatContent),
      total: data.total ?? 0,
      perPage: data.per_page ?? SEO_PAGE_SIZE_DEFAULT,
      currentPage: data.current_page ?? 1,
      lastPage: data.last_page ?? 1,
    };
  },

  async get(id: string): Promise<SeoContent | null> {
    const { data } = await api.get(`/seo/contents/${id}`);
    return data.data ? formatContent(data.data) : null;
  },

  async create(payload: SeoContentPayload): Promise<SeoContent> {
    const { data } = await api.post("/seo/contents", payload);
    return formatContent(data.data);
  },

  async update(id: string, payload: SeoContentPayload): Promise<SeoContent> {
    const { data } = await api.patch(`/seo/contents/${id}`, payload);
    return formatContent(data.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/seo/contents/${id}`);
  },

  async publish(id: string): Promise<SeoContent> {
    const { data } = await api.post(`/seo/contents/${id}/publish`);
    return formatContent(data.data);
  },

  async unpublish(id: string): Promise<SeoContent> {
    const { data } = await api.post(`/seo/contents/${id}/unpublish`);
    return formatContent(data.data);
  },

  async archive(id: string): Promise<SeoContent> {
    const { data } = await api.post(`/seo/contents/${id}/archive`);
    return formatContent(data.data);
  },

  async restore(id: string): Promise<SeoContent> {
    const { data } = await api.post(`/seo/contents/${id}/restore`);
    return formatContent(data.data);
  },

  async revisions(id: string): Promise<{
    data: SeoRevision[];
    total: number;
    currentPage: number;
    lastPage: number;
  }> {
    const { data } = await api.get(`/seo/contents/${id}/revisions`);
    return {
      data: (data.data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        action: String(r.action ?? ""),
        editor: String(r.editor ?? "System"),
        snapshot: (r.snapshot as Record<string, unknown>) ?? {},
        createdAt: (r.createdAt as string | null) ?? null,
      })),
      total: data.total ?? 0,
      currentPage: data.current_page ?? 1,
      lastPage: data.last_page ?? 1,
    };
  },
};

export const seoKeywordService = {
  async list(params?: SeoKeywordFilterParams): Promise<{
    data: SeoKeyword[];
    total: number;
    currentPage: number;
    lastPage: number;
  }> {
    const { data } = await api.get("/seo/keywords", { params: buildKeywordParams(params) });
    return {
      data: (data.data ?? []).map(formatKeyword),
      total: data.total ?? 0,
      currentPage: data.current_page ?? 1,
      lastPage: data.last_page ?? 1,
    };
  },

  async get(id: string): Promise<SeoKeyword | null> {
    const { data } = await api.get(`/seo/keywords/${id}`);
    return data.data ? formatKeyword(data.data) : null;
  },

  async create(payload: SeoKeywordPayloadCreate): Promise<SeoKeyword> {
    const { data } = await api.post("/seo/keywords", payload);
    return formatKeyword(data.data);
  },

  async update(id: string, payload: SeoKeywordPayloadUpdate): Promise<SeoKeyword> {
    const { data } = await api.patch(`/seo/keywords/${id}`, payload);
    return formatKeyword(data.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/seo/keywords/${id}`);
  },
};

export const seoSettingService = {
  async get(): Promise<SeoSetting | null> {
    const { data } = await api.get("/seo/settings");
    return data.data ? formatSetting(data.data) : null;
  },

  async update(payload: SeoSettingPayload): Promise<SeoSetting> {
    const { data } = await api.put("/seo/settings", payload);
    return formatSetting(data.data);
  },
};

export const seoOverviewService = {
  async get(): Promise<SeoOverviewData | null> {
    const { data } = await api.get("/seo/overview");
    return data.data ? formatOverview(data) : null;
  },
};

export const seoLinkSearchService = {
  async search(search: string, limit = 20): Promise<SeoLinkSearchResult[]> {
    const { data } = await api.get("/seo/link-search", {
      params: { search: search || undefined, limit },
    });
    return (data.data ?? []).map((r: Record<string, unknown>) => ({
      type: r.type as SeoLinkSearchResult["type"],
      contentType: (r.contentType as string | undefined) ?? undefined,
      id: String(r.id),
      title: String(r.title ?? ""),
      url: (r.url as string | null) ?? null,
      seoTitle: (r.seoTitle as string | null | undefined) ?? null,
      description: (r.description as string | null | undefined) ?? null,
      score: r.score !== undefined ? Number(r.score) : undefined,
      matchedOn: (r.matchedOn as string | undefined) ?? undefined,
    }));
  },
};
