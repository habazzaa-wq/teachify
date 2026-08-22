"use client";

import { HomeCommunitySection } from "@/features/community/components/community-section/HomeCommunitySection";
import { mergeCommunitySettings } from "../types";
import { usePublicCommunitySection } from "../hooks";
import { CommunitySectionRenderer } from "./CommunitySectionRenderer";

/**
 * Public homepage "منتدى الطلاب" section.
 *
 * When the teacher has configured a design + content via the dashboard it renders
 * the chosen dynamic design; otherwise it falls back to the original
 * HomeCommunitySection so existing behaviour is preserved.
 */
export function PublicCommunitySection() {
  const { data, isLoading } = usePublicCommunitySection();

  if (isLoading) {
    // Keep the legacy section visible during the brief fetch to avoid layout shift.
    return <HomeCommunitySection />;
  }

  if (!data || data.isActive === false) {
    return <HomeCommunitySection />;
  }

  return <CommunitySectionRenderer settings={mergeCommunitySettings(data)} />;
}
