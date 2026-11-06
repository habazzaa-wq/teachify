export type PaymentProvider = "fawaterk" | "paypal" | "paymob";

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
  has_hmac_secret?: boolean;
  integration_id?: string;
  iframe_id?: string;
}

export interface PaymentGatewaySettings {
  fawaterk: GatewaySettings;
  paypal: GatewaySettings;
  paymob: GatewaySettings;
}

export interface PaymentGatewayUpdateInput {
  provider: PaymentProvider;
  environment?: "test" | "live";
  api_key?: string | null;
  secret_key?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  hmac_secret?: string | null;
  integration_id?: number;
  iframe_id?: number;
  is_active?: boolean;
}
