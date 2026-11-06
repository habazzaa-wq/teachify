import api from "@/services/api/axios";
import { tenantStudentFetch } from "@/services/api/tenant-student-fetch";
import type { PaymentGatewaySettings, PaymentGatewayUpdateInput, PaymentProvider } from "../types";

export const paymentGatewayService = {
  async getSettings(): Promise<PaymentGatewaySettings> {
    const { data } = await api.get<{ data: PaymentGatewaySettings }>(
      "/teacher/payment-gateway",
    );
    return data.data;
  },

  async updateSettings(payload: PaymentGatewayUpdateInput) {
    const { data } = await api.put<{
      message: string;
      data: PaymentGatewaySettings;
    }>("/teacher/payment-gateway", payload);
    return data;
  },

  async getAvailableProviders(): Promise<PaymentProvider[]> {
    const json = await tenantStudentFetch<{ data: PaymentProvider[] }>("/public/payment-gateways");
    return json.data;
  },
};
