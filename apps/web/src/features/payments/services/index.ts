import api from "@/services/api/axios";
import type { PaymentGatewaySettings, PaymentGatewayUpdateInput } from "../types";

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
};
