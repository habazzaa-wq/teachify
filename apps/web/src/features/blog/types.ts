export type BlogPostStatus = "draft" | "published" | "scheduled";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  cover_image_url: string | null;
  category: string | null;
  tags: string[];
  status: BlogPostStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  views: number;
  reading_minutes: number;
  author: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BlogPostPayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  category: string;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  seo_title: string;
  seo_description: string;
}

export interface BlogListResponse {
  data: BlogPost[];
  categories?: string[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
