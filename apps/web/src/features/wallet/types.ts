export interface Wallet {
  id: number;
  tenant_id: number;
  tenant_user_id: number;
  balance: number;
  currency: string;
  updated_at: string | null;
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
