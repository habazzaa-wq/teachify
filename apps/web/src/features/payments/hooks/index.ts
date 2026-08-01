"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

export function useUpdatePaymentGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentGatewayUpdateInput) =>
      paymentGatewayService.updateSettings(payload),
    onSuccess: (res) => {
      qc.setQueryData(paymentGatewayKeys.settings(), res.data);
      toast.success(res.message ?? "تم حفظ الإعدادات بنجاح");
    },
    onError: () => toast.error("تعذّر حفظ إعدادات بوابة الدفع"),
  });
}
