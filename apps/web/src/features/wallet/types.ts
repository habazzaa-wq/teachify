export interface Wallet {
  id: number;
  tenant_id: number;
  tenant_user_id: number;
  balance: number;
  currency: string;
  updated_at: string | null;
}

export type WalletTransactionMethod = "recharge_code" | "online" | "wallet_use";

export interface WalletPaymentBrief {
  reference: string | null;
  provider: string | null;
  status: string | null;
  paid_at: string | null;
}

export interface WalletTransaction {
  id: number;
  tenant_id: number;
  wallet_id: number;
  tenant_user_id: number | null;
  recharge_code_id: number | null;
  type: "credit" | "debit";
  amount: string;
  balance_after: string;
  description: string | null;
  created_at: string;
  /** How this transaction happened (enriched by the API). */
  method?: WalletTransactionMethod;
  /** The redeemed recharge code when `method === "recharge_code"`. */
  recharge_code?: string | null;
  /** The online payment when `method === "online"`. */
  payment?: WalletPaymentBrief | null;
}

export interface RechargeCodeRecord {
  id: number;
  tenant_id: number;
  created_by_tenant_user_id: number | null;
  code: string;
  amount: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by?: { id: number; user_id: number } | null;
}

export interface RechargeCodeInput {
  code?: string | null;
  amount: number;
  expires_at?: string | null;
  is_active?: boolean;
}

export interface RechargeCodeGenerateInput {
  amount: number;
  expires_at?: string | null;
  is_active?: boolean;
  quantity?: number;
}

export interface RechargeResponse {
  message: string;
  data: {
    amount: number;
    balance: number;
    wallet: Wallet;
    transaction: WalletTransaction;
  };
}

export type OnlinePaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired";

export interface OnlinePaymentCreateResponse {
  message: string;
  data: {
    reference: string;
    payment_url: string;
    amount: number;
    currency: string;
  };
}

export interface OnlinePaymentStatusResponse {
  data: {
    reference: string;
    status: OnlinePaymentStatus;
    amount: number;
    currency: string;
    failure_reason: string | null;
    paid_at: string | null;
    wallet_balance: number;
  };
}
