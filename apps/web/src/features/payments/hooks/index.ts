"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError } from "@/types/common.types";
import { paymentGatewayService } from "../services";
import type { PaymentGatewayUpdateInput } from "../types";

export const paymentGatewayKeys = {
  all: ["payment-gateway"] as const,
  settings: () => [...paymentGatewayKeys.all, "settings"] as const,
};

export function usePaymentGatewaySettings() {
  return useQuery({
    queryKey: paymentGatewayKeys.settings(),
    queryFn: paymentGatewayService.getSettings,
    staleTime: 60_000,
  });
}

export function useAvailablePaymentGateways(enabled = true) {
  return useQuery({
    queryKey: [...paymentGatewayKeys.all, "available"],
    queryFn: paymentGatewayService.getAvailableProviders,
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdatePaymentGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentGatewayUpdateInput) =>
      paymentGatewayService.updateSettings(payload),
    onSuccess: (res) => {
      qc.setQueryData(paymentGatewayKeys.settings(), res.data);
      qc.invalidateQueries({ queryKey: [...paymentGatewayKeys.all, "available"] });
      toast.success(res.message ?? "تم حفظ الإعدادات بنجاح");
    },
    onError: (error) => {
      const validationMessage = isApiError(error)
        ? Object.values(error.fieldErrors).flat()[0]
        : undefined;
      toast.error(validationMessage ?? (isApiError(error) ? error.message : "تعذّر حفظ إعدادات بوابة الدفع"));
    },
  });
}
