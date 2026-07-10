import platformApi from "@/services/api/platform-axios";
import type {
  BunnyRevealResult,
  BunnySettings,
  BunnyVerifyResult,
} from "../types";

interface BunnyMutationResponse {
  message: string;
  settings: BunnySettings;
}

export const bunnySettingsService = {
  async get(): Promise<{ settings: BunnySettings }> {
    const { data } = await platformApi.get<{ settings: BunnySettings }>(
      "/bunny-settings",
    );
    return data;
  },

  async update(payload: Record<string, unknown>): Promise<BunnyMutationResponse> {
    const { data } = await platformApi.put<BunnyMutationResponse>(
      "/bunny-settings",
      payload,
    );
    return data;
  },

  async verify(payload: Record<string, unknown>): Promise<BunnyVerifyResult> {
    const { data } = await platformApi.post<BunnyVerifyResult>(
      "/bunny-settings/verify",
      payload,
    );
    return data;
  },

  async health(): Promise<BunnyVerifyResult> {
    const { data } = await platformApi.get<BunnyVerifyResult>(
      "/bunny-settings/health",
    );
    return data;
  },

  async rotate(payload: Record<string, unknown>): Promise<BunnyMutationResponse> {
    const { data } = await platformApi.post<BunnyMutationResponse>(
      "/bunny-settings/rotate-secrets",
      payload,
    );
    return data;
  },

  async reveal(field: string): Promise<BunnyRevealResult> {
    const { data } = await platformApi.post<BunnyRevealResult>(
      "/bunny-settings/reveal",
      { field, confirm: true },
    );
    return data;
  },

  async disable(): Promise<BunnyMutationResponse> {
    const { data } = await platformApi.post<BunnyMutationResponse>(
      "/bunny-settings/disable",
    );
    return data;
  },

  async reset(): Promise<BunnyMutationResponse> {
    const { data } = await platformApi.post<BunnyMutationResponse>(
      "/bunny-settings/reset",
    );
    return data;
  },

  async deleteCredentials(): Promise<BunnyMutationResponse> {
    const { data } = await platformApi.delete<BunnyMutationResponse>(
      "/bunny-settings/credentials",
    );
    return data;
  },
};
