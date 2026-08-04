import { tenantStudentFetch } from "@/services/api/tenant-student-fetch";
import type { StudentProfile } from "../types";

export const studentProfileService = {
  async getProfile(): Promise<StudentProfile> {
    const json = await tenantStudentFetch<{ data: StudentProfile }>("/student/profile");
    return json.data;
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const form = new FormData();
    form.append("avatar", file);

    const json = await tenantStudentFetch<{ data: { avatar: string } }>(
      "/student/profile/avatar",
      { method: "POST", body: form },
    );

    return json.data;
  },
};
