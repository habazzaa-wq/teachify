export interface NewsItem {
  id: number;
  title: string;
  url: string | null;
}

export interface TickerConfig {
  enabled: boolean;
  direction: "rtl" | "ltr";
  speed: number;
  position: "top" | "bottom";
  showIcon: boolean;
  label: string;
  bgColor: string | null;
  textColor: string | null;
  accentColor: string | null;
}

export interface PublicNewsResponse {
  items: NewsItem[];
  ticker: TickerConfig;
}

export interface NewsRecord {
  id: number;
  tenant_id: number;
  created_by_tenant_user_id: number | null;
  title: string;
  url: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NewsInput {
  title: string;
  url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  starts_at?: string | null;
  ends_at?: string | null;
}

export const DEFAULT_TICKER: TickerConfig = {
  enabled: true,
  direction: "rtl",
  speed: 60,
  position: "top",
  showIcon: true,
  label: "أحدث الأخبار",
  bgColor: null,
  textColor: null,
  accentColor: null,
};
