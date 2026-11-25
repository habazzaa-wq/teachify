import { tenantStudentFetch } from "@/services/api/tenant-student-fetch";
import type { StudentEditableProfileFields, StudentProfile } from "../types";

export const studentProfileService = {
  async getProfile(): Promise<StudentProfile> {
    const json = await tenantStudentFetch<{ data: StudentProfile }>("/student/profile");
    return json.data;
  },

  async updateProfile(values: StudentEditableProfileFields): Promise<StudentProfile> {
    const json = await tenantStudentFetch<{ data: StudentProfile }>(
      "/student/profile",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          gender: values.gender.trim() || null,
          nationality: values.nationality.trim() || null,
          study_level: values.studyLevel.trim() || null,
          governorate: values.governorate.trim() || null,
          city: values.city.trim() || null,
        }),
      },
    );
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
