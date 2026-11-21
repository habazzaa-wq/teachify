import { api } from "@/services/api/axios";
import type { ServiceInstructor, ServicePayload, ServiceRecord } from "./types";

export const tenantServicesApi = {
  async list(): Promise<ServiceRecord[]> {
    const { data } = await api.get<{ services?: ServiceRecord[] }>("/services");
    return data.services ?? [];
  },

  async instructors(): Promise<ServiceInstructor[]> {
    const { data } = await api.get<{ instructors?: ServiceInstructor[] }>(
      "/services/instructors",
    );
    return data.instructors ?? [];
  },

  async create(payload: ServicePayload): Promise<ServiceRecord> {
    const { data } = await api.post<{ service: ServiceRecord }>(
      "/services",
      payload,
    );
    return data.service;
  },

  async update(id: number, payload: ServicePayload): Promise<ServiceRecord> {
    const { data } = await api.put<{ service: ServiceRecord }>(
      `/services/${id}`,
      payload,
    );
    return data.service;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/services/${id}`);
  },
};
