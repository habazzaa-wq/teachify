export type SeoContentType =
  | "article"
  | "guide"
  | "faq_collection"
  | "custom_page"
  | "course"
  | "stage"
  | "subject"
  | "category";

export type SeoContentStatus = "draft" | "review" | "published" | "archived";

export type SeoContentFormat = "markdown" | "html";

export type SeoStructuredDataType =
  | "article"
  | "news_article"
  | "faq_page"
  | "course"
  | "item_list"
  | "breadcrumb"
  | "none";

export type SeoKeywordType = "focus" | "related" | "long_tail";

export type SeoSearchIntent =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational";

export type SeoRobotsPolicy = "index" | "noindex" | "index_follow" | "noindex_nofollow";

export type SeoHealth = "excellent" | "good" | "fair" | "poor";

export interface SeoImageData {
  id: string;
  url: string | null;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  size?: number;
  title?: string | null;
}

export interface SeoScoreCheck {
  key: string;
  label: string;
  status: "good" | "warning" | "critical";
  pass: boolean;
  weight: number;
}

export interface SeoScore {
  score: number;
  max_score: number;
  checks: SeoScoreCheck[];
  critical: number;
  warning: number;
  good: number;
  health: SeoHealth;
}

export interface SeoFaq {
  id?: string;
  question: string;
  answer: string;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface SeoContentKeyword {
  id?: string;
  keyword: string;
  keywordType?: SeoKeywordType;
  searchIntent?: SeoSearchIntent | null;
  notes?: string | null;
  sortOrder?: number;
}

export interface SeoContentLink {
  id?: string;
  targetSeoContentId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  targetUrl?: string | null;
  anchorText?: string | null;
  sortOrder?: number;
}

export interface SeoContentSeo {
  title: string | null;
  description: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string[];
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  structuredDataType: string | null;
}

export interface SeoContentImages {
  featuredImage: SeoImageData | null;
  ogImage: SeoImageData | null;
  twitterImage: SeoImageData | null;
}

export interface SeoContent {
  id: string;
  tenantId: string;
  contentType: SeoContentType;
  title: string;
  slug: string;
  status: SeoContentStatus;
  indexable: boolean;
  inSitemap: boolean;
  excerpt: string | null;
  content: string | null;
  contentFormat: SeoContentFormat;
  publicPath: string | null;
  isPublished: boolean;
  isSitemapEligible: boolean;
  author: { id: string; name: string } | null;
  seo: SeoContentSeo;
  images: SeoContentImages;
  faqs?: SeoFaq[];
  keywords?: SeoContentKeyword[];
  links?: SeoContentLink[];
  revisionsCount?: number;
  score?: SeoScore | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeoContentFilterParams {
  search?: string;
  content_type?: SeoContentType | "all";
  status?: SeoContentStatus | "all";
  sort?: "title" | "status" | "created_at" | "updated_at" | "published_at";
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface SeoFaqPayload {
  id?: number;
  question: string;
  answer: string;
  sort_order?: number;
  is_published?: boolean;
}

export interface SeoKeywordPayload {
  id?: number;
  keyword: string;
  keyword_type?: SeoKeywordType;
  search_intent?: SeoSearchIntent | null;
  notes?: string | null;
  sort_order?: number;
}

export interface SeoLinkPayload {
  id?: number;
  target_seo_content_id?: number | null;
  target_url?: string | null;
  anchor_text?: string | null;
  sort_order?: number;
}

export interface SeoContentPayload {
  content_type?: SeoContentType;
  title?: string;
  slug?: string;
  status?: SeoContentStatus;
  indexable?: boolean;
  in_sitemap?: boolean;
  excerpt?: string | null;
  content?: string | null;
  content_format?: SeoContentFormat;
  seo_title?: string | null;
  seo_description?: string | null;
  focus_keyword?: string | null;
  secondary_keywords?: string[];
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  structured_data_type?: SeoStructuredDataType;
  featured_image_asset_id?: number | null;
  og_image_asset_id?: number | null;
  twitter_image_asset_id?: number | null;
  published_at?: string | null;
  faqs?: SeoFaqPayload[];
  keywords?: SeoKeywordPayload[];
  links?: SeoLinkPayload[];
}

export interface SeoKeyword {
  id: string;
  tenantId: string;
  seoContentId: string | null;
  keyword: string;
  keywordType: SeoKeywordType;
  searchIntent: SeoSearchIntent | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  seoContent?: { id: string; title: string; slug: string; status: string } | null;
}

export interface SeoKeywordFilterParams {
  search?: string;
  keyword_type?: SeoKeywordType | "all";
  search_intent?: SeoSearchIntent | "all";
  sort?: "keyword" | "keyword_type" | "created_at";
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface SeoKeywordPayloadCreate {
  seo_content_id?: number | null;
  keyword: string;
  keyword_type?: SeoKeywordType;
  search_intent?: SeoSearchIntent | null;
  notes?: string | null;
  sort_order?: number;
}

export interface SeoKeywordPayloadUpdate {
  keyword?: string;
  keyword_type?: SeoKeywordType;
  search_intent?: SeoSearchIntent | null;
  notes?: string | null;
  sort_order?: number;
}

export interface SeoSetting {
  tenantId: string;
  defaultTitleTemplate: string | null;
  defaultDescription: string | null;
  defaultOgImage: SeoImageData | null;
  defaultTwitterImage: SeoImageData | null;
  defaultRobotsPolicy: SeoRobotsPolicy;
  sitemapIncludeDefault: boolean;
  organizationName: string | null;
  organizationDescription: string | null;
  socialProfiles: string[];
  homepageTitle: string | null;
  homepageDescription: string | null;
  googleVerification: string | null;
  bingVerification: string | null;
  updatedAt: string | null;
}

export interface SeoSettingPayload {
  default_title_template?: string | null;
  default_description?: string | null;
  default_og_image_asset_id?: number | null;
  default_twitter_image_asset_id?: number | null;
  default_robots_policy?: SeoRobotsPolicy;
  sitemap_include_default?: boolean;
  organization_name?: string | null;
  organization_description?: string | null;
  social_profiles?: string[];
  homepage_title?: string | null;
  homepage_description?: string | null;
  google_verification?: string | null;
  bing_verification?: string | null;
}

export interface SeoOverviewIssueItem {
  id: string;
  title: string;
  contentType: SeoContentType;
  status: SeoContentStatus;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
}

export interface SeoOverviewNeedsAttentionItem {
  id: string;
  title: string;
  status: SeoContentStatus;
  slug: string;
  updatedAt: string | null;
  score: number;
  health: SeoHealth;
  critical: number;
  warning: number;
}

export interface SeoDuplicateDescription {
  description: string;
  count: number;
  contents: SeoOverviewIssueItem[];
}

export interface SeoOverviewIssues {
  weakTitles: SeoOverviewIssueItem[];
  weakDescriptions: SeoOverviewIssueItem[];
  duplicateDescriptions: SeoDuplicateDescription[];
  needsAttention: SeoOverviewNeedsAttentionItem[];
}

export interface SeoOverviewData {
  summary: {
    totalContents: number;
    published: number;
    draft: number;
    review: number;
    archived: number;
    averageScore: number | null;
    health: SeoHealth | null;
  };
  typeBreakdown: Record<string, number>;
  scoreDistribution: Record<SeoHealth, number>;
  issues: SeoOverviewIssues;
  resourceStats: {
    keywords: number;
    faqs: number;
    internalLinks: number;
    revisions: number;
  };
  searchConsole: { connected: boolean; note: string };
  recentActivity: SeoOverviewIssueItem[];
}

export interface SeoLinkSearchResult {
  type: "seo_content" | "course" | "stage" | "subject";
  contentType?: string;
  id: string;
  title: string;
  url: string | null;
  seoTitle?: string | null;
  description?: string | null;
  score?: number;
  matchedOn?: string;
}

export interface SeoRevision {
  id: string;
  action: string;
  editor: string;
  snapshot: Record<string, unknown>;
  createdAt: string | null;
}
