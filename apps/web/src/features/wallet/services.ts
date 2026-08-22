import api from "@/services/api/axios";
import { tenantStudentFetch } from "@/services/api/tenant-student-fetch";
import type {
  OnlinePaymentCreateResponse,
  OnlinePaymentStatusResponse,
  RechargeCodeGenerateInput,
  RechargeCodeInput,
  RechargeCodeRecord,
  RechargeResponse,
  Wallet,
  WalletTransaction,
} from "./types";

export const walletService = {
  async getWallet(): Promise<Wallet> {
    const json = await tenantStudentFetch<{ data: Wallet }>("/student/wallet");
    return json.data;
  },

  async getTransactions(params?: { per_page?: number }) {
    const query = params?.per_page ? `?per_page=${params.per_page}` : "";
    const json = await tenantStudentFetch<{
      data: WalletTransaction[];
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    }>(`/student/wallet/transactions${query}`);
    return json;
  },

  async recharge(code: string): Promise<RechargeResponse> {
    const json = await tenantStudentFetch<RechargeResponse>("/student/wallet/recharge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return json;
  },

  async createOnlinePayment(amount: number): Promise<OnlinePaymentCreateResponse> {
    const json = await tenantStudentFetch<OnlinePaymentCreateResponse>(
      "/student/wallet/online-recharge",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      },
    );
    return json;
  },

  async getOnlinePaymentStatus(reference: string): Promise<OnlinePaymentStatusResponse> {
    const json = await tenantStudentFetch<OnlinePaymentStatusResponse>(
      `/student/wallet/payments/${reference}`,
    );
    return json;
  },
};

export const rechargeCodesService = {
  async list(params?: {
    search?: string;
    inactive?: boolean;
    active_only?: boolean;
    per_page?: number;
  }) {
    const { data } = await api.get("/teacher/recharge-codes", { params });
    return data as {
      data: RechargeCodeRecord[];
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  },

  async get(id: number) {
    const { data } = await api.get<{ data: RechargeCodeRecord }>(
      `/teacher/recharge-codes/${id}`,
    );
    return data.data;
  },

  async create(payload: RechargeCodeInput) {
    const { data } = await api.post<{ data: RechargeCodeRecord }>(
      "/teacher/recharge-codes",
      payload,
    );
    return data.data;
  },

  async update(id: number, payload: Partial<RechargeCodeInput>) {
    const { data } = await api.put<{ data: RechargeCodeRecord }>(
      `/teacher/recharge-codes/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: number) {
    await api.delete(`/teacher/recharge-codes/${id}`);
  },

  async generate(payload: RechargeCodeGenerateInput) {
    const { data } = await api.post<{ data: RechargeCodeRecord | RechargeCodeRecord[] }>(
      "/teacher/recharge-codes/generate",
      payload,
    );
    return data.data;
  },

  async toggleStatus(id: number) {
    const { data } = await api.patch<{ data: RechargeCodeRecord }>(
      `/teacher/recharge-codes/${id}/status`,
    );
    return data.data;
  },
};
