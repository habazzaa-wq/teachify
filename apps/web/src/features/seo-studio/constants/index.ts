import type {
  SeoContentStatus,
  SeoContentType,
  SeoKeywordType,
  SeoRobotsPolicy,
  SeoSearchIntent,
  SeoStructuredDataType,
} from "../types";

export interface SelectOption {
  value: string;
  label: string;
}

export const SEO_CONTENT_TYPE_OPTIONS: SelectOption[] = [
  { value: "article", label: "article" },
  { value: "guide", label: "guide" },
  { value: "faq_collection", label: "faq_collection" },
  { value: "custom_page", label: "custom_page" },
  { value: "course", label: "course" },
  { value: "stage", label: "stage" },
  { value: "subject", label: "subject" },
  { value: "category", label: "category" },
];

export const SEO_STATUS_OPTIONS: SelectOption[] = [
  { value: "draft", label: "draft" },
  { value: "review", label: "review" },
  { value: "published", label: "published" },
  { value: "archived", label: "archived" },
];

export const SEO_KEYWORD_TYPE_OPTIONS: SelectOption[] = [
  { value: "focus", label: "focus" },
  { value: "related", label: "related" },
  { value: "long_tail", label: "long_tail" },
];

export const SEO_SEARCH_INTENT_OPTIONS: SelectOption[] = [
  { value: "informational", label: "informational" },
  { value: "commercial", label: "commercial" },
  { value: "transactional", label: "transactional" },
  { value: "navigational", label: "navigational" },
];

export const SEO_ROBOTS_POLICY_OPTIONS: SelectOption[] = [
  { value: "index", label: "index" },
  { value: "noindex", label: "noindex" },
  { value: "index_follow", label: "index_follow" },
  { value: "noindex_nofollow", label: "noindex_nofollow" },
];

export const SEO_STRUCTURED_DATA_OPTIONS: SelectOption[] = [
  { value: "article", label: "article" },
  { value: "news_article", label: "news_article" },
  { value: "faq_page", label: "faq_page" },
  { value: "course", label: "course" },
  { value: "item_list", label: "item_list" },
  { value: "breadcrumb", label: "breadcrumb" },
  { value: "none", label: "structuredDataTypeNone" },
];

export const SEO_HEALTH_OPTIONS: SelectOption[] = [
  { value: "excellent", label: "excellent" },
  { value: "good", label: "good" },
  { value: "fair", label: "fair" },
  { value: "poor", label: "poor" },
];

export const SEO_CONTENT_SORT_OPTIONS: SelectOption[] = [
  { value: "updated_at", label: "updatedAt" },
  { value: "created_at", label: "createdAt" },
  { value: "published_at", label: "publishedAt" },
  { value: "title", label: "title" },
  { value: "status", label: "status" },
];

export const SEO_KEYWORD_SORT_OPTIONS: SelectOption[] = [
  { value: "created_at", label: "createdAt" },
  { value: "keyword", label: "keyword" },
  { value: "keyword_type", label: "keywordType" },
];

export const SEO_PAGE_SIZE = 10;

export const SEO_IMAGE_TYPES = ["image"] as const;

export const SEO_HEALTH_COLORS: Record<string, { bar: string }> = {
  excellent: { bar: "bg-success" },
  good: { bar: "bg-cyan-500" },
  fair: { bar: "bg-warning" },
  poor: { bar: "bg-destructive" },
};

export const SEO_STATUS_MAP: Record<SeoContentStatus, { badge: "draft" | "published" | "archived" | "pending"; color: string }> = {
  draft: { badge: "draft", color: "bg-muted-foreground/50" },
  review: { badge: "pending", color: "bg-warning" },
  published: { badge: "published", color: "bg-success" },
  archived: { badge: "archived", color: "bg-muted-foreground/50" },
};

export const SEO_CONTENT_TYPE_LABEL: Record<SeoContentType, string> = {
  article: "article",
  guide: "guide",
  faq_collection: "faq_collection",
  custom_page: "custom_page",
  course: "course",
  stage: "stage",
  subject: "subject",
  category: "category",
};

export const SEO_KEYWORD_TYPE_LABEL: Record<SeoKeywordType, string> = {
  focus: "focus",
  related: "related",
  long_tail: "long_tail",
};

export const SEO_SEARCH_INTENT_LABEL: Record<SeoSearchIntent, string> = {
  informational: "informational",
  commercial: "commercial",
  transactional: "transactional",
  navigational: "navigational",
};

export const SEO_ROBOTS_POLICY_LABEL: Record<SeoRobotsPolicy, string> = {
  index: "index",
  noindex: "noindex",
  index_follow: "index_follow",
  noindex_nofollow: "noindex_nofollow",
};

export const SEO_STRUCTURED_DATA_LABEL: Record<SeoStructuredDataType, string> = {
  article: "article",
  news_article: "news_article",
  faq_page: "faq_page",
  course: "course",
  item_list: "item_list",
  breadcrumb: "breadcrumb",
  none: "structuredDataTypeNone",
};
