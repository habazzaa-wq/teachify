/**
 * Optional student-account fields that a tenant admin can enable/disable for
 * their platform. Mandatory fields (name, email, phone, password) always stay.
 */
export const STUDENT_FIELD_KEYS = [
  "parent_phone",
  "gender",
  "study_type",
  "study_level",
  "nationality",
  "governorate",
  "city",
] as const;

export type StudentFieldKey = (typeof STUDENT_FIELD_KEYS)[number];
export type StudentFieldConfig = Record<StudentFieldKey, boolean>;

export const STUDENT_FIELD_LABELS: Record<StudentFieldKey, string> = {
  parent_phone: "رقم هاتف ولي الأمر",
  gender: "الجنس",
  study_type: "نوع الدراسة",
  study_level: "المرحلة الدراسية",
  nationality: "الجنسية",
  governorate: "المحافظة",
  city: "المدينة",
};

export const DEFAULT_STUDENT_FIELDS: StudentFieldConfig = {
  parent_phone: true,
  gender: true,
  study_type: true,
  study_level: true,
  nationality: true,
  governorate: true,
  city: true,
};

export function normalizeStudentFieldConfig(
  raw?: Partial<Record<StudentFieldKey, unknown>> | null,
): StudentFieldConfig {
  return STUDENT_FIELD_KEYS.reduce((acc, key) => {
    acc[key] = raw && typeof raw[key] === "boolean" ? raw[key] : DEFAULT_STUDENT_FIELDS[key];
    return acc;
  }, {} as StudentFieldConfig);
}

/**
 * Resolve the form values for the student-fields settings page.
 *
 * `useSettingsGroup` unwraps the API response to its `values` object, while
 * older callers may still hand over the full `{ group, values }` response.
 * Accept both shapes so a saved `false` is never replaced by the all-true
 * defaults — doing that silently re-enables fields the admin disabled.
 */
export function resolveStudentFieldConfig(
  source?: unknown,
  draft?: StudentFieldConfig | null,
): StudentFieldConfig {
  if (draft) return draft;

  const record =
    source && typeof source === "object" ? (source as Record<string, unknown>) : null;
  const nested = record?.values;
  const values =
    nested && typeof nested === "object"
      ? (nested as Partial<Record<StudentFieldKey, unknown>>)
      : (record as Partial<Record<StudentFieldKey, unknown>> | null);

  return normalizeStudentFieldConfig(values);
}

export const STUDY_TYPES = ["أونلاين", "اوفلاين"];

export const GENDER_OPTIONS = [
  { value: "ذكر", label: "ذكر" },
  { value: "أنثى", label: "أنثى" },
];

export const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحيرة", "المنوفية",
  "الغربية", "كفر الشيخ", "دمياط", "الشرقية", "الفيوم", "بني سويف",
  "المنيا", "أسيوط", "الوادي الجديد", "سوهاج", "قنا", "الأقصر",
  "أسوان", "البحر الأحمر", "الإسماعيلية", "السويس", "بورسعيد",
  "شمال سيناء", "جنوب سيناء", "مطروح",
];

export const CITIES_BY_GOVERNORATE: Record<string, string[]> = {
  "القاهرة": ["مدينة نصر", "المعادي", "شبرا", "مصر الجديدة", "الزمالك", "وسط البلد", "التجمع الخامس", "الشروق", "العبور"],
  "الجيزة": ["الهرم", "فيصل", "الدقي", "المهندسين", "أكتوبر", "السادس من أكتوبر", "الحي السابع"],
  "الإسكندرية": ["سيدي جابر", "المنشية", "العطاريد", "الرمل", "الجمرك", "المايسترو", "العجمي"],
  "السويس": ["الجناين", "الفيروز", "عتاقة"],
  "الدقهلية": ["المنصورة", "طلخا", "المحلة الكبيرة", "نبروه", "شربين"],
  "البحيرة": ["دمنهور", "كفر الدوار", "رشيد", "الرحمانية"],
  "المنوفية": ["شبين الكوم", "منوف", "السادات", "أشمون"],
  "الغربية": ["المحلة الكبيرة", "زفتى", "طنطا", "السنبلاوين", "كفر الزيات"],
  "كفر الشيخ": ["كفر الشيخ", "دسوق", "بيلا", "الحامول", "فوه"],
  "دمياط": ["دمياط", "فارسكور", "الزرقا", "كفر سعد", "رأس البر"],
  "الفيوم": ["الفيوم", "سنورس", "طامية", "إبشواي"],
  "الشرقية": ["الزقازيق", "العاشر من رمضان", "بلبيس", "منيا القمح", "أبو حماد"],
  "بني سويف": ["بني سويف", "الواسطى", "ناصر", "إهناسيا", "ببا"],
  "المنيا": ["المنيا", "ملوي", "سمالوط", "أبوقرقاص", "العدوة"],
  "أسيوط": ["أسيوط", "القوصية", "الغنايم", "أبو تيج", "طموه"],
  "الوادي الجديد": ["الخارجة", "الداخلة", "بلاط", "فرافرة"],
  "سوهاج": ["سوهاج", "جراجة", "طهطا", "البلينا"],
  "قنا": ["قنا", "دشنا", "فرشوط", "أبو تشت"],
  "الأقصر": ["الأقصر", "إسنا", "طيبة"],
  "أسوان": ["أسوان", "كوم أمبو", "دراو", "نصر النوبة", "إدفو"],
  "البحر الأحمر": ["الغردقة", "سفاجا", "القصير", "مرسى علم"],
  "الإسماعيلية": ["الإسماعيلية", "القنطرة شرق", "القنطرة غرب", "فايد"],
  "بورسعيد": ["بورسعيد", "العرب"],
  "شمال سيناء": ["العريش", "رفح", "الشيخ زويد"],
  "جنوب سيناء": ["الطور", "رأس سدر", "سانت كاترين", "دهب", "طابا"],
  "مطروح": ["مطروح", "الحمام", "العلمين", "سلوم"],
};
