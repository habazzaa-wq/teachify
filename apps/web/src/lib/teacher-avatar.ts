export type TeacherGender = string | null | undefined;

const MALE_GENDERS = new Set(["male", "m", "ذكر", "ذكر "]);
const FEMALE_GENDERS = new Set(["female", "f", "أنثى", "انثى", "أنثى ", "انثى "]);

export function normalizeTeacherGender(gender: TeacherGender): "male" | "female" | null {
  const value = String(gender ?? "").trim().toLowerCase();
  if (!value) return null;
  if (FEMALE_GENDERS.has(value)) return "female";
  if (MALE_GENDERS.has(value)) return "male";
  return null;
}

export function getDefaultTeacherAvatar(gender?: TeacherGender): string {
  const normalized = normalizeTeacherGender(gender);
  if (normalized === "female") return "/images/avatars/teacher-female.jpg";
  return "/images/avatars/teacher-male.jpg";
}

export function getTeacherAvatar(avatar?: string | null, gender?: TeacherGender): string {
  const value = String(avatar ?? "").trim();
  if (value) return value;
  return getDefaultTeacherAvatar(gender);
}