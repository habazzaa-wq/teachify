"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError } from "@/types/common.types";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { paymentGatewayService } from "../services";
import type { PaymentGatewayUpdateInput } from "../types";

/**
 * Gateway providers/settings are tenant-scoped. Include the active tenant id
 * in the cache key so switching tenants (or sessions) never reuses another
 * academy's provider list or masked credentials.
 */
export const paymentGatewayKeys = {
  all: ["payment-gateway"] as const,
  settings: (tenantTag: string = "no-tenant") =>
    [...paymentGatewayKeys.all, "settings", tenantTag] as const,
  available: (tenantTag: string = "no-tenant") =>
    [...paymentGatewayKeys.all, "available", tenantTag] as const,
};

export function usePaymentGatewaySettings() {
  const { tenant } = useActiveTenant();
  const tenantTag = tenant?.id != null ? String(tenant.id) : "no-tenant";
  return useQuery({
    queryKey: paymentGatewayKeys.settings(tenantTag),
    queryFn: paymentGatewayService.getSettings,
    staleTime: 60_000,
  });
}

export function useAvailablePaymentGateways(enabled = true) {
  const { tenant } = useActiveTenant();
  const tenantTag = tenant?.id != null ? String(tenant.id) : "no-tenant";
  return useQuery({
    queryKey: paymentGatewayKeys.available(tenantTag),
    queryFn: paymentGatewayService.getAvailableProviders,
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdatePaymentGateway() {
  const qc = useQueryClient();
  const { tenant } = useActiveTenant();
  const tenantTag = tenant?.id != null ? String(tenant.id) : "no-tenant";
  return useMutation({
    mutationFn: (payload: PaymentGatewayUpdateInput) =>
      paymentGatewayService.updateSettings(payload),
    onSuccess: (res) => {
      qc.setQueryData(paymentGatewayKeys.settings(tenantTag), res.data);
      qc.invalidateQueries({ queryKey: paymentGatewayKeys.available(tenantTag) });
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
