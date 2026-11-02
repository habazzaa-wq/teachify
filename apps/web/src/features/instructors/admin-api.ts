import { api } from "@/services/api";

export interface ManagedInstructor {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  status: string;
  courses: Array<{ id: number; title: string; status: string }>;
}

export interface AssignableInstructor {
  id: number;
  name: string;
  avatar: string | null;
  status: string;
}

export type InstructorRemovalStrategy =
  | "delete_content"
  | "transfer_to_instructor"
  | "transfer_to_tenant";

interface InstructorListResponse {
  data: ManagedInstructor[];
}

interface CreateInstructorResponse {
  data: ManagedInstructor;
  temporary_password: string;
}

export const instructorAdminApi = {
  async list(): Promise<ManagedInstructor[]> {
    const response = await api.get<InstructorListResponse>("/instructors");
    return response.data.data;
  },

  async options(): Promise<AssignableInstructor[]> {
    const response = await api.get<{ data: AssignableInstructor[] }>("/instructors/options");
    return response.data.data;
  },

  async create(payload: { name: string; email: string }): Promise<CreateInstructorResponse> {
    const response = await api.post<CreateInstructorResponse>("/instructors", payload);
    return response.data;
  },

  async updateStatus(id: number, status: "active" | "suspended"): Promise<void> {
    await api.patch(`/instructors/${id}/status`, { status });
  },

  async resetPassword(id: number): Promise<string> {
    const response = await api.post<{ temporary_password: string }>(`/instructors/${id}/reset-password`);
    return response.data.temporary_password;
  },

  async remove(
    id: number,
    payload: { strategy: InstructorRemovalStrategy; target_instructor_id?: number },
  ): Promise<void> {
    await api.delete(`/instructors/${id}`, { data: payload });
  },
};
