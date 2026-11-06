export type PaymentProvider = "fawaterk" | "paypal";

export interface GatewaySettings {
  provider: PaymentProvider;
  environment: "test" | "live";
  is_active: boolean;
  has_api_key?: boolean;
  api_key_masked?: string;
  has_secret_key?: boolean;
  has_client_id?: boolean;
  client_id_masked?: string;
  has_client_secret?: boolean;
  currency?: string;
  exchange_rate?: number | null;
  exchange_rates?: Record<string, number | null>;
}

export interface PaymentGatewaySettings {
  fawaterk: GatewaySettings;
  paypal: GatewaySettings;
}

export interface PaymentGatewayUpdateInput {
  provider: PaymentProvider;
  environment?: "test" | "live";
  api_key?: string | null;
  secret_key?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  currency?: string;
  exchange_rate?: number | null;
  exchange_rates?: Record<string, number | null>;
  is_active?: boolean;
}
