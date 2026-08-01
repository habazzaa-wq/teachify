export interface PaymentGatewaySettings {
  provider: string;
  environment: "test" | "live";
  is_active: boolean;
  api_key_masked: string;
  has_api_key: boolean;
  has_secret_key: boolean;
  updated_at: string | null;
}

export interface PaymentGatewayUpdateInput {
  provider?: "fawaterk";
  environment?: "test" | "live";
  api_key?: string | null;
  secret_key?: string | null;
  is_active?: boolean;
}
