"use client";

import { HomeCommunitySection } from "@/features/community/components/community-section/HomeCommunitySection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { mergeCommunitySettings } from "../types";
import { usePublicCommunitySection } from "../hooks";
import { CommunitySectionRenderer } from "./CommunitySectionRenderer";

/**
 * Compact fallback so an unexpected render error in the community section is
 * contained here instead of taking down the entire homepage.
 */
function SectionErrorFallback({ reset }: { error: Error; reset: () => void }) {
  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden bg-background py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-muted-foreground">
          تعذّر عرض هذا القسم حاليًا.
        </p>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-bold text-primary underline decoration-dotted underline-offset-4 hover:opacity-80"
        >
          إعادة المحاولة
        </button>
      </div>
    </section>
  );
}

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

  return (
    <ErrorBoundary fallback={SectionErrorFallback}>
      <CommunitySectionRenderer settings={mergeCommunitySettings(data)} />
    </ErrorBoundary>
  );
}
