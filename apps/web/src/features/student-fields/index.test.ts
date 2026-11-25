import { describe, expect, it } from "vitest";
import {
  DEFAULT_STUDENT_FIELDS,
  resolveStudentFieldConfig,
  STUDENT_FIELD_KEYS,
} from "@/features/student-fields";

const SAVED = {
  parent_phone: true,
  gender: true,
  study_type: true,
  study_level: false,
  nationality: true,
  governorate: false,
  city: true,
};

describe("resolveStudentFieldConfig", () => {
  it("keeps disabled fields off when given the unwrapped values object", () => {
    const form = resolveStudentFieldConfig(SAVED);

    expect(form.study_level).toBe(false);
    expect(form.governorate).toBe(false);
    expect(form.gender).toBe(true);
  });

  it("also accepts a full API response with a values wrapper", () => {
    const form = resolveStudentFieldConfig({
      group: "student_fields",
      values: SAVED,
    });

    expect(form.study_level).toBe(false);
    expect(form.governorate).toBe(false);
  });

  it("prefers the local draft over fetched data", () => {
    const draft = {
      ...DEFAULT_STUDENT_FIELDS,
      study_level: false,
    };

    expect(resolveStudentFieldConfig(SAVED, draft)).toEqual(draft);
  });

  it("falls back to defaults only for missing or non-boolean keys", () => {
    const form = resolveStudentFieldConfig({ study_level: false, gender: "yes" });

    expect(form.study_level).toBe(false);
    expect(form.gender).toBe(DEFAULT_STUDENT_FIELDS.gender);
    expect(Object.keys(form).sort()).toEqual([...STUDENT_FIELD_KEYS].sort());
  });
});
