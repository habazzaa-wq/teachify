import { tenantStudentFetch } from "@/services/api/tenant-student-fetch";
import type { StudentProfile, StudentProfileUpdateValues } from "../types";

const UPDATE_FIELD_MAP: Record<keyof StudentProfileUpdateValues, string> = {
  name: "name",
  parentPhone: "parent_phone",
  gender: "gender",
  studyType: "study_type",
  nationality: "nationality",
  studyLevel: "study_level",
  governorate: "governorate",
  city: "city",
};

export const studentProfileService = {
  async getProfile(): Promise<StudentProfile> {
    const json = await tenantStudentFetch<{ data: StudentProfile }>("/student/profile");
    return json.data;
  },

  async updateProfile(values: StudentProfileUpdateValues): Promise<StudentProfile> {
    const body: Record<string, string | null> = {};
    for (const [field, value] of Object.entries(values)) {
      if (value === undefined) continue;
      body[UPDATE_FIELD_MAP[field as keyof StudentProfileUpdateValues]] =
        typeof value === "string" ? value.trim() : null;
    }

    const json = await tenantStudentFetch<{ data: StudentProfile }>(
      "/student/profile",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
