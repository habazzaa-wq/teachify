export interface StageItem {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  link: string | null;
}

export interface EducationalStagesSectionSettings {
  titleLead: string;
  titleEmphasis: string;
}

export const DEFAULT_EDUCATIONAL_STAGES_SECTION: EducationalStagesSectionSettings = {
  titleLead: "المراحل",
  titleEmphasis: "الدراسية",
};

export function mergeEducationalStagesSection(
  saved?: Partial<EducationalStagesSectionSettings> | null,
): EducationalStagesSectionSettings {
  return {
    titleLead:
      typeof saved?.titleLead === "string" && saved.titleLead.trim()
        ? saved.titleLead
        : DEFAULT_EDUCATIONAL_STAGES_SECTION.titleLead,
    titleEmphasis:
      typeof saved?.titleEmphasis === "string" && saved.titleEmphasis.trim()
        ? saved.titleEmphasis
        : DEFAULT_EDUCATIONAL_STAGES_SECTION.titleEmphasis,
  };
}

export interface PublicStagesResponse {
  items: StageItem[];
  section?: Partial<EducationalStagesSectionSettings> | null;
}

export interface StageStats {
  coursesCount: number;
  teachersCount: number;
}

export interface StageStatsItem extends StageStats {
  id: number;
}

export interface PublicStagesStatsResponse {
  items: StageStatsItem[];
}

export interface EducationalStageRecord {
  id: number;
  tenant_id: number;
  created_by_tenant_user_id: number | null;
  name: string;
  description: string | null;
  image: string | null;
  link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EducationalStageInput {
  name: string;
  description?: string | null;
  image?: string | null;
  link?: string | null;
  is_active?: boolean;
  sort_order?: number;
}
