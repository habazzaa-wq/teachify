"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { rechargeCodesService, walletService } from "./services";
import type {
  RechargeCodeGenerateInput,
  RechargeCodeInput,
} from "./types";

export const walletKeys = {
  all: ["wallet"] as const,
  wallet: () => [...walletKeys.all, "wallet"] as const,
  transactions: () => [...walletKeys.all, "transactions"] as const,
};

export const rechargeCodesKeys = {
  all: ["recharge-codes"] as const,
  list: (params?: Record<string, unknown>) => [
    ...rechargeCodesKeys.all,
    "list",
    params ?? {},
  ],
  detail: (id: number) => [...rechargeCodesKeys.all, "detail", id] as const,
};

export function useWallet(enabled = true) {
  return useQuery({
    queryKey: walletKeys.wallet(),
    queryFn: walletService.getWallet,
    enabled,
    staleTime: 30_000,
  });
}

export function useWalletTransactions(enabled = true) {
  return useQuery({
    queryKey: walletKeys.transactions(),
    queryFn: () => walletService.getTransactions({ per_page: 15 }),
    enabled,
    staleTime: 30_000,
  });
}

export function useRechargeWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => walletService.recharge(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useCreateOnlinePayment() {
  return useMutation({
    mutationFn: (amount: number) => walletService.createOnlinePayment(amount),
  });
}

export function useRechargeCodesList(params?: {
  search?: string;
  inactive?: boolean;
  active_only?: boolean;
  per_page?: number;
}) {
  return useQuery({
    queryKey: rechargeCodesKeys.list(params),
    queryFn: () => rechargeCodesService.list(params),
  });
}

export function useCreateRechargeCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RechargeCodeInput) => rechargeCodesService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rechargeCodesKeys.all });
      toast.success("تم إنشاء كود الشحن بنجاح");
    },
    onError: () => toast.error("تعذّر إنشاء كود الشحن"),
  });
}

export function useGenerateRechargeCodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RechargeCodeGenerateInput) =>
      rechargeCodesService.generate(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: rechargeCodesKeys.all });
      toast.success(
        `تم توليد ${vars.quantity && vars.quantity > 1 ? vars.quantity : 1} ${vars.quantity && vars.quantity > 1 ? "أكواد شحن" : "كود شحن"} بنجاح`,
      );
    },
    onError: () => toast.error("تعذّر توليد أكواد الشحن"),
  });
}

export function useUpdateRechargeCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RechargeCodeInput> }) =>
      rechargeCodesService.update(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: rechargeCodesKeys.all });
      qc.invalidateQueries({ queryKey: rechargeCodesKeys.detail(vars.id) });
      toast.success("تم تحديث كود الشحن بنجاح");
    },
    onError: () => toast.error("تعذّر تحديث كود الشحن"),
  });
}

export function useDeleteRechargeCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rechargeCodesService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rechargeCodesKeys.all });
      toast.success("تم حذف كود الشحن");
    },
    onError: () => toast.error("تعذّر حذف كود الشحن"),
  });
}

export function useToggleRechargeCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rechargeCodesService.toggleStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rechargeCodesKeys.all });
      toast.success("تم تحديث حالة كود الشحن");
    },
    onError: () => toast.error("تعذّر تحديث حالة كود الشحن"),
  });
}
