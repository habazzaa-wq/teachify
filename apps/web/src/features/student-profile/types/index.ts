export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  parentPhone: string;
  gender: string;
  studyType: string;
  nationality: string;
  studyLevel: string;
  governorate: string;
  city: string;
  avatar: string | null;
  status: string;
  joinedAt: string | null;
  createdAt: string;
}

/** Fields a student is allowed to edit from the profile drawer. */
export type StudentEditableProfileFields = Pick<
  StudentProfile,
  | "name"
  | "parentPhone"
  | "gender"
  | "studyType"
  | "nationality"
  | "studyLevel"
  | "governorate"
  | "city"
>;

/** Partial profile update; empty values are sent as null to clear a field. */
export type StudentProfileUpdateValues = Partial<
  Record<keyof StudentEditableProfileFields, string | null>
>;
