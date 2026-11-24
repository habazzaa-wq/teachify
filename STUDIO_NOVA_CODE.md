# Studio Nova - complete working-tree code bundle

Generated from the local working tree. Every file below is included in full.
The Studio Nova design block in `globals.css` starts at the `Studio Nova` comment.
Dashboard colors now come from `مظهر لوحة التحكم` via `BrandThemeProvider`/`BrandThemeSSR`.

## Files

- `apps/web/src/app/(dashboard)/teacher/courses/[courseId]/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/layout/TenantDashboardLayout.tsx`
- `apps/web/src/lib/brand-theme.ts`
- `apps/web/src/components/layout/BrandThemeProvider.tsx`
- `apps/web/src/components/layout/BrandThemeSSR.tsx`
- `apps/web/src/components/layout/WorkspaceLeftSidebar.tsx`
- `apps/web/src/features/instructors/InstructorWorkspaceLayout.tsx`
- `apps/web/src/features/course-studio/components/CourseStudio.tsx`
- `apps/web/src/features/course-studio/components/CourseStudioCanvas.tsx`
- `apps/web/src/features/course-studio/components/CourseStudioHeader.tsx`
- `apps/web/src/features/course-studio/components/CourseStudioNavigator.tsx`
- `apps/web/src/features/course-studio/components/CourseStudioInspector.tsx`
- `apps/web/src/features/course-studio/components/CourseStudioLectureOverview.tsx`
- `apps/web/src/features/course-studio/components/CourseStudioSectionOverview.tsx`
- `apps/web/src/features/course-studio/components/CourseStudioContentOverview.tsx`
- `apps/web/src/features/course-studio/components/CourseStudioContentList.tsx`
- `apps/web/src/features/course-studio/components/CourseStudioContentItem.tsx`

---

## `apps/web/src/app/(dashboard)/teacher/courses/[courseId]/page.tsx`

```tsx
﻿"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpen, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { CourseStudio } from "@/features/course-studio";
import { CourseInstructorAssignments } from "@/features/courses/components/CourseInstructorAssignments";
import { CourseSessionsPanel } from "@/features/course-sessions/components/CourseSessionsPanel";
import { useCourse, usePublishCourse } from "@/features/courses/hooks";
import { cn } from "@/lib/cn";

function CourseWorkspacePage() {
  const params = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(params?.courseId ?? null);
  const publishCourse = usePublishCourse();
  const [activeTab, setActiveTab] = useState<"content" | "sessions">("content");

  const handlePublish = useCallback(() => {
    if (!course) return;
    publishCourse.mutate(course.id, {
      onSuccess: () => toast.success(`تم نشر "${course.title}" بنجاح`),
      onError: () => toast.error("فشل نشر الدورة"),
    });
  }, [course, publishCourse]);

  if (isLoading) {
    return <CourseStudio mode="loading" />;
  }

  if (!course) {
    return <CourseStudio mode="empty" courseName="دورة غير موجودة" />;
  }

  const hasSessions = course.deliveryMode === "sessions_only" || course.deliveryMode === "recorded_and_sessions" || course.deliveryMode === "blended";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="nova-tabs flex shrink-0 items-end gap-1 overflow-x-auto px-2 pt-2 sm:px-4" role="tablist" aria-label="أقسام الدورة">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          role="tab"
          aria-selected={activeTab === "content"}
          className={cn("nova-tab", activeTab === "content" && "is-active")}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          المحتوى التعليمي
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          role="tab"
          aria-selected={activeTab === "sessions"}
          className={cn("nova-tab", activeTab === "sessions" && "is-active")}
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          الجلسات
          {hasSessions && (
            <span className="rounded-full bg-studio-accent-soft px-2 py-0.5 text-[10px] font-bold text-studio-accent">
              مفعّل
            </span>
          )}
        </button>
      </div>

      {activeTab === "content" ? (
        <>
          <div className="h-[calc(100dvh-11rem)] min-h-[32rem] overflow-hidden rounded-[28px] border border-white/80 bg-white/40 shadow-xl shadow-studio-fg/5 backdrop-blur-sm md:h-[calc(100dvh-12rem)] md:min-h-0">
            <CourseStudio
              mode="ready"
              courseId={course.id}
              courseName={course.title}
              courseStatus={course.status}
              courseVisibility={course.visibility}
              studentsCount={course.studentsCount}
              isSaved
              onPublish={course.status !== "published" ? handlePublish : undefined}
            />
          </div>
          <CourseInstructorAssignments course={course} />
        </>
      ) : (
        <div className="flex-1 rounded-b-2xl border-x border-b border-studio-border bg-studio-surface shadow-sm">
          <div className="p-4 sm:p-6">
            <CourseSessionsPanel courseId={course.id} />
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseWorkspacePage;
```

---

## `apps/web/src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html.theme-initializing,
html.theme-initializing *,
html.theme-initializing *::before,
html.theme-initializing *::after {
  transition: none !important;
}

.hero-backdrop {
  background: radial-gradient(ellipse at 50% 30%, #faf8f5 0%, #f7f4ef 40%, #f3efe8 80%, #efeae1 100%);
}

.dark .hero-backdrop {
  background: radial-gradient(ellipse at 50% 30%, #121418 0%, #14161a 40%, #16181d 80%, #181a1f 100%);
}

.hero-decoration {
  opacity: 0.35;
}

.dark .hero-decoration {
  opacity: 0.18;
}

.hero-symbol {
  color: rgba(140, 110, 80, 0.22);
}

.dark .hero-symbol {
  color: rgba(200, 170, 140, 0.15);
}

.hero-background-line-primary {
  stroke: rgba(160, 130, 100, 0.28);
}

.dark .hero-background-line-primary {
  stroke: rgba(200, 170, 140, 0.1);
}

.hero-background-line-secondary {
  stroke: rgba(160, 130, 100, 0.2);
}

.dark .hero-background-line-secondary {
  stroke: rgba(200, 170, 140, 0.06);
}

.hero-star {
  opacity: 0.32;
}

.hero-plus {
  opacity: 0.22;
}

.dark .hero-plus {
  opacity: 0.12;
}

.hero-badge-pill {
  border-color: rgb(255 255 255 / 50%);
  background-color: rgb(255 255 255 / 80%);
  box-shadow: 0 8px 32px rgb(0 0 0 / 18%), inset 0 1px 0 rgb(255 255 255 / 80%);
}

.dark .hero-badge-pill {
  border-color: rgb(255 255 255 / 10%);
  background-color: rgb(255 255 255 / 10%);
  box-shadow: 0 8px 32px rgb(0 0 0 / 30%), inset 0 1px 0 rgb(255 255 255 / 5%);
}

@layer base {
  :root {
    --background: 42 20% 96%;
    --foreground: 225 25% 12%;

    --card: 0 0% 100%;
    --card-foreground: 225 25% 12%;

    --popover: 0 0% 100%;
    --popover-foreground: 225 25% 12%;

    --primary: 230 65% 50%;
    --primary-foreground: 210 40% 98%;

    --secondary: 250 10% 92%;
    --secondary-foreground: 225 25% 20%;

    --muted: 42 15% 92%;
    --muted-foreground: 220 10% 48%;

    --accent: 250 14% 90%;
    --accent-foreground: 225 25% 12%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 210 40% 98%;

    --success: 160 84% 39%;
    --success-foreground: 210 40% 98%;

    --warning: 35 92% 50%;
    --warning-foreground: 225 25% 12%;

    --border: 42 12% 85%;
    --input: 42 12% 85%;
    --ring: 230 65% 50%;

    --sidebar: 42 15% 94%;
    --sidebar-foreground: 225 25% 12%;
    --sidebar-accent: 42 12% 88%;
    --sidebar-accent-foreground: 225 25% 12%;
    --sidebar-soft: 42 14% 90%;
    --sidebar-fg-muted: 225 12% 45%;
    --sidebar-fg-subtle: 225 10% 60%;
    --sidebar-border: 42 10% 84%;
    --sidebar-ring: 230 65% 50%;

    --radius: 0.75rem;

    /* ───────── Brand colors (site primary + secondary) ─────────
       Dynamic: overridden at runtime by the tenant's branding settings via
       BrandThemeProvider. These values are the platform fallback. */
    --brand-primary: #D87B63;
    --brand-secondary: #FFB50E;
    --brand-primary-contrast: #ffffff;
    --brand-secondary-contrast: #17130d;

    /* Derived brand scale (light) — kept in sync with generateBrandScale().
       These are only the no-JS / pre-hydration fallback; BrandThemeProvider
       recomputes them from the tenant's live colors at runtime. */
    --brand-primary-50: #fbf2ef;
    --brand-primary-100: #f7e5e0;
    --brand-primary-200: #f0cdc4;
    --brand-primary-300: #e8b2a5;
    --brand-primary-400: #e09582;
    --brand-primary-500: #d87b63;
    --brand-primary-600: #be6c57;
    --brand-primary-700: #a45d4b;
    --brand-primary-800: #884d3e;
    --brand-primary-900: #6c3d31;
    --brand-secondary-50: #fff8e7;
    --brand-secondary-100: #fff0cf;
    --brand-secondary-200: #ffe3a3;
    --brand-secondary-300: #ffd473;
    --brand-secondary-400: #ffc43e;
    --brand-secondary-500: #ffb50e;
    --brand-secondary-600: #e09f0c;
    --brand-secondary-700: #c28a0b;
    --brand-secondary-800: #a17209;
    --brand-secondary-900: #805b07;
    --brand-primary-soft: #f7ddd4;
    --brand-secondary-soft: #fff0cf;
    --brand-primary-deep: #986247;
    --brand-secondary-deep: #e0a10c;
    --brand-neutral: #fbf7f3;
    --brand-gradient: linear-gradient(135deg, #d87b63, #ffb50e);

    /* ───────── "Split Profile" Educational Stages section tokens ─────────
       Follow the stage-section design spec. Tints/deeps are derived once with
       `color-mix` from the live brand colors (updated from the admin dashboard
       via BrandThemeProvider) so they re-skin automatically. They source from
       `--brand-primary`/`--brand-secondary` rather than the bare `--primary`/
       `--secondary` shadcn tokens, which the `.dark` block redefines as HSL for
       the dashboard — keeping these section tokens always-valid brand hexes.
       `--ink`/`--paper` are fixed warm neutrals (non-brand). */
    --primary-tint: color-mix(in srgb, var(--brand-primary) 12%, white);
    --primary-deep: color-mix(in srgb, var(--brand-primary) 100%, black 20%);
    --secondary-tint: color-mix(in srgb, var(--brand-secondary) 12%, white);
    --secondary-deep: color-mix(in srgb, var(--brand-secondary) 100%, black 20%);
    /* Mode-swapped logical pair: `--ink`/`--paper` hold the active theme's
       text/background; `.dark` repoints them to the dark values below. */
    --ink: #241c1a;
    --paper: #fbf7f2;
    --paper-dark: #1c1614;
    --ink-dark: #f3ece6;

    --chart-1: 230 65% 50%;
    --chart-2: 160 84% 39%;
    --chart-3: 35 92% 50%;
    --chart-4: 190 80% 50%;
    --chart-5: 280 65% 60%;

    --emerald: 160 84% 39%;
    --emerald-foreground: 210 40% 98%;
    --blue: 230 65% 50%;
    --blue-foreground: 210 40% 98%;
    --amber: 35 92% 50%;
    --amber-foreground: 225 25% 12%;
    --purple: 280 65% 60%;
    --purple-foreground: 210 40% 98%;

    --header-height: 4rem;
    --sidebar-width: 16rem;
    --sidebar-collapsed-width: 4.25rem;

    --studio-bg: 42 20% 96%;
    --studio-surface: 40 25% 98%;
    --studio-soft: 42 18% 92%;
    --studio-border: 42 15% 86%;
    --studio-muted: 42 12% 91%;
    --studio-fg: 25 15% 15%;
    --studio-fg-muted: 30 8% 58%;
    --studio-fg-subtle: 30 6% 72%;
    --studio-accent: 180 25% 39%;
    --studio-accent-fg: 0 0% 100%;
    --studio-accent-soft: 180 20% 92%;
    --studio-accent-border: 180 25% 75%;
    --studio-ring: 180 25% 39%;
    --studio-secondary: 220 12% 88%;
    --studio-secondary-soft: 220 16% 94%;
    --studio-secondary-border: 220 14% 86%;
    --studio-sidebar-hover: 220 16% 94%;
    --studio-glass: 40 25% 98% / 0.6;
    --studio-glass-border: 42 15% 86% / 0.5;
    --studio-glass-toolbar: 40 25% 98% / 0.7;
    --studio-glass-sidebar: 42 18% 92% / 0.8;
    --studio-glass-dialog: 40 25% 98% / 0.85;
    --studio-glass-floating: 40 25% 98% / 0.9;
    --studio-overlay: 0 0% 0% / 0.25;
    --studio-skeleton: 42 15% 88%;
    --studio-skeleton-shine: 42 20% 94%;
    --studio-info: 210 60% 50%;
    --studio-success: 160 60% 40%;
    --studio-warning: 35 85% 50%;
    --studio-danger: 0 65% 50%;
  }

  .dark {
    --background: 225 30% 8%;
    --foreground: 210 40% 96%;

    /* Derived brand scale (dark) — fallback; BrandThemeProvider overrides. */
    --brand-primary-50: #301b16;
    --brand-primary-100: #492a22;
    --brand-primary-200: #683b30;
    --brand-primary-300: #824a3b;
    --brand-primary-400: #a45d4b;
    --brand-primary-500: #d87b63;
    --brand-primary-600: #dc8873;
    --brand-primary-700: #e09582;
    --brand-primary-800: #e5a595;
    --brand-primary-900: #eab8ab;
    --brand-secondary-50: #382803;
    --brand-secondary-100: #573e05;
    --brand-secondary-200: #7a5707;
    --brand-secondary-300: #996d08;
    --brand-secondary-400: #c28a0b;
    --brand-secondary-500: #ffb50e;
    --brand-secondary-600: #ffbc26;
    --brand-secondary-700: #ffc43e;
    --brand-secondary-800: #ffcd5b;
    --brand-secondary-900: #ffd77d;
    --brand-primary-soft: #1c130f;
    --brand-secondary-soft: #1c1605;
    --brand-primary-deep: #e7a08f;
    --brand-secondary-deep: #ffc43e;
    --brand-neutral: #0e0e12;
    --brand-gradient: linear-gradient(135deg, #d87b63, #ffb50e);

    /* "Split Profile" section tokens — dark: tints deepen/destaurate against
       the dark paper; deeps lift toward white for legible accents. */
    --primary-tint: color-mix(in srgb, var(--brand-primary) 14%, var(--paper-dark));
    --primary-deep: color-mix(in srgb, var(--brand-primary) 100%, white 20%);
    --secondary-tint: color-mix(in srgb, var(--brand-secondary) 14%, var(--paper-dark));
    --secondary-deep: color-mix(in srgb, var(--brand-secondary) 100%, white 20%);
    /* Swap the ink/paper logical pair for dark mode. */
    --ink: var(--ink-dark);
    --paper: var(--paper-dark);

    --card: 225 25% 11%;
    --card-foreground: 210 40% 96%;

    --popover: 225 25% 11%;
    --popover-foreground: 210 40% 96%;

    --primary: 230 65% 55%;
    --primary-foreground: 225 30% 8%;

    --secondary: 225 20% 16%;
    --secondary-foreground: 210 40% 90%;

    --muted: 225 15% 18%;
    --muted-foreground: 220 10% 62%;

    --accent: 230 25% 18%;
    --accent-foreground: 210 40% 96%;

    --destructive: 0 70% 50%;
    --destructive-foreground: 210 40% 96%;

    --success: 160 70% 42%;
    --success-foreground: 225 30% 8%;

    --warning: 35 90% 50%;
    --warning-foreground: 225 30% 8%;

    --border: 225 15% 20%;
    --input: 225 15% 20%;
    --ring: 230 65% 55%;

    --sidebar: 225 30% 9%;
    --sidebar-foreground: 210 40% 94%;
    --sidebar-accent: 225 20% 15%;
    --sidebar-accent-foreground: 210 40% 98%;
    --sidebar-soft: 225 24% 13%;
    --sidebar-fg-muted: 215 14% 65%;
    --sidebar-fg-subtle: 215 12% 50%;
    --sidebar-border: 225 15% 17%;
    --sidebar-ring: 230 65% 55%;

    --chart-1: 230 65% 55%;
    --chart-2: 160 70% 42%;
    --chart-3: 35 90% 50%;
    --chart-4: 190 75% 45%;
    --chart-5: 280 65% 65%;

    --emerald: 160 70% 42%;
    --emerald-foreground: 225 30% 8%;
    --blue: 230 65% 55%;
    --blue-foreground: 225 30% 8%;
    --amber: 35 90% 50%;
    --amber-foreground: 225 30% 8%;
    --purple: 280 65% 65%;
    --purple-foreground: 225 30% 8%;

    --studio-bg: 0 0% 10%;
    --studio-surface: 0 0% 13%;
    --studio-soft: 0 0% 16%;
    --studio-border: 0 0% 19%;
    --studio-muted: 0 0% 14%;
    --studio-fg: 30 8% 88%;
    --studio-fg-muted: 30 3% 52%;
    --studio-fg-subtle: 30 3% 38%;
    --studio-accent: 180 25% 45%;
    --studio-accent-fg: 0 0% 10%;
    --studio-accent-soft: 180 20% 12%;
    --studio-accent-border: 180 25% 30%;
    --studio-ring: 180 25% 45%;
    --studio-secondary: 220 12% 24%;
    --studio-secondary-soft: 0 0% 18%;
    --studio-secondary-border: 0 0% 26%;
    --studio-sidebar-hover: 0 0% 18%;
    --studio-glass: 0 0% 13% / 0.6;
    --studio-glass-border: 0 0% 19% / 0.5;
    --studio-glass-toolbar: 220 25% 18% / 1;
    --studio-glass-toolbar-fg: 0 0% 100%;
    --studio-glass-toolbar-fg-muted: 0 0% 80%;
    --studio-glass-toolbar-border: 0 0% 100% / 0.18;
    --studio-glass-toolbar-soft: 0 0% 100% / 0.1;
    --studio-glass-toolbar-soft-hover: 0 0% 100% / 0.18;
    --studio-navbar: 220 25% 18%;
    --studio-navbar-contrast: 0 0% 100%;
    --studio-glass-sidebar: 0 0% 12% / 0.8;
    --studio-glass-dialog: 0 0% 13% / 0.85;
    --studio-glass-floating: 0 0% 13% / 0.9;
    --studio-overlay: 0 0% 0% / 0.5;
    --studio-skeleton: 0 0% 16%;
    --studio-skeleton-shine: 0 0% 20%;
    --studio-info: 210 60% 55%;
    --studio-success: 160 60% 45%;
    --studio-warning: 35 85% 55%;
    --studio-danger: 0 65% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    @apply scroll-smooth;
    /* Prevent any element wider than the viewport (e.g. a stray absolutely
       positioned decoration) from creating page-wide horizontal scroll on
       mobile. Internal carousels keep scrolling because they are their own
       `overflow-x-auto` containers, unaffected by this guard. */
    overflow-x: hidden;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
    overflow-x: hidden;
  }

  [dir="rtl"] {
    text-align: right;
  }

  ::selection {
    @apply bg-primary/20 text-foreground;
  }

  :focus-visible {
    @apply outline-2 outline-offset-2 outline-ring/50;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}

@layer components {
  .text-display {
    @apply text-4xl font-bold tracking-tight sm:text-5xl;
  }

  .text-h1 {
    @apply text-3xl font-bold tracking-tight sm:text-4xl;
  }

  .text-h2 {
    @apply text-2xl font-bold tracking-tight sm:text-3xl;
  }

  .text-h3 {
    @apply text-xl font-semibold tracking-tight sm:text-2xl;
  }

  .text-h4 {
    @apply text-lg font-semibold tracking-tight;
  }

  .text-body-lg {
    @apply text-base leading-relaxed;
  }

  .text-body {
    @apply text-sm leading-relaxed;
  }

  .text-body-sm {
    @apply text-xs leading-relaxed;
  }

  .text-caption {
    @apply text-[11px] leading-normal text-muted-foreground;
  }

  .text-overline {
    @apply text-[10px] font-semibold uppercase tracking-widest text-muted-foreground;
  }

  .card-hover {
    @apply transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5;
  }

  .card-glass {
    @apply bg-background/60 backdrop-blur-xl border border-border/50 shadow-sm;
  }

  .card-elevated {
    @apply border-0 shadow-lg ring-1 ring-border/50;
  }

  .nav-active-indicator {
    @apply relative before:absolute before:end-0 before:top-1/2 before:h-5/6 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary before:shadow-sm before:shadow-primary/40;
  }
}

/* ───────── Tenant Theme (completely independent palette) ───────── */

@layer base {
  .tenant-theme {
    --primary: 180 25% 39%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 12% 88%;
    --secondary-foreground: 222 24% 18%;
    --accent: 180 25% 39%;
    --accent-foreground: 0 0% 100%;
    --ring: 180 25% 39%;
    --tenant-bg: 220 20% 97%;
    --tenant-surface: 0 0% 100%;
    --tenant-soft: 220 16% 94%;
    --tenant-border: 220 14% 89%;
    --tenant-muted: 220 16% 96%;
    --tenant-fg: 222 24% 18%;
    --tenant-fg-muted: 220 12% 46%;
    --tenant-fg-subtle: 220 10% 62%;
    --tenant-accent: 180 25% 39%;
    --tenant-accent-fg: 0 0% 100%;
    --tenant-accent-soft: 180 20% 92%;
    --tenant-ring: 180 25% 39%;
    --tenant-secondary: 220 12% 80%;
    --tenant-secondary-soft: 220 16% 94%;
    --tenant-sidebar: 0 0% 100%;
    --tenant-sidebar-soft: 220 16% 96%;
    --tenant-sidebar-fg: 222 24% 22%;
    --tenant-sidebar-fg-muted: 220 12% 48%;
    --tenant-sidebar-border: 220 14% 90%;
    --tenant-sidebar-hover: 220 16% 94%;
    --tenant-header: 220 30% 22%;

    --studio-bg: 220 20% 97%;
    --studio-surface: 0 0% 100%;
    --studio-soft: 220 16% 94%;
    --studio-border: 220 14% 89%;
    --studio-muted: 220 16% 96%;
    --studio-fg: 222 24% 18%;
    --studio-fg-muted: 220 12% 46%;
    --studio-fg-subtle: 220 10% 62%;
    --studio-accent: 180 25% 39%;
    --studio-accent-fg: 0 0% 100%;
    --studio-accent-soft: 180 20% 92%;
    --studio-accent-border: 180 25% 75%;
    --studio-ring: 180 25% 39%;
    --studio-secondary: 220 12% 80%;
    --studio-secondary-soft: 220 16% 94%;
    --studio-secondary-border: 220 14% 86%;
    --studio-sidebar-hover: 220 16% 94%;
    --studio-glass: 0 0% 100% / 0.7;
    --studio-glass-border: 220 14% 89% / 0.5;
    --studio-glass-toolbar: 220 30% 22% / 1;
    --studio-glass-toolbar-fg: 0 0% 100%;
    --studio-glass-toolbar-fg-muted: 0 0% 80%;
    --studio-glass-toolbar-border: 0 0% 100% / 0.25;
    --studio-glass-toolbar-soft: 0 0% 100% / 0.12;
    --studio-glass-toolbar-soft-hover: 0 0% 100% / 0.2;
    --studio-navbar: 220 30% 22%;
    --studio-navbar-contrast: 0 0% 100%;
    --studio-glass-sidebar: 0 0% 100% / 1;
    --studio-glass-sidebar-fg: 222 24% 22%;
    --studio-glass-sidebar-fg-muted: 220 12% 48%;
    --studio-glass-sidebar-border: 220 14% 90% / 1;
    --studio-glass-dialog: 0 0% 100% / 0.9;
    --studio-glass-floating: 0 0% 100% / 0.92;
    --studio-overlay: 0 0% 0% / 0.12;
    --studio-skeleton: 220 16% 90%;
    --studio-skeleton-shine: 220 20% 95%;
    --studio-info: 210 60% 50%;
    --studio-success: 160 60% 40%;
    --studio-warning: 35 85% 50%;
    --studio-danger: 0 65% 50%;
  }

  .dark.tenant-theme {
    --primary: 180 25% 45%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 12% 24%;
    --secondary-foreground: 0 0% 92%;
    --accent: 180 25% 45%;
    --accent-foreground: 0 0% 100%;
    --ring: 180 25% 45%;
    --tenant-bg: 0 0% 10%;
    --tenant-surface: 0 0% 13%;
    --tenant-soft: 0 0% 16%;
    --tenant-border: 0 0% 19%;
    --tenant-muted: 0 0% 14%;
    --tenant-fg: 30 8% 88%;
    --tenant-fg-muted: 30 3% 52%;
    --tenant-accent: 180 25% 45%;
    --tenant-accent-fg: 0 0% 10%;
    --tenant-accent-soft: 180 20% 12%;
    --tenant-ring: 180 25% 45%;
    --tenant-sidebar: 0 0% 12%;
    --tenant-sidebar-soft: 0 0% 15%;
    --tenant-sidebar-fg: 30 8% 88%;
    --tenant-sidebar-fg-muted: 30 3% 52%;
    --tenant-sidebar-border: 0 0% 17%;
    --tenant-header: 0 0% 11%;

    --studio-bg: 0 0% 10%;
    --studio-surface: 0 0% 13%;
    --studio-soft: 0 0% 16%;
    --studio-border: 0 0% 19%;
    --studio-muted: 0 0% 14%;
    --studio-fg: 30 8% 88%;
    --studio-fg-muted: 30 3% 52%;
    --studio-fg-subtle: 30 3% 38%;
    --studio-accent: 180 25% 45%;
    --studio-accent-fg: 0 0% 10%;
    --studio-accent-soft: 180 20% 12%;
    --studio-accent-border: 180 25% 30%;
    --studio-ring: 180 25% 45%;
    --studio-secondary: 220 12% 24%;
    --studio-secondary-soft: 0 0% 18%;
    --studio-secondary-border: 0 0% 26%;
    --studio-sidebar-hover: 0 0% 18%;
    --studio-glass: 0 0% 13% / 0.6;
    --studio-glass-border: 0 0% 19% / 0.5;
    --studio-glass-toolbar: 220 25% 18% / 1;
    --studio-glass-toolbar-fg: 0 0% 100%;
    --studio-glass-toolbar-fg-muted: 0 0% 80%;
    --studio-glass-toolbar-border: 0 0% 100% / 0.18;
    --studio-glass-toolbar-soft: 0 0% 100% / 0.1;
    --studio-glass-toolbar-soft-hover: 0 0% 100% / 0.18;
    --studio-navbar: 220 25% 18%;
    --studio-navbar-contrast: 0 0% 100%;
    --studio-glass-sidebar: 0 0% 12% / 0.8;
    --studio-glass-dialog: 0 0% 13% / 0.85;
    --studio-glass-floating: 0 0% 13% / 0.9;
    --studio-overlay: 0 0% 0% / 0.5;
    --studio-skeleton: 0 0% 16%;
    --studio-skeleton-shine: 0 0% 20%;
    --studio-info: 210 60% 55%;
    --studio-success: 160 60% 45%;
    --studio-warning: 35 85% 55%;
    --studio-danger: 0 65% 55%;
  }

  /* ───────── Community Theme (homepage palette: coral #D87B63 + gold #FFB50E) ───────── */
  .community-theme {
    --primary: 12 60% 62%;
    --primary-foreground: 0 0% 100%;
    --secondary: 41 100% 53%;
    --secondary-foreground: 30 80% 12%;
    --accent: 12 60% 93%;
    --accent-foreground: 12 55% 25%;
    --ring: 12 60% 62%;
  }

  .dark.community-theme {
    --primary: 12 65% 68%;
    --primary-foreground: 0 0% 100%;
    --secondary: 41 100% 55%;
    --secondary-foreground: 0 0% 10%;
    --accent: 12 55% 26%;
    --accent-foreground: 12 65% 92%;
    --ring: 12 65% 68%;
  }
}

@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    @apply rounded-full bg-muted-foreground/20 transition-colors;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/40;
  }

  .scrollbar-none {
    scrollbar-width: none;
  }

  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .text-balance {
    text-wrap: balance;
  }

  .bg-grid {
    background-image: linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .bg-dot {
    background-image: radial-gradient(hsl(var(--border)) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .bg-gradient-radial {
    background-image: radial-gradient(var(--tw-gradient-stops));
  }

  .animate-in {
    animation: fade-in 0.3s ease-out, slide-in-from-bottom-2 0.3s ease-out;
  }

  .shimmer-overlay {
    background: linear-gradient(
      90deg,
      transparent 0%,
      hsl(var(--muted-foreground) / 0.05) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2s linear infinite;
  }

  @keyframes slide-in-from-bottom-2 {
    from { transform: translateY(4px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes slide-in-from-right-2 {
    from { transform: translateX(-4px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .card-premium {
    @apply overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-500;
  }

  .card-premium:hover {
    @apply shadow-xl -translate-y-1 border-border/80;
  }

  .card-cover {
    @apply relative aspect-[16/9] overflow-hidden;
  }

  .card-cover img {
    @apply h-full w-full object-cover transition-all duration-700 group-hover:scale-110;
  }

  .card-cover-gradient {
    @apply absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500;
  }

  .card-badges {
    @apply absolute top-3 start-3 flex flex-wrap gap-1.5 z-10;
  }

  .badge-premium {
    @apply inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm shadow-sm;
  }

  .badge-featured {
    @apply badge-premium bg-amber-500/90 text-amber-50;
  }

  .pill-premium {
    @apply inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-0.5 text-[10px] text-muted-foreground border shadow-sm;
  }

  .stat-grid {
    @apply grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground;
  }

  .stat-item {
    @apply flex items-center gap-1.5;
  }

  .stat-icon {
    @apply h-3.5 w-3.5 text-muted-foreground/40 shrink-0;
  }

  .hover-lift {
    @apply transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg;
  }

  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60;
  }

  .nav-tree-line {
    @apply absolute start-6 top-12 bottom-0 w-px bg-border/50;
  }

  .content-card {
    @apply flex items-center gap-3 rounded-xl border border-transparent px-4 py-2.5 hover:border-border/60 hover:bg-muted/20 transition-all cursor-pointer;
  }

  .content-icon-wrapper {
    @apply p-2 rounded-xl shrink-0 ring-1 ring-inset ring-black/5;
  }
}

/* ───────── Tenant canvas: subtle professional background ───────── */

@layer components {
  /* خلفية لوحة التحكم: توهجات خفيفة من اللونين الأساسي/الثانوي + شبكة خفيفة،
     بدون تلوين الأسطح نفسها حتى تبقى نظيفة. */
  .tenant-aurora {
    position: relative;
    isolation: isolate;
  }

  .tenant-aurora::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      radial-gradient(48rem 48rem at 100% -8%, hsl(var(--studio-accent) / 0.10), transparent 60%),
      radial-gradient(42rem 42rem at -8% 4%, hsl(var(--studio-secondary, 220 12% 88%) / 0.12), transparent 58%),
      radial-gradient(36rem 36rem at 50% 120%, hsl(var(--studio-accent) / 0.06), transparent 60%);
  }

  .tenant-aurora::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, hsl(var(--studio-border) / 0.6) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--studio-border) / 0.6) 1px, transparent 1px);
    background-size: 32px 32px;
    -webkit-mask-image: radial-gradient(circle at 50% 0%, black, transparent 75%);
    mask-image: radial-gradient(circle at 50% 0%, black, transparent 75%);
    opacity: 0.5;
  }

  .tenant-aurora > * {
    position: relative;
    z-index: 1;
  }

  /* عنوان القسم مع مؤشر شريط جانبي باللون الأساسي */
  .section-title-accent {
    position: relative;
    padding-inline-start: 0.875rem;
  }

  .section-title-accent::before {
    content: "";
    position: absolute;
    inset-inline-start: 0;
    top: 0.1em;
    bottom: 0.1em;
    width: 3px;
    border-radius: 9999px;
    background: linear-gradient(
      to bottom,
      hsl(var(--studio-accent)),
      hsl(var(--studio-accent) / 0.35)
    );
  }

  /* كارت احترافي: رفع عند الـ hover + توهج حدودي باللون الأساسي */
  .premium-card {
    position: relative;
    border-radius: 0.875rem;
    background-color: hsl(var(--studio-surface));
    border: 1px solid hsl(var(--studio-border));
    box-shadow: 0 1px 2px 0 hsl(var(--studio-fg) / 0.04), 0 1px 3px -1px hsl(var(--studio-fg) / 0.06);
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.25s ease, border-color 0.25s ease;
  }

  .premium-card::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, hsl(var(--studio-accent) / 0.5), transparent 45%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
  }

  .premium-card:hover {
    transform: translateY(-3px);
    border-color: hsl(var(--studio-accent) / 0.35);
    box-shadow: 0 12px 32px -8px hsl(var(--studio-accent) / 0.18),
      0 4px 8px -4px hsl(var(--studio-fg) / 0.1);
  }

  .premium-card:hover::after {
    opacity: 1;
  }

  /* شريط علوي رفيع باللون الأساسي يظهر عند الـ hover */
  .card-top-accent {
    position: relative;
    overflow: hidden;
  }

  .card-top-accent::before {
    content: "";
    position: absolute;
    inset-inline: 0;
    top: 0;
    height: 3px;
    background: linear-gradient(
      to right,
      hsl(var(--studio-accent)),
      hsl(var(--studio-secondary, 220 12% 88%))
    );
    transform: scaleX(0);
    transform-origin: start;
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .card-top-accent:hover::before {
    transform: scaleX(1);
  }
}

/* ───────── Mobile performance: pause decorative hero animations ───────── */
@media (max-width: 768px) {
  .hero-bg-orb {
    animation: none !important;
  }
  .hero-bg-orb {
    opacity: var(--orb-opacity, 0.12) !important;
  }
}

/* ───────── Touch devices (phones + tablets) ─────────
   Three rendering-only rules. None of them change the layout, spacing,
   colors, or desktop appearance (desktop keeps `hover` + `fine` pointer):
   1. Freeze the decorative hero orbs. On tablets the desktop orbs render and
      the float keyframes animate blur+opacity, which re-runs the CSS filter
      every frame. The orbs are low-opacity background blobs, so freezing
      them is visually identical while removing a continuous repaint source.
   2. Drop repaint-heavy backdrop-filter from glass chrome. The page
      background is essentially flat, so removing the blur is visually
      identical — and it eliminates the per-frame backdrop re-sampling under
      the sticky navbar while the page scrolls.
   3. Release the forced composited layer on frozen hero orbs. */
@media (hover: none) and (pointer: coarse) {
  .hero-bg-orb {
    animation: none !important;
    opacity: var(--orb-opacity, 0.12) !important;
    will-change: auto !important;
  }

  .glass-touch-solid {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }

  .nav-touch-solid {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    background-color: hsl(var(--background) / 0.94) !important;
  }
}

/* ───────── Pause animations while scrolling or when off-screen ───────── */
.hero-anim-paused .hero-bg-orb,
body.page-is-scrolling .hero-bg-orb {
  animation-play-state: paused !important;
}

.news-marquee-paused .news-marquee-track,
body.page-is-scrolling .news-marquee-track {
  animation-play-state: paused !important;
}

/* A translucent sticky header forces backdrop re-sampling while scrolling. */
body.page-is-scrolling .nav-touch-solid {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  background-color: hsl(var(--background) / 0.94) !important;
}

/* ───────── Content-visibility: skip rendering offscreen sections ───────── */
.section-lazy {
  content-visibility: auto;
  contain-intrinsic-size: auto 360px;
}

@keyframes float-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* — News ticker (شريط الأخبار): glass chips marquee — */
@keyframes news-marquee-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-1 * var(--marquee-shift, 0px)));
  }
}

/* RTL: start offset one group to the right so items enter seamlessly
   from the right edge instead of leaving an empty gap. */
@keyframes news-marquee-scroll-rtl {
  from {
    transform: translateX(var(--marquee-shift, 0px));
  }
  to {
    transform: translateX(0);
  }
}

.news-marquee-track {
  animation-name: news-marquee-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-play-state: running;
  will-change: transform;
}

.news-marquee:hover .news-marquee-track {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .news-marquee-track {
    animation: none;
  }
}

/* — Hero section (قسم الترحيب): cream-themed decorations — */
.hero-avatar-ring {
  box-shadow: 0 0 32px var(--hero-glow, rgba(0,0,0,0.30)), 0 0 64px var(--hero-glow, rgba(0,0,0,0.12));
}

/* — Hero ID-card orbit icons: thick translucent ring + layered halo —
   Uses --icon-ring-color (brand-primary / brand-secondary) which is set
   inline per icon, so the ring always matches the icon's brand color. */
.hero-icon-ring {
  border: 5px solid color-mix(in srgb, var(--icon-ring-color, var(--brand-primary)) 30%, transparent);
  box-shadow:
    0 0 0 6px color-mix(in srgb, var(--icon-ring-color, var(--brand-primary)) 13%, transparent),
    0 0 26px -4px color-mix(in srgb, var(--icon-ring-color, var(--brand-primary)) 35%, transparent),
    0 12px 26px -12px rgba(0, 0, 0, 0.4);
  transition:
    transform 250ms ease,
    box-shadow 250ms ease;
}
.hero-icon-ring:hover {
  box-shadow:
    0 0 0 10px color-mix(in srgb, var(--icon-ring-color, var(--brand-primary)) 19%, transparent),
    0 8px 34px -6px color-mix(in srgb, var(--icon-ring-color, var(--brand-primary)) 48%, transparent),
    0 18px 40px -12px rgba(0, 0, 0, 0.45);
}

/* — Hero background decorations — */
.hero-bg-orb {
  will-change: transform;
  animation: hero-orb-float var(--orb-duration, 12s) ease-in-out infinite;
  animation-delay: var(--orb-delay, 0s);
}
@keyframes hero-orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: var(--orb-opacity, 0.15); }
  25% { transform: translate(10px, -15px) scale(1.05); opacity: calc(var(--orb-opacity, 0.15) + 0.05); }
  50% { transform: translate(-5px, -25px) scale(1.1); opacity: var(--orb-opacity, 0.15); }
  75% { transform: translate(-15px, -10px) scale(1.03); opacity: calc(var(--orb-opacity, 0.15) - 0.03); }
}

/* Render the hero in its final state on the first paint. */
.home-enter-up,
.home-enter-pop,
.home-enter-pop-soft,
.home-enter-badge-top,
.home-enter-badge-bottom {
  opacity: 1;
  animation: none;
}

/* — Theme icon swap (navbar) — */
.home-icon-swap {
  animation: home-icon-swap 0.35s ease;
}
@keyframes home-icon-swap {
  0% { transform: rotate(-60deg) scale(0.6); opacity: 0; }
  60% { transform: rotate(10deg) scale(1.1); opacity: 1; }
  100% { transform: rotate(0deg) scale(1); opacity: 1; }
}

/* — Mobile icons overlay (secondary nav) — */
.home-menu-pop {
  animation: home-menu-pop 0.18s ease-out;
}
@keyframes home-menu-pop {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* — WhyChooseUs: learning-ecosystem spread — */
/* entrance states (staggered via --wcu-d) */
.wcu-anim-rise,
.wcu-anim-fade,
.wcu-pop {
  opacity: 0;
}
.wcu-scene.wcu-in-view .wcu-anim-rise {
  animation: wcu-rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--wcu-d, 0s);
}
.wcu-scene.wcu-in-view .wcu-anim-fade {
  animation: wcu-fade 0.6s ease-out forwards;
  animation-delay: var(--wcu-d, 0s);
}
.wcu-scene.wcu-in-view .wcu-pop {
  animation: wcu-pop 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--wcu-d, 0s);
}
@keyframes wcu-rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes wcu-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes wcu-pop {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

/* mastery-ring arcs draw-in */
.wcu-arc {
  stroke-dashoffset: 100;
}
.wcu-scene.wcu-in-view .wcu-arc {
  animation: wcu-arc 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--wcu-d, 0s);
}
@keyframes wcu-arc {
  to { stroke-dashoffset: var(--wcu-to, 50); }
}

/* feature spine draws vertically */
.wcu-spine {
  transform: scaleY(0);
  transform-origin: top;
  opacity: 0;
}
.wcu-scene.wcu-in-view .wcu-spine {
  animation: wcu-spine 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--wcu-d, 0.2s);
}
@keyframes wcu-spine {
  to { transform: scaleY(1); opacity: 1; }
}

/* micro segment fill */
.wcu-seg {
  transform: scaleY(0.3);
  transform-origin: bottom;
  opacity: 0.55;
}
.wcu-scene.wcu-in-view .wcu-seg {
  animation: wcu-seg 0.45s ease-out forwards;
  animation-delay: var(--wcu-d, 0s);
}
@keyframes wcu-seg {
  to { transform: scaleY(1); opacity: 1; }
}

/* journey ribbon line draws */
.wcu-ribbon-line {
  transform: scaleX(0);
  transform-origin: right;
}
.wcu-scene.wcu-in-view .wcu-ribbon-line {
  animation: wcu-line 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--wcu-d, 0s);
}
@keyframes wcu-line {
  to { transform: scaleX(1); }
}

/* ribbon horizontal track — no visible scrollbar */
.wcu-scroll::-webkit-scrollbar { display: none; }
.wcu-scroll { scrollbar-width: none; }

/* feature (module) row hover states */
.wcu-mod {
  border-radius: 1rem;
  transition: background-color 0.3s ease;
}
.wcu-mod:hover {
  background-color: var(--wcu-mod-hover, rgba(255, 255, 255, 0.4));
}
.wcu-mod-num {
  transition: color 0.3s ease;
}
.wcu-mod:hover .wcu-mod-num {
  color: var(--brand-primary);
}
.wcu-mod-ill {
  transition: border-color 0.3s ease;
}
.wcu-mod:hover .wcu-mod-ill {
  border-color: var(--brand-primary);
}
.wcu-mod-title {
  transition: color 0.3s ease;
}
.wcu-mod:hover .wcu-mod-title {
  color: var(--brand-primary);
}

/* core-panel fragment hover */
.wcu-frag-card {
  transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}
.wcu-frag-card:hover {
  transform: translateY(-3px);
  border-color: var(--brand-primary);
}

/* stages section — content swap on selection */
@keyframes stageSwapIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.stage-swap {
  animation: stageSwapIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* stages section — autoplay progress */
@keyframes stageAutoProgress {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

/* stages section — directional panel slide */
@keyframes stageInFwd {
  from {
    opacity: 0;
    transform: translateX(-36px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes stageInBack {
  from {
    opacity: 0;
    transform: translateX(36px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.stage-swap-fwd {
  animation: stageInFwd 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.stage-swap-back {
  animation: stageInBack 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .stage-swap-fwd,
  .stage-swap-back {
    animation: none !important;
  }
  .stage-auto-bar {
    animation: none !important;
    width: 100% !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-icon-swap,
  .home-menu-pop,
  .hero-bg-orb {
    animation: none !important;
  }
  .wcu-anim-rise,
  .wcu-anim-fade,
  .wcu-pop,
  .wcu-seg {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .wcu-arc {
    animation: none !important;
    stroke-dashoffset: var(--wcu-to, 50) !important;
  }
  .wcu-spine,
  .wcu-ribbon-line {
    animation: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Performance / "snappy feel" pass (design-neutral).
   These rules are intentionally UNLAYERED so they win over Tailwind's
   layered utilities in the cascade. They only shorten durations and stop
   `transition-all` from animating layout-triggering properties — the visual
   design (colors, shadows, spacing, shapes) is unchanged, the movement is
   just faster and lighter.
   ──────────────────────────────────────────────────────────────────────── */

/* Shorten every Tailwind duration utility. 300ms → 150ms etc. so the whole
   app feels responsive instead of sluggish. */
.duration-75 { transition-duration: 75ms; }
.duration-100 { transition-duration: 100ms; }
.duration-150 { transition-duration: 120ms; }
.duration-200 { transition-duration: 130ms; }
.duration-300 { transition-duration: 150ms; }
.duration-500 { transition-duration: 220ms; }
.duration-600 { transition-duration: 240ms; }
.duration-700 { transition-duration: 260ms; }
.duration-800 { transition-duration: 280ms; }
.duration-900 { transition-duration: 300ms; }
.duration-1000 { transition-duration: 320ms; }

/* `transition-all` animates EVERY property, including layout/paint-heavy ones
   (width, height, filter) that cause jank. Restrict it to the cheap,
   compositor-friendly set used by hover micro-interactions. */
.transition-all {
  transition-property: transform, opacity, box-shadow, background-color,
    border-color, color, outline-color, text-decoration-color, fill, stroke;
}

/* Snappier default easing for transform/opacity transitions that don't
   specify one. Matches the app's cubic-bezier(0.22, 1, 0.36, 1) feel. */
.transition,
.transition-transform,
.transition-opacity,
.transition-colors,
.transition-shadow {
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* ═════════════════════════════════════════════════════════════════════════
   Studio Nova — a floating editorial workbench.
   Paper canvas, guest panels, timeline storytelling, visible touch controls.
   ═════════════════════════════════════════════════════════════════════════ */

html:has(.studio-nova),
.tenant-theme.studio-nova,
.studio-nova.tenant-theme,
.studio-nova {
  /* Nova only owns its decorative tokens. The interactive palette
     (--studio-* / --tenant-* / --primary) must come from the teacher's
     "مظهر لوحة التحكم" colors injected by BrandThemeProvider/SSR. */
  --nova-mint: var(--studio-secondary);
  --nova-amber: var(--studio-accent);
  --nova-ink: var(--studio-fg);
  --nova-line: var(--studio-border);
}

.studio-nova .nova-shell {
  position: relative;
  background:
    radial-gradient(circle at 8% 4%, hsl(var(--studio-accent) / 0.1), transparent 28%),
    radial-gradient(circle at 92% 10%, hsl(var(--studio-secondary) / 0.28), transparent 32%),
    radial-gradient(circle at 55% 100%, hsl(var(--studio-accent) / 0.08), transparent 34%),
    hsl(var(--studio-bg));
}

.studio-nova .nova-shell::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  background-image: radial-gradient(hsl(var(--studio-fg) / 0.1) 0.6px, transparent 0.6px);
  background-size: 22px 22px;
  mask-image: linear-gradient(to bottom, transparent, black 18%, black 80%, transparent);
}

/* ── Masthead ─────────────────────────────────────────────────────────── */

.studio-nova .nova-header {
  position: relative;
  z-index: 4;
  background: hsl(0 0% 100% / 0.62);
  border-bottom: 1px solid hsl(var(--nova-line) / 0.8);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.studio-nova .nova-header::before {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 3px;
  background: linear-gradient(90deg, hsl(var(--nova-amber)), hsl(var(--studio-accent)) 48%, hsl(var(--nova-mint)));
}

.studio-nova .nova-brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  color: white;
  background: linear-gradient(145deg, hsl(var(--studio-accent)), hsl(var(--nova-mint)));
  box-shadow: 0 12px 26px -12px hsl(var(--studio-accent) / 0.85);
  transform: rotate(-5deg);
}

.studio-nova .nova-eyebrow {
  color: hsl(var(--studio-accent));
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.studio-nova .nova-title {
  color: hsl(var(--studio-fg));
  font-size: 18px;
  font-weight: 780;
  letter-spacing: -0.03em;
}

.studio-nova .nova-meta-strip {
  scrollbar-width: none;
}

.studio-nova .nova-meta-strip::-webkit-scrollbar { display: none; }

.studio-nova .nova-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  color: hsl(var(--studio-fg-muted));
}

.studio-nova .nova-crumb-bar {
  position: relative;
  z-index: 3;
  background: transparent;
  border-bottom: 1px dashed hsl(var(--nova-line));
}

/* ── Floating workbench ───────────────────────────────────────────────── */

.studio-nova .nova-workspace-area {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.studio-nova .nova-canvas {
  position: absolute !important;
  inset: 0;
  display: flex;
  flex-direction: column;
  flex: none !important;
  min-width: 0;
  padding: 14px 14px 94px;
  overflow: hidden;
  background: transparent;
  transition: padding 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.studio-nova .nova-shell[data-navigator-open="true"] .nova-canvas {
  padding-left: calc(var(--nova-nav-width, 300px) + 30px);
}

.studio-nova .nova-shell[data-inspector-open="true"] .nova-canvas {
  padding-right: calc(var(--nova-inspector-width, 320px) + 30px);
}

.studio-nova .nova-float-panel {
  position: absolute;
  top: 14px;
  bottom: 94px;
  z-index: 20;
  display: flex;
  overflow: hidden;
  border: 1px solid hsl(0 0% 100% / 0.9);
  border-radius: 26px;
  background: hsl(0 0% 100% / 0.86);
  box-shadow: 0 34px 80px -42px hsl(var(--nova-ink) / 0.45), 0 2px 8px hsl(var(--nova-ink) / 0.04);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

.studio-nova .nova-float-panel.nova-float-navigator {
  left: 14px;
  width: var(--nova-nav-width, 300px);
}

.studio-nova .nova-float-panel.nova-float-inspector {
  right: 14px;
  width: var(--nova-inspector-width, 320px);
}

.studio-nova .nova-float-panel::before {
  content: "";
  position: absolute;
  inset-inline: 18px;
  top: 0;
  height: 3px;
  border-radius: 0 0 10px 10px;
  background: linear-gradient(90deg, hsl(var(--studio-accent)), hsl(var(--nova-mint)));
}

/* ── Navigator: quiet chapter list ────────────────────────────────────── */

.studio-nova .nova-nav {
  background: transparent;
  color: hsl(var(--studio-fg));
}

.studio-nova .nova-nav-head {
  background: linear-gradient(160deg, hsl(var(--studio-accent-soft)), hsl(0 0% 100% / 0.2));
  border-bottom: 1px solid hsl(var(--nova-line) / 0.7);
}

.studio-nova .nova-nav .nova-eyebrow { color: hsl(var(--studio-accent)); }

.studio-nova .nova-count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: hsl(var(--studio-accent));
  color: white;
  font-size: 11px;
  font-weight: 800;
}

.studio-nova .nova-search {
  background: hsl(0 0% 100% / 0.9);
  border: 1px solid hsl(var(--nova-line));
  border-radius: 14px;
  color: hsl(var(--studio-fg-subtle));
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.studio-nova .nova-search:focus-within {
  border-color: hsl(var(--studio-accent));
  box-shadow: 0 0 0 4px hsl(var(--studio-accent) / 0.12);
}

.studio-nova .nova-search input {
  background: transparent;
  border: 0;
  outline: 0;
  color: hsl(var(--studio-fg));
  font-size: 12px;
}

.studio-nova .nova-search input::placeholder { color: hsl(var(--studio-fg-subtle)); }

.studio-nova .nova-nav-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  height: 40px;
  border-radius: 14px;
  border: 1px solid hsl(var(--studio-accent-border));
  background: hsl(var(--studio-accent-soft));
  color: hsl(var(--studio-accent));
  font-size: 12px;
  font-weight: 750;
  transition: transform 140ms ease, background-color 140ms ease;
}

.studio-nova .nova-nav-add:hover {
  background: hsl(var(--studio-accent));
  color: white;
  transform: translateY(-1px);
}

.studio-nova .nova-nav [data-lecture-id],
.studio-nova .nova-nav [data-section-id] {
  border-radius: 16px;
  transition: background-color 130ms ease, transform 130ms ease;
}

.studio-nova .nova-nav [data-lecture-id]:hover,
.studio-nova .nova-nav [data-section-id]:hover {
  background: hsl(var(--studio-soft));
  transform: translateX(2px);
}

.studio-nova .nova-nav [data-lecture-id][aria-selected="true"],
.studio-nova .nova-nav [data-section-id][aria-selected="true"] {
  background: hsl(var(--studio-accent-soft));
  box-shadow: inset 3px 0 0 hsl(var(--studio-accent));
}

.studio-nova .nova-nav [data-lecture-id] button[aria-label="خيارات المحاضرة"],
.studio-nova .nova-nav [data-section-id] button[aria-label="خيارات القسم"] {
  opacity: 1 !important;
}

.studio-nova .nova-nav-scroll { scrollbar-color: hsl(var(--nova-line)) transparent; }

/* ── Canvas furniture ─────────────────────────────────────────────────── */

.studio-nova .nova-workbar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: fit-content;
  max-width: 100%;
  margin-bottom: 14px;
  padding: 9px 14px 9px 10px;
  border: 1px solid hsl(0 0% 100% / 0.9);
  border-radius: 18px;
  background: hsl(0 0% 100% / 0.78);
  box-shadow: 0 16px 40px -30px hsl(var(--nova-ink) / 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.studio-nova .nova-workbar .nova-section-label { color: hsl(var(--nova-mint)); }

.studio-nova .nova-scroll-region {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 2px 10px;
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--nova-line)) transparent;
}

.studio-nova .nova-page {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 4px 4px 12px;
}

.studio-nova .nova-hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  color: hsl(var(--studio-accent));
  background: hsl(var(--studio-accent-soft));
  border: 1px solid hsl(var(--studio-accent-border) / 0.8);
}

.studio-nova .nova-section-label {
  color: hsl(var(--studio-fg-subtle));
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.studio-nova .nova-card,
.studio-nova .nova-info-card,
.studio-nova .nova-empty-card {
  border: 1px solid hsl(var(--nova-line) / 0.9);
  border-radius: 22px;
  background: hsl(0 0% 100% / 0.9);
  box-shadow: 0 18px 50px -42px hsl(var(--nova-ink) / 0.55);
}

.studio-nova .nova-empty-card {
  border-style: dashed;
  background: hsl(0 0% 100% / 0.55);
}

.studio-nova .nova-icon-btn {
  border-radius: 12px;
  color: hsl(var(--studio-fg-muted));
  transition: background-color 130ms ease, color 130ms ease, transform 130ms ease;
}

.studio-nova .nova-icon-btn:hover {
  background: hsl(var(--studio-soft));
  color: hsl(var(--studio-fg));
}

.studio-nova .nova-icon-btn[aria-pressed="true"] {
  background: hsl(var(--studio-accent));
  color: white;
}

.studio-nova .nova-primary-btn {
  background: linear-gradient(135deg, hsl(var(--studio-accent)), hsl(var(--studio-secondary)));
  color: white;
  border: 1px solid transparent;
  box-shadow: 0 12px 24px -14px hsl(var(--studio-accent));
  font-weight: 750;
}

.studio-nova .nova-primary-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }

/* ── Editorial storytelling blocks ────────────────────────────────────── */

.studio-nova .nova-editorial-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid hsl(0 0% 100% / 0.9);
  border-radius: 28px;
  background:
    linear-gradient(120deg, hsl(0 0% 100% / 0.96), hsl(var(--studio-accent-soft) / 0.9)),
    hsl(0 0% 100%);
  box-shadow: 0 28px 70px -48px hsl(var(--nova-ink) / 0.5);
}

.studio-nova .nova-editorial-hero::after {
  content: attr(data-mark);
  position: absolute;
  inset-inline-end: -10px;
  bottom: -38px;
  color: hsl(var(--studio-accent) / 0.07);
  font-size: 150px;
  font-weight: 900;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}

.studio-nova .nova-hero-index {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  flex: none;
  border-radius: 20px;
  background: hsl(var(--studio-accent));
  color: white;
  font-size: 22px;
  font-weight: 850;
  box-shadow: 0 16px 30px -16px hsl(var(--studio-accent));
}

.studio-nova .nova-stat-ribbon {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.studio-nova .nova-stat-chip {
  display: flex;
  min-width: 128px;
  flex: 1 1 150px;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid hsl(var(--nova-line) / 0.85);
  border-radius: 18px;
  background: hsl(0 0% 100% / 0.82);
}

.studio-nova .nova-stat-chip > span:first-child {
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;
  border-radius: 11px;
  background: hsl(var(--nova-mint) / 0.12);
  color: hsl(var(--nova-mint));
}

.studio-nova .nova-stat-chip strong {
  display: block;
  color: hsl(var(--studio-fg));
  font-size: 16px;
  line-height: 1.15;
}

.studio-nova .nova-stat-chip small {
  color: hsl(var(--studio-fg-subtle));
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.studio-nova .nova-timeline {
  position: relative;
  display: grid;
  gap: 14px;
}

.studio-nova .nova-timeline::before {
  content: "";
  position: absolute;
  inset-block: 14px 14px;
  inset-inline-start: 21px;
  width: 2px;
  border-radius: 2px;
  background: linear-gradient(to bottom, hsl(var(--studio-accent)), hsl(var(--nova-mint) / 0.5), transparent);
}

.studio-nova .nova-timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.studio-nova .nova-step-bubble {
  position: relative;
  z-index: 1;
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 3px solid hsl(var(--studio-bg));
  border-radius: 50%;
  background: hsl(0 0% 100%);
  color: hsl(var(--studio-accent));
  font-size: 13px;
  font-weight: 850;
  box-shadow: 0 8px 20px -10px hsl(var(--studio-accent));
}

.studio-nova .nova-timeline-item[data-selected="true"] .nova-step-bubble {
  background: hsl(var(--studio-accent));
  color: white;
}

.studio-nova .nova-story-card {
  border: 1px solid hsl(var(--nova-line) / 0.9);
  border-radius: 22px;
  background: hsl(0 0% 100% / 0.92);
  box-shadow: 0 20px 50px -44px hsl(var(--nova-ink) / 0.55);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.studio-nova .nova-story-card:hover {
  transform: translateY(-2px);
  border-color: hsl(var(--studio-accent-border));
  box-shadow: 0 26px 60px -40px hsl(var(--studio-accent) / 0.4);
}

.studio-nova .nova-timeline-item[data-selected="true"] .nova-story-card {
  border-color: hsl(var(--studio-accent));
  box-shadow: inset 3px 0 0 hsl(var(--studio-accent)), 0 26px 60px -40px hsl(var(--studio-accent) / 0.4);
}

.studio-nova .nova-story-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px dashed hsl(var(--nova-line));
}

.studio-nova .nova-story-card-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 18px;
  padding: 14px 16px;
}

.studio-nova .nova-mini-label {
  display: block;
  color: hsl(var(--studio-fg-subtle));
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.studio-nova .nova-mini-value {
  display: block;
  margin-top: 2px;
  color: hsl(var(--studio-fg));
  font-size: 13px;
  font-weight: 750;
}

.studio-nova .nova-action-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.studio-nova .nova-action-chip {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
  border: 1px solid hsl(var(--nova-line));
  border-radius: 12px;
  background: hsl(0 0% 100%);
  color: hsl(var(--studio-fg-muted));
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 130ms ease, color 130ms ease, border-color 130ms ease, transform 130ms ease;
}

.studio-nova .nova-action-chip:hover {
  border-color: hsl(var(--studio-accent-border));
  background: hsl(var(--studio-accent-soft));
  color: hsl(var(--studio-accent));
  transform: translateY(-1px);
}

.studio-nova .nova-action-chip[data-tone="danger"] {
  color: hsl(var(--studio-danger));
  border-color: hsl(var(--studio-danger) / 0.3);
}

.studio-nova .nova-action-chip[data-tone="danger"]:hover {
  background: hsl(var(--studio-danger) / 0.08);
  color: hsl(var(--studio-danger));
}

.studio-nova .nova-action-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.studio-nova .nova-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.studio-nova .nova-meta-tile {
  padding: 12px 14px;
  border-radius: 16px;
  background: hsl(var(--studio-soft) / 0.65);
  border: 1px solid hsl(var(--nova-line) / 0.6);
}

.studio-nova .nova-preview-stage {
  display: grid;
  place-items: center;
  min-height: 220px;
  padding: 28px;
  border: 2px dashed hsl(var(--studio-accent-border));
  border-radius: 24px;
  background:
    radial-gradient(circle at 20% 20%, hsl(var(--nova-amber) / 0.1), transparent 35%),
    radial-gradient(circle at 80% 80%, hsl(var(--nova-mint) / 0.12), transparent 35%),
    hsl(0 0% 100% / 0.72);
  text-align: center;
}

.studio-nova .nova-drag-handle {
  display: grid;
  width: 28px;
  height: 34px;
  flex: none;
  place-items: center;
  border-radius: 9px;
  background: hsl(var(--studio-soft));
  color: hsl(var(--studio-fg-subtle));
  cursor: grab;
}

/* ── Inspector: field notes ───────────────────────────────────────────── */

.studio-nova .nova-panel-head {
  background: linear-gradient(150deg, hsl(var(--studio-accent-soft)), hsl(0 0% 100% / 0.4));
  border-bottom: 1px solid hsl(var(--nova-line) / 0.7);
}

.studio-nova .nova-group {
  border: 1px solid hsl(var(--nova-line) / 0.85);
  border-radius: 18px;
  background: hsl(0 0% 100% / 0.86);
  overflow: hidden;
}

.studio-nova .nova-group-title {
  padding: 10px 13px;
  background: hsl(var(--studio-soft) / 0.7);
  border-bottom: 1px solid hsl(var(--nova-line) / 0.7);
  color: hsl(var(--studio-fg-muted));
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0;
}

.studio-nova .nova-group > :not(.nova-group-title) { padding-inline: 13px; }
.studio-nova .nova-group > :last-child { padding-bottom: 11px; }

/* ── Tabs, dock and drawers ───────────────────────────────────────────── */

.studio-nova .nova-tabs {
  background: transparent;
  border-bottom: 0;
}

.studio-nova .nova-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
  border-radius: 14px 14px 0 0;
  padding: 10px 16px;
  color: hsl(var(--studio-fg-muted));
  font-size: 0.875rem;
  font-weight: 700;
  transition: background-color 140ms ease, color 140ms ease;
}

.studio-nova .nova-tab:hover {
  background: hsl(0 0% 100% / 0.6);
  color: hsl(var(--studio-fg));
}

.studio-nova .nova-tab[aria-selected="true"],
.studio-nova .nova-tab.is-active {
  background: hsl(0 0% 100% / 0.94);
  color: hsl(var(--studio-accent));
  box-shadow: inset 0 -3px 0 hsl(var(--studio-accent)), 0 -8px 24px -20px hsl(var(--nova-ink));
}

.studio-nova .nova-dock-floating {
  position: absolute;
  bottom: 16px;
  left: 50%;
  z-index: 40;
  display: flex;
  max-width: calc(100% - 24px);
  align-items: center;
  gap: 6px;
  padding: 7px;
  border: 1px solid hsl(0 0% 100% / 0.95);
  border-radius: 999px;
  background: hsl(0 0% 100% / 0.9);
  box-shadow: 0 24px 60px -28px hsl(var(--nova-ink) / 0.55);
  transform: translateX(-50%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.studio-nova .nova-dock-floating button {
  min-height: 44px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 750;
}

.studio-nova .nova-dock-floating [aria-pressed="true"] {
  background: hsl(var(--studio-accent));
  color: white;
}

.studio-nova .nova-drawer {
  border: 1px solid hsl(0 0% 100% / 0.9);
  background: hsl(0 0% 100% / 0.96);
  box-shadow: 0 30px 80px -36px hsl(var(--nova-ink) / 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.studio-nova .nova-drawer-shell {
  border: 1px solid hsl(0 0% 100% / 0.9);
  background: hsl(0 0% 100% / 0.94);
  box-shadow: 0 30px 80px -36px hsl(var(--nova-ink) / 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

@media (max-width: 1023px) {
  .studio-nova .nova-canvas,
  .studio-nova .nova-shell[data-navigator-open="true"] .nova-canvas,
  .studio-nova .nova-shell[data-inspector-open="true"] .nova-canvas {
    padding-inline: 14px;
  }

  .studio-nova .nova-dock-floating {
    bottom: max(12px, env(safe-area-inset-bottom));
  }
}

@media (max-width: 639px) {
  .studio-nova .nova-dock-floating { gap: 3px; padding: 5px; }
  .studio-nova .nova-dock-floating button { min-height: 46px; padding-inline: 10px; }
  .studio-nova .nova-dock-floating .nova-dock-label { display: none; }
  .studio-nova .nova-editorial-hero::after { font-size: 100px; bottom: -24px; }
  .studio-nova .nova-timeline::before { inset-inline-start: 19px; }
  .studio-nova .nova-timeline-item { grid-template-columns: 40px minmax(0, 1fr); gap: 10px; }
  .studio-nova .nova-step-bubble { width: 40px; height: 40px; }
}
```

---

## `apps/web/src/components/layout/TenantDashboardLayout.tsx`

```tsx
"use client";

import { useCallback, useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceLeftSidebar } from "./WorkspaceLeftSidebar";
import { WorkspaceRightInspector } from "./WorkspaceRightInspector";
import { WorkspaceStatusBar } from "./WorkspaceStatusBar";
import { WorkspaceGlobalSearch } from "./WorkspaceGlobalSearch";

interface TenantDashboardLayoutProps {
  children: React.ReactNode;
}

function TenantDashboardLayout({ children }: TenantDashboardLayoutProps) {
  const mobileMenuOpen = useWorkspaceStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useWorkspaceStore((s) => s.setMobileMenuOpen);

  // لوحة تحكم المدرس بتستخدم ألوان "مظهر لوحة التحكم" (activeTenant.branding)
  // اللي بيطبّقها BrandThemeProvider على .tenant-theme — فمفيش حاجة نحقنها هنا.

  const handleCloseMobile = useCallback(() => {
    setMobileMenuOpen(false);
  }, [setMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  return (
    <div className="tenant-theme studio-nova flex min-h-dvh flex-col bg-studio-bg text-studio-fg md:h-dvh md:overflow-hidden">
      {/* Header */}
      <WorkspaceHeader />

      {/* Main area: sidebar | center | inspector */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop left sidebar */}
        <div className="hidden md:flex">
          <WorkspaceLeftSidebar />
        </div>

        {/* Center viewport */}
        <main
          className="tenant-aurora flex min-w-0 flex-1 flex-col md:overflow-hidden"
          role="main"
          aria-label="مساحة العمل الرئيسية"
        >
          <div className="flex-1 md:overflow-y-auto studio-scrollbar">
            <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:px-6 md:py-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* Right inspector */}
        <div className="hidden lg:flex">
          <WorkspaceRightInspector />
        </div>
      </div>

      {/* Status bar */}
      <WorkspaceStatusBar />

      {/* Global search overlay */}
      <WorkspaceGlobalSearch />

      {/* Mobile overlay: sidebar as drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-studio-overlay md:hidden"
            onClick={handleCloseMobile}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 w-[min(300px,88vw)] max-w-full pb-[env(safe-area-inset-bottom)] md:hidden shadow-2xl transition-transform duration-300 ease-in-out"
            role="dialog"
            aria-modal="true"
            aria-label="القائمة الجانبية"
          >
            <WorkspaceLeftSidebar />
          </aside>
        </>
      )}
    </div>
  );
}

export { TenantDashboardLayout };
```

---

## `apps/web/src/lib/brand-theme.ts`

```ts
import type { TenantBranding } from "@/features/tenant-bootstrap/types";
import {
  brandContrast,
  BRAND_PRIMARY_DEFAULT,
  BRAND_SECONDARY_DEFAULT,
  normalizeHex,
} from "@/lib/brand";

/**
 * Single <style> element both sides target so server-pre-rendered branding is
 * reused (never duplicated) by the client when live branding changes.
 */
export const BRAND_THEME_STYLE_ID = "brand-theme-vars";
import {
  generateBrandScale,
  generateCommunityThemeColors,
  generateThemeColors,
} from "@/lib/color";

/**
 * Resolve the two platform brand colors from a tenant's `platform_branding`
 * payload. Accepts both the camelCase shape returned by the public by-domain
 * endpoint (`primaryColor`/`secondaryColor`) and the snake_case shape used by
 * auth responses (`primary_color`/`secondary_color`). Unset values fall back to
 * the platform defaults (`#D87B63` / `#FFB50E`) and every value is normalized
 * to `#RRGGBB`, so consumers can rely on a well-formed hex pair.
 */
export function resolveBrandThemeColors(
  branding?: TenantBranding | null,
): { primary: string; secondary: string } {
  const b = (branding ?? {}) as Record<string, unknown>;
  const primary = (b.primaryColor ?? b.primary_color ?? BRAND_PRIMARY_DEFAULT) as string;
  const secondary = (b.secondaryColor ?? b.secondary_color ?? BRAND_SECONDARY_DEFAULT) as string;
  return {
    primary: normalizeHex(primary),
    secondary: normalizeHex(secondary),
  };
}

/**
 * The teacher dashboard has its own appearance palette (`branding` settings
 * group, saved from "مظهر لوحة التحكم"), kept separate from the public-site
 * palette (`platform_branding`). Use it for `.tenant-theme` when configured and
 * fall back to the platform pair on fresh tenants that never touched it.
 * Accepts both camelCase (by-domain) and snake_case (auth/bootstrap) shapes.
 */
export function resolveDashboardBrandColors(
  branding: unknown,
  fallback: { primary: string; secondary: string },
): { primary: string; secondary: string } {
  const b = (branding ?? {}) as Record<string, unknown>;
  const rawPrimary = b.primaryColor ?? b.primary_color;
  const rawSecondary = b.secondaryColor ?? b.secondary_color;
  return {
    primary:
      typeof rawPrimary === "string" && rawPrimary.trim()
        ? normalizeHex(rawPrimary)
        : fallback.primary,
    secondary:
      typeof rawSecondary === "string" && rawSecondary.trim()
        ? normalizeHex(rawSecondary)
        : fallback.secondary,
  };
}

function toVars(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v};`)
    .join("");
}

/**
 * The full brand-theme stylesheet: the `:root` brand pair plus the light/dark
 * variables for every brand surface (`.community-theme` / `.tenant-theme` /
 * `.student-theme`). It is generated from the tenant's two base colors so the
 * entire design system follows the tenant's branding.
 *
 * Both sides use this same function:
 *  · Server (`BrandThemeSSR`) pre-renders the real colors into <head>, so the
 *    very first paint already uses the tenant's colors and there is never a
 *    flash of the `globals.css` fallbacks (#D87B63 / #FFB50E).
 *  · Client (`BrandThemeProvider`) re-applies the same stylesheet whenever the
 *    live `platformBranding` changes (dashboard save, tenant switch) by
 *    rewriting the same <style> element in place.
 */
export function buildBrandThemeCss(
  primary: string,
  secondary: string,
  dashboard: { primary: string; secondary: string } = { primary, secondary },
): string {
  const light = {
    ...generateCommunityThemeColors(primary, secondary, false),
    ...generateBrandScale(primary, secondary, false),
  };
  const dark = {
    ...generateCommunityThemeColors(primary, secondary, true),
    ...generateBrandScale(primary, secondary, true),
  };
  // Dashboard (sidebar, header, active/hover states) follows the palette the
  // teacher picked in "مظهر لوحة التحكم"; the public site keeps the platform
  // palette above.
  const dashLight = generateThemeColors(dashboard.primary, dashboard.secondary, false);
  const dashDark = generateThemeColors(dashboard.primary, dashboard.secondary, true);

  return `
:root {
  --brand-primary: ${primary};
  --brand-secondary: ${secondary};
  --brand-primary-contrast: ${brandContrast(primary)};
  --brand-secondary-contrast: ${brandContrast(secondary)};
}
.community-theme { ${toVars(light)} }
.dark .community-theme, .dark.community-theme { ${toVars(dark)} }
.tenant-theme { ${toVars(dashLight)} }
.dark .tenant-theme, .dark.tenant-theme { ${toVars(dashDark)} }
.student-theme { ${toVars(dashLight)} }
.dark .student-theme, .dark.student-theme { ${toVars(dashDark)} }
`;
}
```

---

## `apps/web/src/components/layout/BrandThemeProvider.tsx`

```tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import { usePlatformBranding } from "@/hooks/usePlatformBranding";
import {
  BRAND_THEME_STYLE_ID,
  buildBrandThemeCss,
  resolveBrandThemeColors,
  resolveDashboardBrandColors,
} from "@/lib/brand-theme";

/**
 * المصدر الوحيد والموثوق لألوان المنصة (platformBranding) على طول التطبيق.
 *
 * بيطبّق نفس لونين الأساسيين (primary/secondary) على كل الأسطح الملوّنة:
 *   · .community-theme  → الموقع العام (navbar/hero/cards/wallet/courses…)
 *   · .tenant-theme     → لوحة تحكم المدرس + صفحة تسجيل الدخول
 *   · .student-theme    → لوحة الطالب
 *   · :root --brand-*   → متغيّرات الألوان الخام الجاهزة للاستخدام المباشر
 *
 * لوحة تحكم المدرس (.tenant-theme) ليها بalette مستقلة بيتحكم فيها المدرس من
 * "مظهر لوحة التحكم" (activeTenant.branding) — عشان كده بنستخدمها للـ dashboard،
 * مع الاحتفاظ بـ platformBranding للموقع العام وصفحة الطالب. لو المدرس ماعملش
 * إعدادات مظهر، بنرجّع للـ platform pair عشان مفيش لوحة تظهر بلا ألوان.
 *
 * ملاحظة حول منع الوميض (FOUC): الألوان الحقيقية بتتطبّع server-side في <head>
 * عن طريق BrandThemeSSR (نفس id الـ <style>) — فلأول رسمة من اول رسمة بالألوان
 * الصحيحة. هنا على الـ client بنعيد كتابة نفس العنصر جوه المكان بس لما الألوان
 * الحية (platformBranding) تبقى معروفة فعلاً، وبنمنع كتابة قيم الـ fallback
 * (الموجودة في globals.css) مكانها قبل ما توصل الألوان — وده كان سبب الوميض.
 */
export function BrandThemeProvider() {
  const platformBranding = usePlatformBranding();
  // Teacher appearance palette ("مظهر لوحة التحكم"), separate from the public
  // site palette. This is what actually drives the dashboard sidebar colors.
  const appearanceBranding = useTenantStore((s) => s.activeTenant?.branding);
  const setPlatformBranding = useTenantStore((s) => s.setPlatformBranding);
  const loadRef = useRef(false);

  // تحميل ذاتي لألوان المنصة (مرّة واحدة، ومستقل عن حالة تسجيل الدخول). لو كانت
  // الألوان موجودة من الـ SSR/البوتستراب بنكتفي بيها.
  useEffect(() => {
    if (platformBranding || loadRef.current) return;
    loadRef.current = true;
    const host = window.location.host;
    fetch(`/api/v1/tenant/by-domain?domain=${encodeURIComponent(host)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.platform_branding) setPlatformBranding(data.platform_branding);
      })
      .catch(() => {
        // لو فشل، نسمح بإعادة المحاولة في المرة الجاية.
        loadRef.current = false;
      });
  }, [platformBranding, setPlatformBranding]);

  const platform = resolveBrandThemeColors(platformBranding);
  const dashboard = resolveDashboardBrandColors(appearanceBranding, platform);

  const css = useMemo(
    () => buildBrandThemeCss(platform.primary, platform.secondary, dashboard),
    [platform.primary, platform.secondary, dashboard.primary, dashboard.secondary],
  );

  useEffect(() => {
    // لو مفيش حتى الآن branding حقيقي (middleware/SSR ماجابهاش والـ fetch لسه
    // شغال)، منكتبش style إطلاقاً عشان منستبدلش الألوان الصحيحة اللي طبّعها الـ
    // SSR في <head> بألوان الـ fallback — اللي كان سبب الوميض. أول ما توصل
    // الألوان الحقيقية، بنعيد كتابة نفس العنصر جوه المكان بالقيم نفسها فمفيش تغيير مرئي.
    if (!platformBranding) return;

    let styleTag = document.getElementById(BRAND_THEME_STYLE_ID) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = BRAND_THEME_STYLE_ID;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
  }, [css, platformBranding]);

  return null;
}
```

---

## `apps/web/src/components/layout/BrandThemeSSR.tsx`

```tsx
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import {
  BRAND_THEME_STYLE_ID,
  buildBrandThemeCss,
  resolveBrandThemeColors,
  resolveDashboardBrandColors,
} from "@/lib/brand-theme";

/**
 * Server-rendered brand theme. Renders the tenant's resolved `platform_branding`
 * as a real <style> block directly into <head>, so the browser's very first
 * paint already uses the tenant's configured colors — eliminating the
 * flash-of-unstyled-content where the globals.css fallbacks
 * (#D87B63 / #FFB50E) flashed for a moment before the client fetched branding.
 *
 * For tenant hosts the tenant is resolved server-side (via the
 * `x-tenant-context` header or an internal by-domain call, both cached per
 * request by `getTenantSeoContext`). On the bare platform host there is no
 * tenant, so the platform's design fallbacks render — which is correct and
 * stable (no color "change" after load).
 *
 * The client `BrandThemeProvider` reuses the exact same <style> id to update
 * the block in place when live branding changes (dashboard save / tenant
 * switch), so there is never a duplicate stylesheet node.
 */
export async function BrandThemeSSR() {
  const tenant = await getTenantSeoContext();
  const branding = tenant?.platform_branding ?? tenant?.platformBranding ?? null;
  const platform = resolveBrandThemeColors(branding);
  // by-domain already carries the teacher's "مظهر لوحة التحكم" palette in
  // `branding`, so the very first paint uses the colors they actually picked.
  const dashboard = resolveDashboardBrandColors(tenant?.branding, platform);
  const css = buildBrandThemeCss(platform.primary, platform.secondary, dashboard);

  return <style id={BRAND_THEME_STYLE_ID} data-ssr="true">{css}</style>;
}
```

---

## `apps/web/src/components/layout/WorkspaceLeftSidebar.tsx`

```tsx
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Pin,
  Star,
  Layout,
  Palette,
  Globe,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardList,
  GripVertical,
  Images,
  Video,
  Megaphone,
  MessageSquare,
  Home,
  User,
  Award,
  GraduationCap,
  BookOpen,
  TicketCheck,
  CreditCard,
  ImageIcon,
  Search,
  ClipboardCheck,
  ShieldCheck,
  Scale,
  PanelBottom,
  Compass,
  Newspaper,
  BriefcaseBusiness,
  Info,
  Mail,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioSidebarSection } from "@/components/studio/navigation/StudioSidebarSection";
import { StudioSidebarItem } from "@/components/studio/navigation/StudioSidebarItem";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { routes } from "@/constants/routes";
import { cn } from "@/lib/cn";
import { useTenantContext } from "@/providers/TenantProvider";

const COLLAPSED_WIDTH = 68;
const MIN_WIDTH = 220;
const MAX_WIDTH = 400;

function LegalPageItems({
  collapsed,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate: (href: string) => void;
}) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <>
      <StudioSidebarItem
        icon={<ShieldCheck className="h-4 w-4" />}
        label="سياسة الخصوصية"
        active={pathname.startsWith(routes.teacherLegal) && tab !== "terms"}
        collapsed={collapsed}
        onClick={() => onNavigate(`${routes.teacherLegal}?tab=privacy`)}
      />
      <StudioSidebarItem
        icon={<Scale className="h-4 w-4" />}
        label="شروط الاستخدام"
        active={pathname.startsWith(routes.teacherLegal) && tab === "terms"}
        collapsed={collapsed}
        onClick={() => onNavigate(`${routes.teacherLegal}?tab=terms`)}
      />
    </>
  );
}

export function WorkspaceLeftSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeTenant } = useTenantContext();
  const instructorsEnabled = activeTenant?.feature_flags?.has_instructors === true;
  const blogEnabled = activeTenant?.feature_flags?.has_blog === true;
  const servicesEnabled = activeTenant?.feature_flags?.has_services === true;
  const {
    leftSidebarOpen,
    leftSidebarWidth,
    leftSidebarCollapsed,
    mobileMenuOpen,
    setLeftSidebarWidth,
    setLeftSidebarCollapsed,
    setMobileMenuOpen,
  } = useWorkspaceStore();

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      if (mobileMenuOpen) setMobileMenuOpen(false);
    },
    [router, mobileMenuOpen, setMobileMenuOpen],
  );

  const [isResizing, setIsResizing] = useState(false);
  const isRTL = typeof document !== "undefined"
    ? document.documentElement.dir === "rtl"
    : true;

  const currentWidth = leftSidebarCollapsed ? COLLAPSED_WIDTH : leftSidebarWidth;

  const handleCollapseToggle = useCallback(() => {
    setLeftSidebarCollapsed(!leftSidebarCollapsed);
  }, [leftSidebarCollapsed, setLeftSidebarCollapsed]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      const startX = e.clientX;
      const startWidth = leftSidebarWidth;

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = isRTL
          ? startWidth - delta
          : startWidth + delta;
        setLeftSidebarWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [leftSidebarWidth, setLeftSidebarWidth, isRTL],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "[" && e.metaKey) {
        e.preventDefault();
        handleCollapseToggle();
      }
    },
    [handleCollapseToggle],
  );

  useEffect(() => {
    if (!leftSidebarOpen) {
      setLeftSidebarCollapsed(true);
    }
  }, [leftSidebarOpen, setLeftSidebarCollapsed]);

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col overflow-hidden border-l border-studio-border bg-studio-glass-sidebar backdrop-blur-xl transition-[width] duration-300 ease-in-out",
        isResizing && "select-none",
      )}
      style={{ width: currentWidth }}
      role="navigation"
      aria-label="القائمة الجانبية"
      onKeyDown={handleKeyDown}
      dir="auto"
    >
        {/* Resize handle (only when expanded) */}
        {!leftSidebarCollapsed && (
          <div
            onMouseDown={handleResizeStart}
            className={cn(
              "absolute top-0 z-20 flex w-3 cursor-col-resize items-center justify-center transition-colors hover:bg-studio-accent/20",
              isResizing && "bg-studio-accent/20",
              isRTL ? "left-0" : "right-0",
            )}
            style={{ height: "100%" }}
            role="separator"
            aria-orientation="vertical"
            aria-label="تغيير عرض القائمة"
            tabIndex={0}
          >
            <GripVertical className="h-4 w-4 text-studio-fg-subtle" aria-hidden="true" />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top section */}
          <div className="flex shrink-0 items-center justify-between border-b border-studio-border px-3 py-3">
            {!leftSidebarCollapsed && (
              <span className="text-xs font-semibold text-studio-fg-muted px-1">
                مساحة العمل
              </span>
            )}
            <StudioButton
              variant="ghost"
              size="icon"
              onClick={handleCollapseToggle}
              aria-label={leftSidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
            >
              {leftSidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </StudioButton>
          </div>

          {/* Scrollable nav area */}
          <div className="flex-1 overflow-y-auto studio-scrollbar py-2">
            {/* Workspace Switcher */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "التبديل"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Layout className="h-4 w-4" />}
                label="مساحة العمل"
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.tenantDashboard)}
              />
            </StudioSidebarSection>

            {/* Navigation */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "التنقل"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Home className="h-4 w-4" />}
                label="الرئيسية"
                active={pathname === routes.dashboard}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboard)}
              />
              <StudioSidebarItem
                icon={<Layout className="h-4 w-4" />}
                label="الكورسات"
                active={pathname.startsWith("/teacher/courses")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate("/teacher/courses")}
              />
              {instructorsEnabled && (
                <StudioSidebarItem
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="المدربون"
                  active={pathname.startsWith(routes.tenantInstructors)}
                  collapsed={leftSidebarCollapsed}
                  onClick={() => handleNavigate(routes.tenantInstructors)}
                />
              )}
              <StudioSidebarItem
                icon={<Video className="h-4 w-4" />}
                label="مكتبة الفيديوهات"
                active={pathname.startsWith(routes.dashboardVideoLibrary)}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardVideoLibrary)}
              />
              <StudioSidebarItem
                icon={<Images className="h-4 w-4" />}
                label="مكتبة الوسائط"
                active={pathname.startsWith(routes.dashboardMediaLibrary)}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardMediaLibrary)}
              />
              <StudioSidebarItem
                icon={<ClipboardList className="h-4 w-4" />}
                label="مكتبة الاختبارات"
                active={pathname.startsWith("/teacher/exams")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardExams)}
              />
              <StudioSidebarItem
                icon={<ClipboardCheck className="h-4 w-4" />}
                label="تصحيح إجابات الطلاب"
                active={
                  pathname.startsWith(routes.dashboardGrading) ||
                  pathname.includes("/grading")
                }
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardGrading)}
              />
              <StudioSidebarItem
                icon={<BookOpen className="h-4 w-4" />}
                label="المواد"
                active={pathname.startsWith("/teacher/subjects")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardSubjects)}
              />
              <StudioSidebarItem
                icon={<GraduationCap className="h-4 w-4" />}
                label="الطلاب"
                active={pathname.startsWith("/teacher/students")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardStudents)}
              />
              <StudioSidebarItem
                icon={<Award className="h-4 w-4" />}
                label="الشهادات"
                active={pathname.startsWith(routes.dashboardCertificates)}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardCertificates)}
              />
              <StudioSidebarItem
                icon={<TicketCheck className="h-4 w-4" />}
                label="أكواد الشحن"
                active={pathname.startsWith("/teacher/recharge-codes")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardRechargeCodes)}
              />
            </StudioSidebarSection>

            {/* Pinned area */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "المثبت"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Pin className="h-4 w-4" />}
                label="مساحة مثبتة"
                collapsed={leftSidebarCollapsed}
              />
            </StudioSidebarSection>

            {/* Favorites placeholder */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "المفضلة"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Star className="h-4 w-4" />}
                label="سيتم إضافة المفضلة"
                collapsed={leftSidebarCollapsed}
              />
            </StudioSidebarSection>

            {/* Settings */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "الإعدادات"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Search className="h-4 w-4" />}
                label="إعدادات SEO"
                active={pathname.startsWith(routes.seoSettings)}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.seoSettings)}
              />
              <StudioSidebarItem
                icon={<Globe className="h-4 w-4" />}
                label="إعدادات الموقع"
                active={pathname.startsWith(routes.dashboardSiteSettings)}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardSiteSettings)}
              />
              <StudioSidebarItem
                icon={<ImageIcon className="h-4 w-4" />}
                label="الشعار واسم المنصة"
                active={pathname.startsWith(routes.dashboardBranding)}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.dashboardBranding)}
              />
              <StudioSidebarItem
                icon={<Palette className="h-4 w-4" />}
                label="مظهر لوحة التحكم"
                active={pathname.startsWith("/teacher/settings/appearance")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate("/teacher/settings/appearance")}
              />
              <StudioSidebarItem
                icon={<CreditCard className="h-4 w-4" />}
                label="بوابات الدفع"
                active={pathname.startsWith("/teacher/settings/payment-gateway")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate("/teacher/settings/payment-gateway")}
              />
            
              <StudioSidebarItem
                icon={<MessageSquare className="h-4 w-4" />}
                label="إعدادات واتساب"
                active={pathname.startsWith("/teacher/settings/whatsapp")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate("/teacher/settings/whatsapp")}
              />
              <StudioSidebarItem
                icon={<Mail className="h-4 w-4" />}
                label="إعدادات البريد الإلكتروني"
                active={pathname.startsWith("/teacher/settings/mail")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate("/teacher/settings/mail")}
              />
</StudioSidebarSection>

            {/* Homepage management */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "إدارة الصفحة الرئيسية"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Home className="h-4 w-4" />}
                label="إدارة الصفحة الرئيسية"
                active={pathname.startsWith("/teacher/homepage")}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.homepageNews)}
              />
              <StudioSidebarItem
                icon={<Megaphone className="h-4 w-4" />}
                label="شريط الأخبار"
                active={pathname === routes.homepageNews}
                collapsed={leftSidebarCollapsed}
                className="ps-7"
                onClick={() => handleNavigate(routes.homepageNews)}
              />
              <StudioSidebarItem
                icon={<User className="h-4 w-4" />}
                label="البطاقة التعريفية"
                active={pathname === routes.homepageHero}
                collapsed={leftSidebarCollapsed}
                className="ps-7"
                onClick={() => handleNavigate(routes.homepageHero)}
              />
              <StudioSidebarItem
                icon={<Award className="h-4 w-4" />}
                label="لماذا تختارنا؟"
                active={pathname === routes.homepageWhyChooseUs}
                collapsed={leftSidebarCollapsed}
                className="ps-7"
                onClick={() => handleNavigate(routes.homepageWhyChooseUs)}
              />
              <StudioSidebarItem
                icon={<GraduationCap className="h-4 w-4" />}
                label="المراحل الدراسية"
                active={pathname === routes.homepageEducationalStages}
                collapsed={leftSidebarCollapsed}
                className="ps-7"
                onClick={() => handleNavigate(routes.homepageEducationalStages)}
              />
              <StudioSidebarItem
                icon={<MessagesSquare className="h-4 w-4" />}
                label="سكشن منتدى الطلاب"
                active={pathname === routes.homepageCommunity}
                collapsed={leftSidebarCollapsed}
                className="ps-7"
                onClick={() => handleNavigate(routes.homepageCommunity)}
              />
            </StudioSidebarSection>

            {/* Site pages (legal + footer) */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "صفحات الموقع"} collapsed={leftSidebarCollapsed}>
              {servicesEnabled && <StudioSidebarItem icon={<BriefcaseBusiness className="h-4 w-4" />} label="إدارة الخدمات" active={pathname.startsWith(routes.dashboardServices)} collapsed={leftSidebarCollapsed} onClick={() => handleNavigate(routes.dashboardServices)} />}
              {blogEnabled && (
                <StudioSidebarItem
                  icon={<Newspaper className="h-4 w-4" />}
                  label="المدونة"
                  active={pathname.startsWith(routes.dashboardBlog)}
                  collapsed={leftSidebarCollapsed}
                  onClick={() => handleNavigate(routes.dashboardBlog)}
                />
              )}
              <StudioSidebarItem
                icon={<Info className="h-4 w-4" />}
                label="صفحة من نحن"
                active={pathname.startsWith(routes.teacherAbout)}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.teacherAbout)}
              />
              <Suspense fallback={null}>
                <LegalPageItems
                  collapsed={leftSidebarCollapsed}
                  pathname={pathname}
                  onNavigate={handleNavigate}
                />
              </Suspense>
              <StudioSidebarItem
                icon={<PanelBottom className="h-4 w-4" />}
                label="محتوى الفوتر"
                active={pathname.startsWith(routes.teacherFooter)}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.teacherFooter)}
              />
              <StudioSidebarItem
                icon={<Compass className="h-4 w-4" />}
                label="صفحة من نحن"
                active={pathname.startsWith(routes.teacherAbout)}
                collapsed={leftSidebarCollapsed}
                onClick={() => handleNavigate(routes.teacherAbout)}
              />
            </StudioSidebarSection>
          </div>
        </div>
    </aside>
  );
}
```

---

## `apps/web/src/features/instructors/InstructorWorkspaceLayout.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Images,
  LayoutDashboard,
  LogOut,
  Users,
  Newspaper,
  Award,
  Video,
} from "lucide-react";
import { useInstructorAuth } from "./InstructorAuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { getTeacherAvatar } from "@/lib/teacher-avatar";

const navigation = [
  { href: "/instructor", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/instructor/courses", label: "الدورات", icon: BookOpen },
  { href: "/instructor/video-library", label: "مكتبة الفيديوهات", icon: Video },
  { href: "/instructor/media-library", label: "مكتبة الوسائط", icon: Images },
  { href: "/instructor/students", label: "الطلاب", icon: Users },
  { href: "/instructor/certificates", label: "الشهادات", icon: Award },
  { href: "/instructor/exams", label: "مكتبة الاختبارات", icon: GraduationCap },
  { href: "/instructor/grading", label: "تصحيح الإجابات", icon: ClipboardCheck },
];

export function InstructorWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useInstructorAuth();
  const { activeTenant } = useTenantContext();
  const blogEnabled = activeTenant?.feature_flags?.has_blog === true;

  if (pathname === "/instructor/login" || pathname === "/instructor/change-password") {
    return <>{children}</>;
  }

  return (
    <div className="tenant-theme studio-nova flex min-h-dvh flex-col bg-studio-bg text-studio-fg md:h-dvh md:overflow-hidden">
      <header className="z-10 flex min-h-16 items-center justify-between border-b border-studio-border bg-studio-panel/95 px-4 backdrop-blur md:px-6">
        <Link href="/instructor" className="flex items-center gap-3 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block leading-tight">مساحة المدرّب</span>
            <span className="text-xs font-normal text-muted-foreground">إدارة التعليم والمحتوى</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/profile"
            className="hidden items-center gap-2 rounded-xl border border-studio-border px-3 py-2 text-sm transition hover:border-primary sm:flex"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getTeacherAvatar(user?.avatar, user?.gender)}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="max-w-40 truncate">{user?.name}</span>
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-xl border border-studio-border px-3 py-2 text-sm transition hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="border-b border-studio-border bg-studio-panel md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-l">
          <div className="flex gap-2 overflow-x-auto p-3 md:block md:space-y-1 md:p-4">
            <p className="hidden px-3 pb-2 pt-1 text-[11px] font-semibold tracking-wider text-muted-foreground md:block">
              مساحة العمل
            </p>
            {[...navigation, ...(blogEnabled ? [{ href: "/instructor/blog", label: "المدونة", icon: Newspaper }] : [])].map(({ href, label, icon: Icon }) => {
              const active = href === "/instructor"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition md:w-full ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-studio-hover hover:text-studio-fg"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
            <Link
              href="/instructor/profile"
              aria-current={pathname === "/instructor/profile" ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition md:w-full ${
                pathname === "/instructor/profile"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-studio-hover hover:text-studio-fg"
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>الملف الشخصي</span>
            </Link>
          </div>
          <div className="mx-4 mb-4 hidden rounded-2xl border border-studio-border bg-studio-bg p-4 md:block">
            <p className="text-xs font-semibold">مساحة آمنة ومستقلة</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              تعرض هذه اللوحة الدورات والطلاب والملفات المرتبطة بحسابك فقط.
            </p>
          </div>
        </aside>

        <main className="tenant-aurora min-h-0 flex-1 md:overflow-y-auto studio-scrollbar" role="main">
          <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 md:px-6 md:py-6 lg:px-8">{children}</div>
        </main>
      </div>
      <footer className="hidden h-8 items-center justify-between border-t border-studio-border bg-studio-panel px-5 text-[11px] text-muted-foreground md:flex">
        <span>مساحة المدرّب</span>
        <span>بياناتك معزولة عن حسابات المدرّبين الآخرين</span>
      </footer>
    </div>
  );
}
```

---

## `apps/web/src/features/course-studio/components/CourseStudio.tsx`

```tsx
"use client";

import { useEffect, useCallback, useState, useMemo, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  ListTree,
  Plus,
  Send,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { useCourseStudioStore } from "../store";
import { CourseStudioHeader } from "./CourseStudioHeader";
import { CourseStudioBreadcrumb } from "./CourseStudioBreadcrumb";
import { CourseStudioNavigator } from "./CourseStudioNavigator";
import { CourseStudioCanvas } from "./CourseStudioCanvas";
import { CourseStudioInspector } from "./CourseStudioInspector";
import { CourseStudioOnboarding } from "./CourseStudioOnboarding";
import { CourseStudioLoading } from "./CourseStudioLoading";
import { CourseStudioCreateLectureDialog } from "./CourseStudioCreateLectureDialog";
import { CourseStudioEditLectureDialog } from "./CourseStudioEditLectureDialog";
import { CourseStudioCreateSectionDialog } from "./CourseStudioCreateSectionDialog";
import { CourseStudioEditSectionDialog } from "./CourseStudioEditSectionDialog";
import { CourseStudioContentPicker } from "./CourseStudioContentPicker";
import { CourseStudioEditContentDialog } from "./CourseStudioEditContentDialog";
import { CourseStudioContentDetailsDialog } from "./CourseStudioContentDetailsDialog";
import { CourseStudioSessionPickerDialog } from "./CourseStudioSessionPickerDialog";
import { CourseStudioAddItemChoiceDialog } from "./CourseStudioAddItemChoiceDialog";
import { CourseStudioSessionEditDialog } from "./CourseStudioSessionEditDialog";
import { courseSessionsApi } from "@/features/course-sessions/api";
import { CourseStudioExternalLinkDialog } from "./CourseStudioExternalLinkDialog";
import { CourseStudioContentOnboarding } from "./CourseStudioContentOnboarding";
import { useLectures, useCreateLecture, useUpdateLecture, usePublishLecture, useArchiveLecture, useDuplicateLecture, useDeleteLecture, useRestoreLecture, useReorderLectures, useSelectAndScroll } from "../hooks/useLectures";
import { useSectionsList, useCreateSectionAction, useUpdateSectionAction, useDeleteSectionAction, usePublishSectionAction, useArchiveSectionAction, useDuplicateSectionAction, useRestoreSectionAction, useReorderSectionsAction, useMoveSectionAction, useSelectAndScrollSection } from "../hooks/useSections";
import { useLessons, useCreateLesson, useUpdateLesson, useDeleteLesson, usePublishLesson, useArchiveLesson, useDuplicateLesson, useRestoreLesson, useReorderLessons, useToggleFreePreview, useAttachLessonVideo, useAttachLessonFile } from "@/features/lessons/hooks";
import type { BreadcrumbItem } from "./CourseStudioBreadcrumb";
import type { CourseModule, CreateCourseModulePayload, UpdateCourseModulePayload } from "@/features/course-modules/types";
import type { CourseSection, CreateCourseSectionPayload, UpdateCourseSectionPayload } from "@/features/course-sections/types";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";
import { CONTENT_TYPE_CONFIG } from "@/features/course-content/constants";
import { ExamPicker } from "@/features/exam-bank";
import { MediaPicker } from "@/features/media-library/components/MediaPicker";
import { libraryForAllowedTypes } from "@/features/media-library/constants";
import type { MediaType } from "@/features/media-library/types";

const MEDIA_PICKER_TYPES: Partial<Record<ContentItemType, MediaType[]>> = {
  video: ["video"],
  pdf: ["pdf", "document"],
  audio: ["audio"],
  resource: ["document", "zip", "file"],
};

const CONTENT_TO_LESSON_TYPE: Record<string, string> = {
  video: "video",
  pdf: "pdf",
  audio: "audio",
  resource: "text",
};

export type StudioMode = "loading" | "empty" | "ready";

interface CourseStudioProps {
  mode?: StudioMode;
  courseId?: string;
  courseName?: string;
  courseStatus?: string;
  courseVisibility?: string;
  studentsCount?: number;
  lastEdited?: string;
  isSaving?: boolean;
  isSaved?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
  navigatorWidth?: number;
  inspectorWidth?: number;
  onQuickStart?: () => void;
  onPublish?: () => void;
  onQuickAction?: (action: string) => void;
  instructorMode?: boolean;
}

// الشاشات الصغيرة والمتوسطة بتستخدم وضع اللوحة الواحدة + الأدراج،
// عشان مساحة العمل ما تتزاحمش في عرض أقل من 1024px.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

function CourseStudio({
  mode = "empty",
  courseId,
  courseName,
  courseStatus,
  courseVisibility,
  studentsCount,
  lastEdited,
  isSaving,
  isSaved,
  breadcrumbItems,
  navigatorWidth = 300,
  inspectorWidth = 320,
  onQuickStart,
  onPublish,
  onQuickAction,
  instructorMode = false,
}: CourseStudioProps) {
  const isMobile = useIsMobile();
  const store = useCourseStudioStore();
  const [editContentItem, setEditContentItem] = useState<ContentItem | null>(null);

  const [pendingContent, setPendingContent] = useState<{
    kind: "media" | "exam";
    mediaId?: number;
    examId?: string;
    contentType?: ContentItemType;
    defaultTitle: string;
  } | null>(null);
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);
  const [addChoiceOpen, setAddChoiceOpen] = useState(false);
  const [sessionModulePickerOpen, setSessionModulePickerOpen] = useState(false);
  const [sessionEditId, setSessionEditId] = useState<string | null>(null);
  const [externalEditItem, setExternalEditItem] = useState<ContentItem | null>(null);

  const { data: lecturesData, isLoading: lecturesLoading } = useLectures(courseId ?? null);
  const lectures: CourseModule[] = (lecturesData?.data ?? []).sort(
    (a, b) => a.order - b.order,
  );

  const { data: sectionsData } = useSectionsList(courseId ?? null);

  const sectionsByLecture = useMemo(() => {
    const map: Record<string, CourseSection[]> = {};
    if (sectionsData?.data) {
      const sorted = [...sectionsData.data].sort((a, b) => a.order - b.order);
      for (const section of sorted) {
        const lectureId = section.courseModuleId ?? courseId;
        if (lectureId && typeof lectureId === "string") {
          if (!map[lectureId]) map[lectureId] = [];
          map[lectureId].push(section);
        }
      }
    }
    return map;
  }, [sectionsData, courseId]);

  const selectedLecture: CourseModule | null = lectures.find((l) => l.id === store.selectedLectureId) ?? null;

  const allSections = sectionsData?.data ?? [];
  const selectedSection: CourseSection | null = allSections.find(
    (s) => s.id === store.selectedSectionId,
  ) ?? null;

  const notDeletedLessons = (id: string) => (data: any) => (data?.data ?? []).filter((l: any) => !l.deletedAt);

  const { data: lessonsData } = useLessons(
    courseId ?? null,
    store.selectedSectionId,
  );
  const contentItems: ContentItem[] = useMemo(() => {
    if (!lessonsData?.data) return [];
    return lessonsData.data
      .filter((l: any) => !l.deletedAt)
      .sort((a: any, b: any) => a.order - b.order)
      .map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        type: (lesson.lessonType === "text" ? "resource" : lesson.lessonType === "external" ? "external_link" : lesson.lessonType) as ContentItemType,
        status: lesson.status === "archived" ? "archived" as const : lesson.status === "published" ? "published" as const : "draft" as const,
        visibility: lesson.visibility === "public" ? "public" as const : lesson.visibility === "preview" ? "preview" as const : "private" as const,
        duration: lesson.estimatedDuration ?? lesson.durationSeconds ?? null,
        freePreview: lesson.freePreview ?? false,
        locked: false,
        order: lesson.order ?? 0,
        thumbnail: null,
        description: lesson.shortDescription ?? lesson.description,
        examId: lesson.examId ?? null,
        externalUrl: lesson.externalUrl ?? lesson.external_url ?? null,
        courseSessionId: lesson.courseSessionId ?? null,
        courseSession: lesson.courseSession ?? null,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      } satisfies ContentItem));
  }, [lessonsData]);

  const selectedContent: ContentItem | null = contentItems.find(
    (c) => c.id === store.selectedContentId,
  ) ?? null;

  const canvasView = store.selectionType === "content" ? "content" as const
    : store.selectionType === "section" ? "section" as const
    : store.selectionType === "lecture" ? "lecture" as const
    : null;

  const createLecture = useCreateLecture();
  const updateLecture = useUpdateLecture();
  const publishLecture = usePublishLecture();
  const archiveLecture = useArchiveLecture();
  const duplicateLecture = useDuplicateLecture();
  const deleteLecture = useDeleteLecture();
  const restoreLecture = useRestoreLecture();
  const reorderLectures = useReorderLectures();

  const createSection = useCreateSectionAction();
  const updateSection = useUpdateSectionAction();
  const deleteSection = useDeleteSectionAction();
  const publishSection = usePublishSectionAction();
  const archiveSectionAction = useArchiveSectionAction();
  const duplicateSection = useDuplicateSectionAction();
  const restoreSection = useRestoreSectionAction();
  const reorderSections = useReorderSectionsAction();
  const moveSection = useMoveSectionAction();

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const publishLesson = usePublishLesson();
  const archiveLesson = useArchiveLesson();
  const duplicateLesson = useDuplicateLesson();
  const deleteLesson = useDeleteLesson();
  const restoreLesson = useRestoreLesson();
  const reorderLessons = useReorderLessons();
  const toggleFreePreview = useToggleFreePreview();
  const attachVideo = useAttachLessonVideo();
  const attachFile = useAttachLessonFile();

  const { selectAndScroll } = useSelectAndScroll(
    store.selectLecture,
  );

  const { selectAndScroll: selectAndScrollSection } = useSelectAndScrollSection(
    store.selectSection,
  );

  const openAddChoice = useCallback(() => setAddChoiceOpen(true), []);
  const closeAddChoice = useCallback(() => setAddChoiceOpen(false), []);

  const handleSessionModuleSelected = useCallback(
    async (session: any) => {
      if (!courseId) return;
      try {
        await createLecture.create(courseId, {
          title: session.title,
          course_session_id: Number(session.id),
          order: lectures.length,
        } as any);
        setSessionModulePickerOpen(false);
        toast.success(`تم إضافة الجلسة "${session.title}" إلى المنهج`);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "فشل إضافة الجلسة إلى المنهج";
        toast.error(String(msg));
      }
    },
    [courseId, createLecture, lectures.length],
  );

  const handleCreateLecture = useCallback(
    async (payload: CreateCourseModulePayload) => {
      if (!courseId) return;
      try {
        const result = await createLecture.create(courseId, payload);
        store.closeCreateDialog();
        toast.success("تم إنشاء المحاضرة بنجاح");
        if (result?.id) {
          store.expandLecture(result.id);
          selectAndScroll(result.id);
        }
      } catch {
        toast.error("فشل إنشاء المحاضرة");
      }
    },
    [courseId, createLecture, selectAndScroll, store.closeCreateDialog, store.expandLecture],
  );

  const handleUpdateLecture = useCallback(
    async (payload: UpdateCourseModulePayload) => {
      if (!courseId || !store.editLecture) return;
      try {
        await updateLecture.update(courseId, store.editLecture.id, payload);
        store.closeEditDialog();
        toast.success("تم تحديث المحاضرة بنجاح");
      } catch {
        toast.error("فشل تحديث المحاضرة");
      }
    },
    [courseId, store.editLecture, updateLecture, store.closeEditDialog],
  );

  const handlePublishLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await publishLecture.publish(courseId, lecture.id);
        toast.success(`تم نشر "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل نشر المحاضرة");
      }
    },
    [courseId, publishLecture],
  );

  const handleArchiveLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await archiveLecture.archive(courseId, lecture.id);
        toast.success(`تم أرشفة "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل أرشفة المحاضرة");
      }
    },
    [courseId, archiveLecture],
  );

  const handleDuplicateLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await duplicateLecture.duplicate(courseId, lecture.id);
        toast.success(`تم نسخ "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل نسخ المحاضرة");
      }
    },
    [courseId, duplicateLecture],
  );

  const handleDeleteLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await deleteLecture.remove(courseId, lecture.id);
        if (store.selectedLectureId === lecture.id) {
          store.clearSelection();
        }
        toast.success(`تم حذف "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل حذف المحاضرة");
      }
    },
    [courseId, deleteLecture, store.selectedLectureId, store.clearSelection],
  );

  const handleRestoreLecture = useCallback(
    async (lecture: CourseModule) => {
      if (!courseId) return;
      try {
        await restoreLecture.restore(courseId, lecture.id);
        toast.success(`تم استعادة "${lecture.title}" بنجاح`);
      } catch {
        toast.error("فشل استعادة المحاضرة");
      }
    },
    [courseId, restoreLecture],
  );

  const handleReorder = useCallback(
    async (_lectures: CourseModule[], fromIndex: number, toIndex: number) => {
      if (!courseId) return;
      const reordered = [..._lectures];
      const moved = reordered.splice(fromIndex, 1)[0];
      if (!moved) return;
      reordered.splice(toIndex, 0, moved);
      const items = reordered.map((l, i) => ({
        id: parseInt(l.id, 10),
        order: i + 1,
      }));
      try {
        await reorderLectures.reorder(courseId, items);
        toast.success("تم إعادة ترتيب المحاضرات");
      } catch {
        toast.error("فشل إعادة الترتيب");
      }
    },
    [courseId, reorderLectures],
  );

  const handleSelectLecture = useCallback(
    (id: string) => {
      store.selectLecture(id);
    },
    [store.selectLecture],
  );

  const handleToggleLecture = useCallback(
    (id: string) => {
      store.toggleLectureExpanded(id);
    },
    [store.toggleLectureExpanded],
  );

  const handleSelectSection = useCallback(
    (id: string) => {
      store.selectSection(id);
      store.setInspectorOpen(true);
    },
    [store.selectSection, store.setInspectorOpen],
  );

  const handleAddSection = useCallback(
    (lectureId: string) => {
      store.openCreateSectionDialog(lectureId);
    },
    [store.openCreateSectionDialog],
  );

  const handleReorderSections = useCallback(
    async (courseId: string, sections: Array<{ id: number; sort_order: number }>) => {
      try {
        await reorderSections.reorder(courseId, sections);
        toast.success("تم إعادة ترتيب الأقسام بنجاح");
      } catch {
        toast.error("فشل إعادة ترتيب الأقسام");
      }
    },
    [reorderSections],
  );

  const handleCreateSection = useCallback(
    async (payload: CreateCourseSectionPayload) => {
      if (!courseId || !store.createSectionLectureId) return;
      try {
        const result = await createSection.create(courseId, {
          ...payload,
          course_module_id: store.createSectionLectureId,
        });
        store.closeCreateSectionDialog();
        toast.success("تم إنشاء القسم بنجاح");
        if (result?.id) {
          store.expandLecture(store.createSectionLectureId);
          selectAndScrollSection(result.id);
          store.selectSection(result.id);
          store.setInspectorOpen(true);
        }
      } catch {
        toast.error("فشل إنشاء القسم");
      }
    },
    [courseId, createSection, store.createSectionLectureId, store.closeCreateSectionDialog, store.expandLecture, selectAndScrollSection, store.selectSection, store.setInspectorOpen],
  );

  const handleUpdateSection = useCallback(
    async (payload: UpdateCourseSectionPayload) => {
      if (!courseId || !store.editSection) return;
      try {
        await updateSection.update(courseId, store.editSection.id, payload);
        store.closeEditSectionDialog();
        toast.success("تم تحديث القسم بنجاح");
      } catch {
        toast.error("فشل تحديث القسم");
      }
    },
    [courseId, store.editSection, updateSection, store.closeEditSectionDialog],
  );

  const handlePublishSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await publishSection.publish(courseId, section.id);
        toast.success(`تم نشر "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل نشر القسم");
      }
    },
    [courseId, publishSection],
  );

  const handleArchiveSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await archiveSectionAction.archive(courseId, section.id);
        toast.success(`تم أرشفة "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل أرشفة القسم");
      }
    },
    [courseId, archiveSectionAction],
  );

  const handleDuplicateSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await duplicateSection.duplicate(courseId, section.id);
        toast.success(`تم نسخ "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل نسخ القسم");
      }
    },
    [courseId, duplicateSection],
  );

  const handleDeleteSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await deleteSection.remove(courseId, section.id);
        if (store.selectedSectionId === section.id) {
          store.selectLecture(store.selectedLectureId);
        }
        toast.success(`تم حذف "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل حذف القسم");
      }
    },
    [courseId, deleteSection, store.selectedSectionId, store.selectedLectureId, store.selectLecture],
  );

  const handleRestoreSection = useCallback(
    async (section: CourseSection) => {
      if (!courseId) return;
      try {
        await restoreSection.restore(courseId, section.id);
        toast.success(`تم استعادة "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل استعادة القسم");
      }
    },
    [courseId, restoreSection],
  );

  const handleMoveSection = useCallback(
    async (section: CourseSection, lectureId: string | null) => {
      if (!courseId) return;
      try {
        await moveSection.move(courseId, section.id, lectureId);
        toast.success(`تم نقل "${section.title}" بنجاح`);
      } catch {
        toast.error("فشل نقل القسم");
      }
    },
    [courseId, moveSection],
  );

  const handleSelectContent = useCallback(
    async (id: string) => {
      store.selectContent(id);
      store.setInspectorOpen(true);
      const item = contentItems.find((c) => c.id === id);
      if (!item) return;
      const isSession = item.type === "session" || item.type === "live" || !!item.courseSessionId;
      if (isSession) {
        if (item.courseSessionId) {
          setSessionEditId(item.courseSessionId);
          return;
        }
        if (courseId && store.selectedSectionId) {
          try {
            const now = new Date();
            const end = new Date(now.getTime() + 60 * 60 * 1000);
            const session = await courseSessionsApi.create(courseId, {
              title: item.title || "جلسة مباشرة",
              description: (item as any).shortDescription || (item as any).description || null,
              session_type: "live",
              status: "draft",
              starts_at_utc: now.toISOString(),
              ends_at_utc: end.toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
              meeting_url: null,
            });
            await updateLesson.mutateAsync({
              courseId,
              sectionId: store.selectedSectionId,
              id: item.id,
              data: { lesson_type: "session" as any, course_session_id: Number(session.id) },
            });
            setSessionEditId(session.id);
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "تعذر فتح الجلسة للتعديل");
          }
        }
        return;
      }
      if (item.type === "external_link") {
        setExternalEditItem(item);
      }
    },
    [store.selectContent, store.setInspectorOpen, contentItems, courseId, store.selectedSectionId, updateLesson],
  );

  const handleAddContent = useCallback(
    () => {
      store.openContentPicker();
    },
    [store.openContentPicker],
  );

  const handleContentTypeSelected = useCallback(
    (type: ContentItemType) => {
      if (!courseId || !store.selectedSectionId) return;

      if (type === "exam") {
        store.openExamPicker();
        return;
      }

      if (type === "session" || type === "live") {
        setSessionPickerOpen(true);
        return;
      }

      if (MEDIA_PICKER_TYPES[type]) {
        store.openMediaPicker(type);
        return;
      }

      store.triggerExtension(type);
      const sectionId = store.selectedSectionId;
      const nextOrder = contentItems.length;
      createLesson.mutateAsync({
        courseId,
        sectionId,
        data: {
          title: `${CONTENT_TYPE_CONFIG[type].label} جديد`,
          lesson_type: type === "external_link" ? "external" as any : type === "resource" ? "text" as any : type as any,
          sort_order: nextOrder + 1,
        },
      }).then((created: any) => {
        toast.success(`تم إضافة ${CONTENT_TYPE_CONFIG[type].label} بنجاح`);
        store.clearExtension();
        if (type === "external_link" && created) {
          const c = created?.data ?? created;
          setExternalEditItem({
            id: String(c.id ?? ""),
            title: c.title ?? "رابط خارجي",
            type: "external_link",
            status: "draft",
            visibility: "private",
            duration: null,
            freePreview: false,
            locked: false,
            order: c.order ?? c.sort_order ?? 0,
            externalUrl: c.externalUrl ?? c.external_url ?? null,
            description: c.shortDescription ?? c.description ?? null,
            createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
            updatedAt: c.updatedAt ?? c.updated_at ?? new Date().toISOString(),
          } as any);
        }
      }).catch(() => {
        toast.error(`فشل إنشاء ${CONTENT_TYPE_CONFIG[type].label}`);
        store.clearExtension();
      });
    },
    [courseId, store.selectedSectionId, store.openMediaPicker, store.triggerExtension, store.clearExtension, contentItems.length, createLesson],
  );

  const handleExamPicked = useCallback(
    (result: { id: string; ids: string[]; title: string }) => {
      if (!courseId || !store.selectedSectionId) return;
      store.closeExamPicker();
      setPendingContent({
        kind: "exam",
        examId: result.id,
        defaultTitle: result.title,
      });
    },
    [courseId, store.selectedSectionId, store.closeExamPicker],
  );

  const handleMediaSelected = useCallback(
    (result: { id: number; ids: number[]; title?: string | null }) => {
      if (!courseId || !store.selectedSectionId) return;
      const contentType = store.mediaPickerContentType ?? "video";
      const typeLabel = CONTENT_TYPE_CONFIG[contentType]?.label ?? "الوسائط";
      store.closeMediaPicker();
      setPendingContent({
        kind: "media",
        mediaId: result.id,
        contentType,
        defaultTitle: result.title || typeLabel,
      });
    },
    [courseId, store.selectedSectionId, store.mediaPickerContentType, store.closeMediaPicker],
  );

  const handleSessionSelected = useCallback(
    async (session: any) => {
      if (!courseId || !store.selectedSectionId) return;
      const sectionId = store.selectedSectionId;
      const nextOrder = contentItems.length + 1;
      try {
        await createLesson.mutateAsync({
          courseId,
          sectionId,
          data: {
            title: session.title,
            lesson_type: "session" as any,
            course_session_id: Number(session.id),
            sort_order: nextOrder,
          },
        });
        toast.success(`تم إضافة الجلسة "${session.title}" إلى المحتوى`);
        setSessionPickerOpen(false);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "فشل إضافة الجلسة للمحتوى";
        toast.error(String(msg));
      }
    },
    [courseId, store.selectedSectionId, contentItems.length, createLesson],
  );

  const handleCreateContent = useCallback(
    async (title: string, description: string) => {
      if (!courseId || !store.selectedSectionId || !pendingContent) return;
      const sectionId = store.selectedSectionId;
      const nextOrder = contentItems.length + 1;
      try {
        if (pendingContent.kind === "media" && pendingContent.mediaId != null) {
          const contentType = pendingContent.contentType ?? "video";
          const lessonType = (CONTENT_TO_LESSON_TYPE[contentType] ?? "video") as any;
          const lesson = await createLesson.mutateAsync({
            courseId,
            sectionId,
            data: {
              title,
              lesson_type: lessonType,
              description: description || null,
              sort_order: nextOrder,
            },
          });
          if (contentType === "video") {
            await attachVideo.mutateAsync({ courseId, sectionId, lessonId: lesson.id, mediaAssetId: pendingContent.mediaId });
          } else {
            await attachFile.mutateAsync({ courseId, sectionId, lessonId: lesson.id, mediaAssetId: pendingContent.mediaId, title });
          }
          toast.success(`تم إضافة "${title}" بنجاح`);
        } else if (pendingContent.examId) {
          await createLesson.mutateAsync({
            courseId,
            sectionId,
            data: {
              title,
              lesson_type: "exam" as any,
              exam_id: Number(pendingContent.examId),
              description: description || null,
              sort_order: nextOrder,
            },
          });
          toast.success(`تم ربط "${title}" بنجاح`);
        }
        setPendingContent(null);
      } catch {
        toast.error("فشل إضافة المحتوى");
      }
    },
    [courseId, store.selectedSectionId, pendingContent, contentItems.length, createLesson, attachVideo, attachFile],
  );

  /* Content action handlers — reuse existing lesson mutations directly */
  const handlePublishContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await publishLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(`تم نشر "${item.title}" بنجاح`);
      } catch { toast.error("فشل نشر المحتوى"); }
    },
    [courseId, store.selectedSectionId, publishLesson],
  );

  const handleArchiveContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await archiveLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(`تم أرشفة "${item.title}" بنجاح`);
      } catch { toast.error("فشل أرشفة المحتوى"); }
    },
    [courseId, store.selectedSectionId, archiveLesson],
  );

  const handleDuplicateContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await duplicateLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(`تم نسخ "${item.title}" بنجاح`);
      } catch { toast.error("فشل نسخ المحتوى"); }
    },
    [courseId, store.selectedSectionId, duplicateLesson],
  );

  const handleDeleteContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await deleteLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        if (store.selectedContentId === item.id) {
          store.selectSection(store.selectedSectionId);
        }
        toast.success(`تم حذف "${item.title}" بنجاح`);
      } catch { toast.error("فشل حذف المحتوى"); }
    },
    [courseId, store.selectedSectionId, deleteLesson, store.selectedContentId, store.selectSection],
  );

  const handleRestoreContent = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await restoreLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(`تم استعادة "${item.title}" بنجاح`);
      } catch { toast.error("فشل استعادة المحتوى"); }
    },
    [courseId, store.selectedSectionId, restoreLesson],
  );

  const handleToggleFreePreview = useCallback(
    async (item: ContentItem) => {
      if (!courseId || !store.selectedSectionId) return;
      try {
        await toggleFreePreview.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: item.id });
        toast.success(item.freePreview ? "تم إيقاف المعاينة المجانية" : "تم تفعيل المعاينة المجانية");
      } catch { toast.error("فشل تحديث المعاينة"); }
    },
    [courseId, store.selectedSectionId, toggleFreePreview],
  );

  const handleEditContent = useCallback(
    async (item: ContentItem) => {
      const isSession = item.type === "session" || item.type === "live" || !!item.courseSessionId;
      if (isSession) {
        if (item.courseSessionId) {
          setSessionEditId(item.courseSessionId);
          return;
        }
        // Legacy session/live content without linked CourseSession: create and link one.
        if (courseId && store.selectedSectionId) {
          try {
            const now = new Date();
            const end = new Date(now.getTime() + 60 * 60 * 1000);
            const session = await courseSessionsApi.create(courseId, {
              title: item.title || "جلسة مباشرة",
              description: (item as any).shortDescription || (item as any).description || null,
              session_type: "live",
              status: "draft",
              starts_at_utc: now.toISOString(),
              ends_at_utc: end.toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
              meeting_url: null,
            });
            await updateLesson.mutateAsync({
              courseId,
              sectionId: store.selectedSectionId,
              id: item.id,
              data: { lesson_type: "session" as any, course_session_id: Number(session.id) },
            });
            setSessionEditId(session.id);
            return;
          } catch (e: any) {
            toast.error(e?.response?.data?.message || "تعذر فتح الجلسة للتعديل");
            return;
          }
        }
      }
      if (item.type === "external_link") {
        setExternalEditItem(item);
        return;
      }
      setEditContentItem(item);
    },
    [courseId, store.selectedSectionId, updateLesson],
  );

  const handleSaveContentTitle = useCallback(
    async (newTitle: string) => {
      if (!courseId || !store.selectedSectionId || !editContentItem) return;
      try {
        await updateLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: editContentItem.id, data: { title: newTitle } });
        toast.success("تم تحديث العنوان بنجاح");
      } catch { toast.error("فشل تحديث العنوان"); } finally {
        setEditContentItem(null);
      }
    },
    [courseId, store.selectedSectionId, editContentItem, updateLesson],
  );

  const handleSaveExternalLink = useCallback(
    async (value: { title: string; external_url: string; short_description: string }) => {
      if (!courseId || !store.selectedSectionId || !externalEditItem) return;
      try {
        await updateLesson.mutateAsync({
          courseId,
          sectionId: store.selectedSectionId,
          id: externalEditItem.id,
          data: {
            title: value.title,
            external_url: value.external_url,
            short_description: value.short_description,
          } as any,
        });
        toast.success("تم حفظ الرابط الخارجي");
        setExternalEditItem(null);
      } catch (e: any) {
        const msg = e?.response?.data?.message || "فشل حفظ الرابط الخارجي";
        toast.error(String(msg));
      }
    },
    [courseId, store.selectedSectionId, externalEditItem, updateLesson],
  );

  const handleReorderContent = useCallback(
    async (_items: ContentItem[], fromIndex: number, toIndex: number) => {
      if (!courseId || !store.selectedSectionId) return;
      const reordered = [..._items];
      const moved = reordered.splice(fromIndex, 1)[0];
      if (!moved) return;
      reordered.splice(toIndex, 0, moved);
      const lessons = reordered.map((l, i) => ({
        id: parseInt(l.id, 10),
        sort_order: i + 1,
      }));
      try {
        await reorderLessons.mutateAsync({ courseId, sectionId: store.selectedSectionId, lessons });
        toast.success("تم إعادة ترتيب المحتوى");
      } catch { toast.error("فشل إعادة الترتيب"); }
    },
    [courseId, store.selectedSectionId, reorderLessons],
  );

  const navigatorOpen = isMobile ? false : store.navigatorOpen;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [previousIsMobile, setPreviousIsMobile] = useState(isMobile);

  // Reset the mobile drawer while rendering when the breakpoint changes, so the
  // effect below only synchronises the store (no cascading render from setState).
  if (previousIsMobile !== isMobile) {
    setPreviousIsMobile(isMobile);
    setMobileNavOpen(false);
  }

  useEffect(() => {
    if (isMobile) {
      store.setNavigatorOpen(false);
      store.setInspectorOpen(false);
    }
  }, [isMobile]);

  const handleToggleNavigator = useCallback(() => {
    if (isMobile) {
      setMobileNavOpen((prev) => !prev);
    } else {
      store.toggleNavigator();
    }
  }, [isMobile, store.toggleNavigator]);

  const handleToggleInspector = useCallback(() => {
    store.toggleInspector();
  }, [store.toggleInspector]);

  const handleCloseInspector = useCallback(() => {
    store.setInspectorOpen(false);
  }, [store.setInspectorOpen]);

  const handleCloseMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const defaultBreadcrumb: BreadcrumbItem[] = breadcrumbItems ?? [
    { label: "الدورات", href: "/teacher/courses" },
    { label: courseName ?? "الاستوديو" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        handleToggleNavigator();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        handleToggleInspector();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleNavigator, handleToggleInspector]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileNavOpen]);

  if (mode === "loading") {
    return <CourseStudioLoading />;
  }

  const nextSectionOrder = store.createSectionLectureId
    ? (sectionsByLecture[store.createSectionLectureId]?.length ?? 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="nova-shell flex h-full min-h-0 flex-col overflow-hidden"
      data-navigator-open={String(navigatorOpen || mobileNavOpen)}
      data-inspector-open={String(store.inspectorOpen)}
      style={
        {
          "--nova-nav-width": `${navigatorWidth}px`,
          "--nova-inspector-width": `${inspectorWidth}px`,
        } as CSSProperties
      }
    >
      <CourseStudioHeader
        courseName={courseName}
        courseStatus={courseStatus}
        visibility={courseVisibility}
        studentsCount={studentsCount}
        lastEdited={lastEdited}
        isSaving={isSaving}
        isSaved={isSaved}
        navigatorOpen={isMobile ? mobileNavOpen : store.navigatorOpen}
        inspectorOpen={store.inspectorOpen}
        onToggleNavigator={handleToggleNavigator}
        onToggleInspector={handleToggleInspector}
        onPublish={onPublish}
        onQuickAction={onQuickAction}
      />

      <div className="nova-crumb-bar flex shrink-0 items-center border-b border-studio-border px-3 py-2 sm:px-5 md:px-6">
        <CourseStudioBreadcrumb items={defaultBreadcrumb} />
      </div>

      <div className="nova-workspace-area">
        {isMobile ? (
          <>
            <CourseStudioCanvas
              selectedLecture={selectedLecture}
              selectedSection={selectedSection}
              selectedContent={selectedContent}
              lectureSections={selectedLecture ? sectionsByLecture[selectedLecture.id] : undefined}
              sectionContents={contentItems}
              canvasView={canvasView}
              onCreateLecture={openAddChoice}
              onAddSection={selectedLecture ? () => handleAddSection(selectedLecture.id) : undefined}
              onSelectSection={handleSelectSection}
              onAddContent={handleAddContent}
              onEditSection={(s) => store.openEditSectionDialog(s)}
              onDuplicateSection={handleDuplicateSection}
              onArchiveSection={handleArchiveSection}
              onDeleteSection={handleDeleteSection}
              onRestoreSection={handleRestoreSection}
              onSelectContent={handleSelectContent}
              onEditContent={handleEditContent}
              onPublishContent={handlePublishContent}
              onArchiveContent={handleArchiveContent}
              onDuplicateContent={handleDuplicateContent}
              onDeleteContent={handleDeleteContent}
              onRestoreContent={handleRestoreContent}
              onToggleFreePreview={instructorMode ? undefined : handleToggleFreePreview}
              onReorderContent={handleReorderContent}
              onQuickStart={onQuickStart}
            />

            <AnimatePresence>
              {mobileNavOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 z-40 bg-studio-overlay"
                    onClick={handleCloseMobileNav}
                    aria-hidden="true"
                  />
                  <motion.aside
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-y-0 end-0 z-50 w-[min(340px,92vw)] max-w-full pb-[env(safe-area-inset-bottom)]"
                    role="dialog"
                    aria-modal="true"
                    aria-label="متصفح المحتوى"
                  >
                    <div className="nova-drawer flex h-full flex-col border-s border-studio-border bg-studio-surface">
                      <div className="nova-panel-head flex shrink-0 items-center justify-between border-b border-studio-border px-3 py-3">
                        <span className="text-sm font-semibold text-studio-fg">تصفّح الدورة</span>
                        <StudioButton variant="ghost" size="icon" onClick={handleCloseMobileNav} aria-label="إغلاق القائمة" className="nova-icon-btn h-11 w-11">
                          <X className="h-4 w-4" />
                        </StudioButton>
                      </div>
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <CourseStudioNavigator
                          variant="drawer"
                          open={mobileNavOpen}
                          width={320}
                          lectures={lectures ?? []}
                          sections={sectionsByLecture}
                          courseId={courseId ?? undefined}
                          selectedLectureId={store.selectedLectureId}
                          selectedSectionId={store.selectedSectionId}
                          expandedLectures={store.expandedLectures}
                          isLoading={lecturesLoading}
                          onSelectLecture={(id) => { handleSelectLecture(id); setMobileNavOpen(false); }}
                          onToggleLecture={handleToggleLecture}
                          onSelectSection={(id) => { handleSelectSection(id); setMobileNavOpen(false); }}
                          onCreateLecture={() => { openAddChoice(); }}
                          onEditLecture={(l) => { store.openEditDialog(l); setMobileNavOpen(false); }}
                          onPublishLecture={handlePublishLecture}
                          onArchiveLecture={handleArchiveLecture}
                          onDuplicateLecture={handleDuplicateLecture}
                          onDeleteLecture={handleDeleteLecture}
                          onRestoreLecture={handleRestoreLecture}
                          onReorder={handleReorder}
                          onEditSection={(s) => { store.openEditSectionDialog(s); setMobileNavOpen(false); }}
                          onPublishSection={handlePublishSection}
                          onArchiveSection={handleArchiveSection}
                          onDuplicateSection={handleDuplicateSection}
                          onDeleteSection={handleDeleteSection}
                          onRestoreSection={handleRestoreSection}
                          onAddSection={handleAddSection}
                          onReorderSections={handleReorderSections}
                        />
                      </div>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {store.inspectorOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 bg-studio-overlay"
                    onClick={handleCloseInspector}
                    aria-hidden="true"
                  />
                  <motion.aside
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 32 }}
                    className="nova-drawer absolute inset-x-0 bottom-0 z-50 flex max-h-[82%] flex-col rounded-t-[24px] bg-studio-surface"
                    role="dialog"
                    aria-modal="true"
                    aria-label="خصائص العنصر"
                  >
                    <div className="flex shrink-0 justify-center py-2" aria-hidden="true">
                      <span className="h-1 w-10 rounded-full bg-studio-border" />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto border-t border-studio-border pb-[env(safe-area-inset-bottom)]">
                      <CourseStudioInspector
                        variant="drawer"
                        open={store.inspectorOpen}
                        width={360}
                        selectedSection={selectedSection}
                        selectedContent={selectedContent}
                        lectures={lectures}
                        onEditSection={(s) => { store.openEditSectionDialog(s); }}
                        onDuplicateSection={handleDuplicateSection}
                        onArchiveSection={handleArchiveSection}
                        onDeleteSection={handleDeleteSection}
                        onRestoreSection={handleRestoreSection}
                        onMoveSection={handleMoveSection}
                        onClose={handleCloseInspector}
                      />
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            <CourseStudioNavigator
              open={navigatorOpen}
              width={navigatorWidth}
              className="nova-float-panel nova-float-navigator"
              lectures={lectures ?? []}
              sections={sectionsByLecture}
              courseId={courseId ?? undefined}
              selectedLectureId={store.selectedLectureId}
              selectedSectionId={store.selectedSectionId}
              expandedLectures={store.expandedLectures}
              isLoading={lecturesLoading}
              onSelectLecture={handleSelectLecture}
              onToggleLecture={handleToggleLecture}
              onSelectSection={handleSelectSection}
              onCreateLecture={openAddChoice}
              onEditLecture={(l) => store.openEditDialog(l)}
              onPublishLecture={handlePublishLecture}
              onArchiveLecture={handleArchiveLecture}
              onDuplicateLecture={handleDuplicateLecture}
              onDeleteLecture={handleDeleteLecture}
              onRestoreLecture={handleRestoreLecture}
              onReorder={handleReorder}
              onEditSection={(s) => store.openEditSectionDialog(s)}
              onPublishSection={handlePublishSection}
              onArchiveSection={handleArchiveSection}
              onDuplicateSection={handleDuplicateSection}
              onDeleteSection={handleDeleteSection}
              onRestoreSection={handleRestoreSection}
              onAddSection={handleAddSection}
              onReorderSections={handleReorderSections}
            />

            <CourseStudioCanvas
              selectedLecture={selectedLecture}
              selectedSection={selectedSection}
              selectedContent={selectedContent}
              lectureSections={selectedLecture ? sectionsByLecture[selectedLecture.id] : undefined}
              sectionContents={contentItems}
              canvasView={canvasView}
              onCreateLecture={openAddChoice}
              onAddSection={selectedLecture ? () => handleAddSection(selectedLecture.id) : undefined}
              onSelectSection={handleSelectSection}
              onAddContent={handleAddContent}
              onEditSection={(s) => store.openEditSectionDialog(s)}
              onDuplicateSection={handleDuplicateSection}
              onArchiveSection={handleArchiveSection}
              onDeleteSection={handleDeleteSection}
              onRestoreSection={handleRestoreSection}
              onSelectContent={handleSelectContent}
              onEditContent={handleEditContent}
              onPublishContent={handlePublishContent}
              onArchiveContent={handleArchiveContent}
              onDuplicateContent={handleDuplicateContent}
              onDeleteContent={handleDeleteContent}
              onRestoreContent={handleRestoreContent}
              onToggleFreePreview={instructorMode ? undefined : handleToggleFreePreview}
              onReorderContent={handleReorderContent}
              onQuickStart={onQuickStart}
            />

            <CourseStudioInspector
              open={store.inspectorOpen}
              width={inspectorWidth}
              className="nova-float-panel nova-float-inspector"
              selectedSection={selectedSection}
              selectedContent={selectedContent}
              lectures={lectures}
              onEditSection={(s) => store.openEditSectionDialog(s)}
              onDuplicateSection={handleDuplicateSection}
              onArchiveSection={handleArchiveSection}
              onDeleteSection={handleDeleteSection}
              onRestoreSection={handleRestoreSection}
              onMoveSection={handleMoveSection}
              onClose={handleCloseInspector}
            />
          </>
        )}
      </div>

      {/* Floating command pill — every primary tool stays one tap away on every viewport. */}
      <nav className="nova-dock-floating" aria-label="أدوات الاستوديو السريعة">
        <StudioButton
          variant={navigatorOpen || mobileNavOpen ? "primary" : "ghost"}
          size="md"
          onClick={handleToggleNavigator}
          aria-label={navigatorOpen || mobileNavOpen ? "إخفاء المخطط" : "إظهار المخطط"}
          aria-pressed={navigatorOpen || mobileNavOpen}
          className="gap-2 px-4"
          icon={<ListTree className="h-4 w-4" />}
        >
          <span className="nova-dock-label">المخطط</span>
        </StudioButton>
        <StudioButton
          variant="primary"
          size="md"
          onClick={openAddChoice}
          aria-label="إضافة محاضرة أو جلسة"
          className="nova-primary-btn gap-2 px-4"
          icon={<Plus className="h-4 w-4" />}
        >
          <span className="nova-dock-label">إضافة</span>
        </StudioButton>
        <StudioButton
          variant={store.inspectorOpen ? "primary" : "ghost"}
          size="md"
          onClick={handleToggleInspector}
          aria-label={store.inspectorOpen ? "إخفاء الخصائص" : "إظهار الخصائص"}
          aria-pressed={store.inspectorOpen}
          className="gap-2 px-4"
          icon={<SlidersHorizontal className="h-4 w-4" />}
        >
          <span className="nova-dock-label">الخصائص</span>
        </StudioButton>
        {onQuickStart && (
          <StudioButton
            variant="ghost"
            size="md"
            onClick={onQuickStart}
            aria-label="دليل البدء السريع"
            className="gap-2 px-4"
            icon={<HelpCircle className="h-4 w-4" />}
          >
            <span className="nova-dock-label">الدليل</span>
          </StudioButton>
        )}
        {onPublish && (
          <StudioButton
            variant="ghost"
            size="md"
            onClick={onPublish}
            aria-label="نشر الدورة"
            className="gap-2 px-4"
            icon={<Send className="h-4 w-4" />}
          >
            <span className="nova-dock-label">نشر</span>
          </StudioButton>
        )}
      </nav>

      <CourseStudioAddItemChoiceDialog
        open={addChoiceOpen}
        onClose={closeAddChoice}
        onSelectLecture={() => store.openCreateDialog()}
        onSelectSession={() => setSessionModulePickerOpen(true)}
      />

      <CourseStudioCreateLectureDialog
        open={store.createDialogOpen}
        onClose={store.closeCreateDialog}
        onSave={handleCreateLecture}
        saving={createLecture.isPending}
        nextOrder={lectures.length}
      />

      {courseId && (
        <CourseStudioSessionPickerDialog
          open={sessionModulePickerOpen}
          courseId={courseId}
          onClose={() => setSessionModulePickerOpen(false)}
          onSelect={handleSessionModuleSelected}
        />
      )}

      <CourseStudioEditLectureDialog
        open={!!store.editLecture}
        lecture={store.editLecture}
        onClose={store.closeEditDialog}
        onSave={handleUpdateLecture}
        saving={updateLecture.isPending}
      />

      <CourseStudioCreateSectionDialog
        open={store.createSectionDialogOpen}
        lectureId={store.createSectionLectureId}
        onClose={store.closeCreateSectionDialog}
        onSave={handleCreateSection}
        saving={createSection.isPending}
        nextOrder={nextSectionOrder}
      />

      <CourseStudioEditSectionDialog
        open={!!store.editSection}
        section={store.editSection}
        onClose={store.closeEditSectionDialog}
        onSave={handleUpdateSection}
        saving={updateSection.isPending}
      />

      <CourseStudioContentPicker
        open={store.contentPickerOpen}
        onOpenChange={(open) => { if (!open) store.closeContentPicker(); }}
        onSelect={handleContentTypeSelected}
      />

      <ExamPicker
        open={store.examPickerOpen}
        onClose={store.closeExamPicker}
        onSelect={handleExamPicked}
        mode="single"
        allowedStatuses={["published", "draft"]}
      />

      <MediaPicker
        open={store.mediaPickerOpen}
        onClose={store.closeMediaPicker}
        onSelect={handleMediaSelected}
        mode="single"
        allowedTypes={MEDIA_PICKER_TYPES[store.mediaPickerContentType ?? "video"]}
        library={libraryForAllowedTypes(MEDIA_PICKER_TYPES[store.mediaPickerContentType ?? "video"])}
      />

      {courseId && (
        <CourseStudioSessionPickerDialog
          open={sessionPickerOpen}
          courseId={courseId}
          onClose={() => setSessionPickerOpen(false)}
          onSelect={handleSessionSelected}
        />
      )}

      <CourseStudioEditContentDialog
        open={!!editContentItem}
        item={editContentItem}
        onClose={() => setEditContentItem(null)}
        onSave={handleSaveContentTitle}
        saving={updateLesson.isPending}
      />

      {courseId && (
        <CourseStudioSessionEditDialog
          open={!!sessionEditId}
          courseId={courseId}
          sessionId={sessionEditId}
          onClose={() => setSessionEditId(null)}
          onSaved={async (session) => {
            setSessionEditId(null);
            // sync linked lesson title if exists
            const linked = contentItems.find((c) => c.courseSessionId === session.id);
            if (linked && store.selectedSectionId) {
              try {
                await updateLesson.mutateAsync({ courseId, sectionId: store.selectedSectionId, id: linked.id, data: { title: session.title } as any });
              } catch {}
            }
          }}
        />
      )}

      <CourseStudioExternalLinkDialog
        open={!!externalEditItem}
        initial={externalEditItem ? { title: externalEditItem.title, external_url: externalEditItem.externalUrl ?? "", short_description: externalEditItem.description ?? "" } : null}
        saving={updateLesson.isPending}
        onClose={() => setExternalEditItem(null)}
        onSave={handleSaveExternalLink}
      />

      <CourseStudioContentDetailsDialog
        open={!!pendingContent}
        type={pendingContent?.contentType ?? (pendingContent?.kind === "exam" ? "exam" : null)}
        defaultTitle={pendingContent?.defaultTitle}
        onClose={() => setPendingContent(null)}
        onSave={handleCreateContent}
        saving={createLesson.isPending || attachVideo.isPending || attachFile.isPending}
      />
    </motion.div>
  );
}

export { CourseStudio };
```

---

## `apps/web/src/features/course-studio/components/CourseStudioCanvas.tsx`

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, Layers, Pencil, Plus } from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { cn } from "@/lib/cn";
import { CourseStudioLectureOverview } from "./CourseStudioLectureOverview";
import { CourseStudioSectionOverview } from "./CourseStudioSectionOverview";
import { CourseStudioContentOverview } from "./CourseStudioContentOverview";
import { CourseStudioContentList } from "./CourseStudioContentList";
import { CourseStudioOnboarding, type KeyboardShortcut } from "./CourseStudioOnboarding";
import type { CourseModule } from "@/features/course-modules/types";
import type { CourseSection } from "@/features/course-sections/types";
import type { ContentItem } from "@/features/course-content/types";

export type CanvasView = "lecture" | "section" | "content";

interface CourseStudioCanvasProps {
  selectedLecture: CourseModule | null;
  selectedSection: CourseSection | null;
  selectedContent: ContentItem | null;
  lectureSections?: CourseSection[];
  sectionContents?: ContentItem[];
  canvasView: CanvasView | null;
  onCreateLecture?: () => void;
  onAddSection?: () => void;
  onSelectSection?: (id: string) => void;
  onAddContent?: () => void;
  onEditSection?: (section: CourseSection) => void;
  onDuplicateSection?: (section: CourseSection) => void;
  onArchiveSection?: (section: CourseSection) => void;
  onDeleteSection?: (section: CourseSection) => void;
  onRestoreSection?: (section: CourseSection) => void;
  onSelectContent?: (id: string) => void;
  onEditContent?: (item: ContentItem) => void;
  onPublishContent?: (item: ContentItem) => void;
  onArchiveContent?: (item: ContentItem) => void;
  onDuplicateContent?: (item: ContentItem) => void;
  onDeleteContent?: (item: ContentItem) => void;
  onRestoreContent?: (item: ContentItem) => void;
  onToggleFreePreview?: (item: ContentItem) => void;
  onReorderContent?: (items: ContentItem[], fromIndex: number, toIndex: number) => void;
  onQuickStart?: () => void;
  className?: string;
}

const shortcuts: KeyboardShortcut[] = [
  { keys: ["⌘", "B"], label: "إظهار/إخفاء المستكشف" },
  { keys: ["⌘", "I"], label: "إظهار/إخفاء الخصائص" },
  { keys: ["⌘", "K"], label: "فتح البحث" },
  { keys: ["⌘", "Enter"], label: "نشر الدورة" },
];

function CourseStudioCanvas({
  selectedLecture,
  selectedSection,
  selectedContent,
  lectureSections,
  sectionContents,
  canvasView,
  onCreateLecture,
  onAddSection,
  onSelectSection,
  onAddContent,
  onEditSection,
  onDuplicateSection,
  onArchiveSection,
  onDeleteSection,
  onRestoreSection,
  onSelectContent,
  onEditContent,
  onPublishContent,
  onArchiveContent,
  onDuplicateContent,
  onDeleteContent,
  onRestoreContent,
  onToggleFreePreview,
  onReorderContent,
  onQuickStart,
  className,
}: CourseStudioCanvasProps) {
  const workbar = canvasView === "content" && selectedContent
    ? {
        icon: FileText,
        label: "وحدة المحتوى",
        title: selectedContent.title,
        action: onEditContent ? { label: "تعديل المحتوى", icon: Pencil, onClick: () => onEditContent(selectedContent) } : null,
      }
    : canvasView === "section" && selectedSection
      ? {
          icon: Layers,
          label: "القسم",
          title: selectedSection.title,
          action: onAddContent ? { label: "إضافة محتوى", icon: Plus, onClick: onAddContent } : null,
        }
      : canvasView === "lecture" && selectedLecture
        ? {
            icon: BookOpen,
            label: "المحاضرة",
            title: selectedLecture.title,
            action: onAddSection ? { label: "قسم جديد", icon: Plus, onClick: onAddSection } : null,
          }
        : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={cn("nova-canvas flex min-w-0 flex-1 flex-col overflow-hidden", className)}
      role="region"
      aria-label="مساحة العمل"
    >
      <div className="nova-workbar flex shrink-0 items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {workbar ? (
            <>
              <span className="nova-hero-icon hidden h-9 w-9 shrink-0 rounded-xl sm:flex">
                <workbar.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="nova-section-label">{workbar.label}</p>
                <p className="truncate text-sm font-bold text-studio-fg">{workbar.title}</p>
              </div>
            </>
          ) : (
            <div>
              <p className="nova-section-label">مساحة العمل</p>
              <p className="text-sm font-bold text-studio-fg">لوحة التحرير</p>
            </div>
          )}
        </div>
        {workbar?.action && (
          <StudioButton
            variant="primary"
            size="sm"
            icon={<workbar.action.icon className="h-4 w-4" />}
            onClick={workbar.action.onClick}
            className="shrink-0"
          >
            <span className="hidden sm:inline">{workbar.action.label}</span>
          </StudioButton>
        )}
      </div>

      <div className="nova-scroll-region">
        <AnimatePresence mode="popLayout">
          {canvasView === "content" && selectedLecture && selectedSection && selectedContent ? (
            <motion.div
              key={`content-${selectedContent.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <CourseStudioContentOverview
                item={selectedContent}
                onEdit={onEditContent ? () => onEditContent(selectedContent) : undefined}
              />
            </motion.div>
          ) : canvasView === "section" && selectedLecture && selectedSection ? (
            <motion.div
              key={`section-${selectedSection.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <CourseStudioSectionOverview
                section={selectedSection}
                lecture={selectedLecture}
                onAddContent={onAddContent}
                onEdit={onEditSection}
                onDuplicate={onDuplicateSection}
                onArchive={onArchiveSection}
                onDelete={onDeleteSection}
                onRestore={onRestoreSection}
              />
              <div className="mx-auto w-full max-w-6xl px-3 pb-10 sm:px-5">
                <CourseStudioContentList
                  items={sectionContents ?? []}
                  selectedId={selectedContent?.id ?? null}
                  onSelect={onSelectContent ?? (() => {})}
                  onAddContent={onAddContent}
                  onEdit={onEditContent}
                  onPublish={onPublishContent}
                  onArchive={onArchiveContent}
                  onDuplicate={onDuplicateContent}
                  onDelete={onDeleteContent}
                  onRestore={onRestoreContent}
                  onToggleFreePreview={onToggleFreePreview}
                  onReorder={onReorderContent}
                />
              </div>
            </motion.div>
          ) : canvasView === "lecture" && selectedLecture ? (
            <motion.div
              key={`lecture-${selectedLecture.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <CourseStudioLectureOverview
                lecture={selectedLecture}
                sections={lectureSections}
                onAddSection={onAddSection}
                onSelectSection={onSelectSection}
              />
            </motion.div>
          ) : (
            <CourseStudioOnboarding
              key="onboarding"
              variant="canvas"
              title="ابدأ ببناء منهجك التعليمي"
              description="قم بإضافة المحاضرات والأقسام والمحتوى التفاعلي لبناء دورة تعليمية متكاملة. استخدم الأدوات المتاحة لتنظيم وتحرير المحتوى الخاص بك."
              primaryAction={onCreateLecture ? { label: "إنشاء محاضرة", onClick: onCreateLecture } : undefined}
              secondaryAction={onQuickStart ? { label: "مشاهدة دليل البدء السريع", onClick: onQuickStart } : undefined}
              shortcuts={shortcuts}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export { CourseStudioCanvas };
```

---

## `apps/web/src/features/course-studio/components/CourseStudioHeader.tsx`

```tsx
"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  ListTree,
  MoreHorizontal,
  Pencil,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioDropdown } from "@/components/studio/overlays/StudioDropdown";
import { cn } from "@/lib/cn";

interface CourseStudioHeaderProps {
  courseName?: string;
  courseStatus?: string;
  visibility?: string;
  studentsCount?: number;
  lastEdited?: string;
  isSaving?: boolean;
  isSaved?: boolean;
  navigatorOpen?: boolean;
  inspectorOpen?: boolean;
  onToggleNavigator?: () => void;
  onToggleInspector?: () => void;
  onPublish?: () => void;
  onQuickAction?: (action: string) => void;
}

const headerMotion = {
  initial: { y: -8, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
};

const visibilityLabel: Record<string, string> = {
  private: "خاص",
  public: "عام",
  preview: "معاينة",
};

function CourseStudioHeader({
  courseName = "عنوان الدورة",
  courseStatus,
  visibility,
  studentsCount,
  lastEdited,
  isSaving,
  isSaved,
  navigatorOpen,
  inspectorOpen,
  onToggleNavigator,
  onToggleInspector,
  onPublish,
  onQuickAction,
}: CourseStudioHeaderProps) {
  return (
    <motion.header {...headerMotion} className="nova-header shrink-0 px-3 pb-2.5 pt-3 sm:px-5 md:px-6" role="banner" aria-label="رأس الاستوديو">
      <div className="flex items-center gap-3 md:gap-5">
        <div className="nova-brand-mark h-11 w-11 shrink-0 md:h-12 md:w-12">
          <Sparkles className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="nova-eyebrow">Studio Nova</p>
            <span className="hidden h-3 w-px bg-studio-border sm:block" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-studio-fg-muted">منصة تحرير المنهج</span>
            {courseStatus && <StudioStatusBadge status={courseStatus} />}
          </div>
          <h1 className="nova-title mt-1 truncate text-lg md:text-xl" title={courseName}>{courseName}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <span className={cn(
            "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold lg:inline-flex",
            isSaving
              ? "border-studio-warning/30 bg-studio-warning/10 text-studio-warning"
              : isSaved
                ? "border-studio-success/25 bg-studio-success/10 text-studio-success"
                : "border-studio-border bg-white/70 text-studio-fg-muted",
          )}>
            {isSaving ? <Clock className="h-3.5 w-3.5 animate-pulse" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {isSaving ? "جارٍ الحفظ" : isSaved ? "محفوظ" : "جاهز"}
          </span>

          <StudioButton
            variant="ghost"
            size="icon"
            onClick={onToggleNavigator}
            aria-label={navigatorOpen ? "إخفاء المخطط" : "إظهار المخطط"}
            aria-pressed={navigatorOpen}
            className="nova-icon-btn h-11 w-11"
          >
            <ListTree className="h-4 w-4" />
          </StudioButton>
          <StudioButton
            variant="ghost"
            size="icon"
            onClick={onToggleInspector}
            aria-label={inspectorOpen ? "إخفاء الخصائص" : "إظهار الخصائص"}
            aria-pressed={inspectorOpen}
            className="nova-icon-btn h-11 w-11"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </StudioButton>

          {onPublish && (
            <StudioButton
              variant="primary"
              size="sm"
              onClick={onPublish}
              icon={<Send className="h-3.5 w-3.5" />}
              aria-label="نشر الدورة"
              className="nova-primary-btn h-10 rounded-xl px-3 text-xs md:px-4"
            >
              نشر الدورة
            </StudioButton>
          )}

          <StudioDropdown
            trigger={
              <StudioButton variant="ghost" size="icon" aria-label="إجراءات سريعة" className="nova-icon-btn h-11 w-11">
                <MoreHorizontal className="h-4 w-4" />
              </StudioButton>
            }
            items={[
              { label: "تعديل الدورة", value: "edit", icon: <Pencil className="h-4 w-4" /> },
              { label: "معاينة", value: "preview", icon: <Eye className="h-4 w-4" /> },
              { label: "الإحصائيات", value: "analytics", icon: <BarChart3 className="h-4 w-4" /> },
              { separator: true } as const,
              { label: "حذف الدورة", value: "delete", danger: true, icon: <Trash2 className="h-4 w-4" /> },
            ]}
            onSelect={(item) => onQuickAction?.(item.value ?? item.label)}
            align="end"
          />
        </div>
      </div>

      <div className="nova-meta-strip mt-2.5 flex items-center gap-3 overflow-x-auto pt-2 text-[11px] md:gap-5 md:text-xs">
        {typeof studentsCount === "number" && (
          <span className="nova-meta-item"><Users className="h-3.5 w-3.5 text-studio-accent" />{studentsCount} طالب</span>
        )}
        {visibility && (
          <span className="nova-meta-item"><Eye className="h-3.5 w-3.5 text-studio-accent" />{visibilityLabel[visibility] ?? visibility}</span>
        )}
        {lastEdited && (
          <span className="nova-meta-item"><Clock className="h-3.5 w-3.5 text-studio-accent" />{lastEdited}</span>
        )}
        <span className="nova-meta-item ms-auto shrink-0 text-studio-fg-subtle">اسحب البطاقات لإعادة الترتيب</span>
      </div>
    </motion.header>
  );
}

export { CourseStudioHeader };
```

---

## `apps/web/src/features/course-studio/components/CourseStudioNavigator.tsx`

```tsx
"use client";

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { CourseStudioLectureItem } from "./CourseStudioLectureItem";
import { CourseStudioOnboarding } from "./CourseStudioOnboarding";
import type { CourseModule } from "@/features/course-modules/types";
import type { CourseSection } from "@/features/course-sections/types";

interface CourseStudioNavigatorProps {
  open: boolean;
  width: number;
  lectures: CourseModule[];
  sections?: Record<string, CourseSection[]>;
  courseId?: string;
  selectedLectureId: string | null;
  selectedSectionId?: string | null;
  expandedLectures?: string[];
  isLoading?: boolean;
  variant?: "sidebar" | "drawer";
  onSelectLecture: (id: string) => void;
  onToggleLecture?: (id: string) => void;
  onSelectSection?: (id: string) => void;
  onCreateLecture?: () => void;
  onEditLecture?: (lecture: CourseModule) => void;
  onPublishLecture?: (lecture: CourseModule) => void;
  onArchiveLecture?: (lecture: CourseModule) => void;
  onDuplicateLecture?: (lecture: CourseModule) => void;
  onDeleteLecture?: (lecture: CourseModule) => void;
  onRestoreLecture?: (lecture: CourseModule) => void;
  onReorder?: (lectures: CourseModule[], fromIndex: number, toIndex: number) => void;
  onEditSection?: (section: CourseSection) => void;
  onPublishSection?: (section: CourseSection) => void;
  onArchiveSection?: (section: CourseSection) => void;
  onDuplicateSection?: (section: CourseSection) => void;
  onDeleteSection?: (section: CourseSection) => void;
  onRestoreSection?: (section: CourseSection) => void;
  onAddSection?: (lectureId: string) => void;
  onReorderSections?: (courseId: string, sections: Array<{ id: number; sort_order: number }>) => void;
  className?: string;
}

function CourseStudioNavigator({
  open,
  width,
  lectures,
  sections,
  courseId,
  selectedLectureId,
  selectedSectionId,
  expandedLectures,
  isLoading,
  variant = "sidebar",
  onSelectLecture,
  onToggleLecture,
  onSelectSection,
  onCreateLecture,
  onEditLecture,
  onPublishLecture,
  onArchiveLecture,
  onDuplicateLecture,
  onDeleteLecture,
  onRestoreLecture,
  onReorder,
  onEditSection,
  onPublishSection,
  onArchiveSection,
  onDuplicateSection,
  onDeleteSection,
  onRestoreSection,
  onAddSection,
  onReorderSections,
  className,
}: CourseStudioNavigatorProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<number | null>(null);
  const [query, setQuery] = useState("");

  const filteredLectures = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return lectures;
    return lectures.filter((lecture) => {
      if (lecture.title.toLocaleLowerCase().includes(needle)) return true;
      return (sections?.[lecture.id] ?? []).some((section) =>
        section.title.toLocaleLowerCase().includes(needle),
      );
    });
  }, [lectures, sections, query]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, lecture: CourseModule) => {
      dragItem.current = lectures.findIndex((l) => l.id === lecture.id);
      e.dataTransfer.effectAllowed = "move";
    },
    [lectures],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, lecture: CourseModule) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, lecture: CourseModule) => {
      e.preventDefault();
      if (dragItem.current === null) return;
      const toIndex = lectures.findIndex((l) => l.id === lecture.id);
      if (dragItem.current === toIndex) return;
      onReorder?.(lectures, dragItem.current, toIndex);
      dragItem.current = null;
    },
    [lectures, onReorder],
  );

  const sectionDragItem = useRef<{ lectureId: string; index: number } | null>(null);

  const handleSectionDragStart = useCallback(
    (e: React.DragEvent, section: CourseSection) => {
      const lectureEntry = Object.entries(sections ?? {}).find(
        ([, secs]) => secs.some((s) => s.id === section.id),
      );
      if (lectureEntry) {
        const idx = lectureEntry[1].findIndex((s) => s.id === section.id);
        sectionDragItem.current = { lectureId: lectureEntry[0], index: idx };
      }
      e.dataTransfer.effectAllowed = "move";
    },
    [sections],
  );

  const handleSectionDrop = useCallback(
    (e: React.DragEvent, targetSection: CourseSection) => {
      e.preventDefault();
      if (!sectionDragItem.current || !courseId || !onReorderSections) {
        sectionDragItem.current = null;
        return;
      }
      const { lectureId: fromLectureId, index: fromIndex } = sectionDragItem.current;
      const targetLectureEntry = Object.entries(sections ?? {}).find(
        ([, secs]) => secs.some((s) => s.id === targetSection.id),
      );
      if (!targetLectureEntry) {
        sectionDragItem.current = null;
        return;
      }
      const toLectureId = targetLectureEntry[0];
      const targetSecs = targetLectureEntry[1];
      const toIndex = targetSecs.findIndex((s) => s.id === targetSection.id);
      if (fromLectureId === toLectureId && fromIndex === toIndex) {
        sectionDragItem.current = null;
        return;
      }
      const sourceSecs = sections?.[fromLectureId] ?? [];
      const updated = [...sourceSecs];
      const moved = updated.splice(fromIndex, 1)[0];
      if (!moved) {
        sectionDragItem.current = null;
        return;
      }
      if (fromLectureId === toLectureId) {
        updated.splice(toIndex, 0, moved);
      }
      const reordered = updated.map((s, i) => ({
        id: parseInt(s.id, 10),
        sort_order: i + 1,
      }));
      onReorderSections(courseId, reordered);
      sectionDragItem.current = null;
    },
    [sections, courseId],
  );

  const handleSectionDragOver = useCallback(
    (e: React.DragEvent, _section: CourseSection) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const isSectionFocused = !!selectedSectionId;

      if (isTyping) return;

      if (isSectionFocused && onSelectSection) {
        const flatSections = Object.values(sections ?? {}).flat();
        const currentIndex = flatSections.findIndex((s) => s.id === selectedSectionId);
        if (currentIndex === -1) return;
        const currentSection = flatSections[currentIndex];
        if (!currentSection) return;

        let nextIndex = currentIndex;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          nextIndex = Math.min(currentIndex + 1, flatSections.length - 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          nextIndex = Math.max(currentIndex - 1, 0);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (onSelectLecture && currentSection.courseModuleId) {
            onSelectLecture(currentSection.courseModuleId);
          } else if (onSelectLecture && lectures[0]) {
            onSelectLecture(lectures[0].id);
          }
          return;
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          if (onSelectLecture && currentSection.courseModuleId) {
            onSelectLecture(currentSection.courseModuleId);
          } else if (onSelectLecture && lectures[0]) {
            onSelectLecture(lectures[0].id);
          }
          return;
        } else if (e.key === "Home") {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === "End") {
          e.preventDefault();
          nextIndex = flatSections.length - 1;
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectSection(currentSection.id);
          return;
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          if (!currentSection.deletedAt) {
            onDeleteSection?.(currentSection);
          }
          return;
        }

        if (nextIndex !== currentIndex) {
          const nextSection = flatSections[nextIndex];
          if (nextSection) {
            onSelectSection(nextSection.id);
            requestAnimationFrame(() => {
              const el = document.querySelector(`[data-section-id="${nextSection.id}"]`);
              if (el) {
                (el as HTMLElement).focus();
                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
            });
          }
        }
        return;
      }

      const currentIndex = lectures.findIndex((l) => l.id === selectedLectureId);
      if (currentIndex === -1) return;
      const currentLecture = lectures[currentIndex];
      if (!currentLecture) return;
      let nextIndex = currentIndex;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = Math.min(currentIndex + 1, lectures.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (onToggleLecture) {
          onToggleLecture(currentLecture.id);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (onToggleLecture && !expandedLectures?.includes(currentLecture.id)) {
          onToggleLecture(currentLecture.id);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = lectures.length - 1;
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (currentLecture && !currentLecture.deletedAt) {
          e.preventDefault();
          onDeleteLecture?.(currentLecture);
        }
      }
      if (nextIndex !== currentIndex) {
        const nextLecture = lectures[nextIndex];
        if (nextLecture) onSelectLecture(nextLecture.id);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, lectures, selectedLectureId, selectedSectionId, expandedLectures, sections, onSelectLecture, onSelectSection, onDeleteLecture, onDeleteSection, onArchiveSection, onRestoreSection, onToggleLecture]);

  const hasLectures = lectures.length > 0;
  const noSearchResults = query.trim().length > 0 && filteredLectures.length === 0;
  const isFloating = className?.includes("nova-float-panel") ?? false;

  const content = (
    <div style={!isFloating && variant === "sidebar" ? { width } : undefined} className="nova-nav flex h-full flex-col">
      <div className="nova-nav-head shrink-0 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="nova-eyebrow">Course Outline</p>
            <h3 className="mt-0.5 text-sm font-semibold text-studio-fg">منهج الدورة</h3>
          </div>
          <span className="nova-count-pill" aria-label={`${lectures.length} محاضرة`}>
            {lectures.length}
          </span>
        </div>

        <label className="nova-search mt-3 flex h-10 items-center gap-2 rounded-xl px-3">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن محاضرة أو قسم…"
            aria-label="البحث في منهج الدورة"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="مسح البحث"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-studio-fg-subtle hover:bg-studio-soft hover:text-studio-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        {onCreateLecture && (
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button type="button" onClick={onCreateLecture} className="nova-nav-add flex-1 gap-1.5">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              محاضرة جديدة
            </button>
            <span className="hidden text-[10px] text-studio-fg-subtle sm:block">اسحب لإعادة الترتيب</span>
          </div>
        )}
      </div>

      <div ref={listRef} className="studio-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2" role="tree" aria-label="قائمة المحاضرات">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-studio-skeleton" />
            ))}
          </div>
        ) : noSearchResults ? (
          <div className="rounded-xl border border-dashed border-studio-border bg-studio-soft/40 p-5 text-center">
            <Search className="mx-auto h-5 w-5 text-studio-fg-subtle" aria-hidden="true" />
            <p className="mt-2 text-xs font-medium text-studio-fg">لا توجد نتائج مطابقة</p>
            <p className="mt-1 text-[11px] text-studio-fg-muted">جرّب كلمة مختلفة أو امسح البحث.</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-3 rounded-lg border border-studio-border bg-studio-surface px-3 py-1.5 text-xs font-medium text-studio-accent hover:bg-studio-accent-soft"
            >
              مسح البحث
            </button>
          </div>
        ) : hasLectures ? (
          <div className="space-y-1">
            {filteredLectures.map((lecture) => {
              const originalIndex = lectures.findIndex((l) => l.id === lecture.id);
              return (
                <CourseStudioLectureItem
                  key={lecture.id}
                  lecture={lecture}
                  sections={sections?.[lecture.id]}
                  isSelected={selectedLectureId === lecture.id}
                  isExpanded={expandedLectures?.includes(lecture.id) ?? false}
                  selectedSectionId={selectedSectionId}
                  onSelect={onSelectLecture}
                  onToggle={() => onToggleLecture?.(lecture.id)}
                  onEdit={onEditLecture ?? (() => {})}
                  onPublish={onPublishLecture ?? (() => {})}
                  onArchive={onArchiveLecture ?? (() => {})}
                  onDuplicate={onDuplicateLecture ?? (() => {})}
                  onDelete={onDeleteLecture ?? (() => {})}
                  onRestore={onRestoreLecture ?? (() => {})}
                  onSelectSection={onSelectSection}
                  onEditSection={onEditSection}
                  onPublishSection={onPublishSection}
                  onArchiveSection={onArchiveSection}
                  onDuplicateSection={onDuplicateSection}
                  onDeleteSection={onDeleteSection}
                  onRestoreSection={onRestoreSection}
                  onAddSection={onAddSection ? () => onAddSection(lecture.id) : undefined}
                  onDragSectionStart={handleSectionDragStart}
                  onDragSectionOver={handleSectionDragOver}
                  onDropSection={handleSectionDrop}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onMoveUp={originalIndex > 0 && onReorder ? () => onReorder(lectures, originalIndex, originalIndex - 1) : undefined}
                  onMoveDown={originalIndex < lectures.length - 1 && onReorder ? () => onReorder(lectures, originalIndex, originalIndex + 1) : undefined}
                />
              );
            })}
          </div>
        ) : (
          <CourseStudioOnboarding
            variant="navigator"
            title="لا توجد محاضرات بعد"
            description="ابدأ بإضافة محاضرات لبناء منهج الكورس."
            primaryAction={onCreateLecture ? { label: "إنشاء أول محاضرة", onClick: onCreateLecture } : undefined}
          />
        )}
      </div>
    </div>
  );

  if (variant === "drawer") {
    return open ? <div className={cn("nova-nav flex h-full flex-col", className)}>{content}</div> : null;
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: -18, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -18, scale: 0.98 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className={cn("nova-float-panel nova-float-navigator shrink-0 overflow-hidden", className)}
          role="navigation"
          aria-label="متصفح المحتوى"
        >
          {content}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
export { CourseStudioNavigator };
```

---

## `apps/web/src/features/course-studio/components/CourseStudioInspector.tsx`

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  Layers,
  Clock,
  FileText,
  Eye,
  Lock,
  Calendar,
  Globe,
  Video,
  FileType,
  ClipboardList,
  FolderOpen,
  Headphones,
  Monitor,
  Puzzle,
  Link,
  Award,
  CheckCircle2,
  CircleDashed,
  Pencil,
  Copy,
  Archive,
  RotateCcw,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioPropertyRow } from "@/components/studio/lists/StudioPropertyRow";
import { cn } from "@/lib/cn";
import type { CourseSection } from "@/features/course-sections/types";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";
import type { CourseModule } from "@/features/course-modules/types";

const TYPE_META: Record<ContentItemType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  video: { label: "فيديو", icon: Video, color: "text-secondary", bg: "bg-secondary/10" },
  pdf: { label: "PDF", icon: FileType, color: "text-red-500", bg: "bg-red-500/10" },
  exam: { label: "اختبار", icon: ClipboardList, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  assignment: { label: "واجب", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" },
  resource: { label: "مورد", icon: FolderOpen, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  audio: { label: "صوت", icon: Headphones, color: "text-pink-500", bg: "bg-pink-500/10" },
  live: { label: "جلسة مباشرة", icon: Monitor, color: "text-rose-500", bg: "bg-rose-500/10" },
  scorm: { label: "SCORM", icon: Puzzle, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  external_link: { label: "رابط خارجي", icon: Link, color: "text-blue-500", bg: "bg-blue-500/10" },
  certificate: { label: "شهادة", icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  session: { label: "جلسة", icon: CalendarDays, color: "text-teal-500", bg: "bg-teal-500/10" },
};

interface CourseStudioInspectorProps {
  open: boolean;
  width: number;
  selectedSection: CourseSection | null;
  selectedContent?: ContentItem | null;
  lectures?: CourseModule[];
  variant?: "sidebar" | "drawer";
  onEditSection?: (section: CourseSection) => void;
  onDuplicateSection?: (section: CourseSection) => void;
  onArchiveSection?: (section: CourseSection) => void;
  onDeleteSection?: (section: CourseSection) => void;
  onRestoreSection?: (section: CourseSection) => void;
  onMoveSection?: (section: CourseSection, lectureId: string | null) => void;
  onClose?: () => void;
  className?: string;
}

function ContentProperties({ item }: { item: ContentItem }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.resource;
  const Icon = meta.icon;
  const displayDuration = item.duration ? `${Math.round(item.duration / 60)} دقيقة` : "—";

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.bg)}>
          <Icon className={cn("h-5 w-5", meta.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-studio-fg">
            {item.title}
          </p>
          <p className="text-xs text-studio-fg-muted">{meta.label}</p>
        </div>
      </div>

      <div className="nova-group">
        <h4 className="nova-group-title">
          الخصائص
        </h4>
        <StudioPropertyRow
          label="الحالة"
          value={<StudioStatusBadge status={item.status} />}
        />
        <StudioPropertyRow
          label="الظهور"
          value={
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-studio-fg-muted" />
              {item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}
            </span>
          }
        />
        <StudioPropertyRow
          label="معاينة مجانية"
          value={
            <span className={item.freePreview ? "text-studio-success" : "text-studio-fg-muted"}>
              {item.freePreview ? "مفعلة" : "متوقفة"}
            </span>
          }
        />
        <StudioPropertyRow
          label="مقفل"
          value={
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-studio-fg-muted" />
              {item.locked ? "نعم" : "لا"}
            </span>
          }
        />
        <StudioPropertyRow
          label="المدة"
          value={
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-studio-fg-muted" />
              {displayDuration}
            </span>
          }
        />
        <StudioPropertyRow label="الترتيب" value={item.order} />
        <StudioPropertyRow label="النوع" value={meta.label} />
      </div>

      <div className="nova-group">
        <h4 className="nova-group-title">
          المعلومات
        </h4>
        <StudioPropertyRow
          label="تاريخ الإنشاء"
          value={
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-studio-fg-muted" />
              {new Date(item.createdAt).toLocaleDateString("ar-SA")}
            </span>
          }
        />
        <StudioPropertyRow
          label="آخر تحديث"
          value={
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-studio-fg-muted" />
              {new Date(item.updatedAt).toLocaleDateString("ar-SA")}
            </span>
          }
        />
      </div>
    </motion.div>
  );
}

function CourseStudioInspector({
  open,
  width,
  selectedSection,
  selectedContent,
  lectures,
  variant = "sidebar",
  onEditSection,
  onDuplicateSection,
  onArchiveSection,
  onDeleteSection,
  onRestoreSection,
  onMoveSection,
  onClose,
  className,
}: CourseStudioInspectorProps) {
  const isFloating = className?.includes("nova-float-panel") ?? false;
  const inner = (
    <div style={!isFloating && variant === "sidebar" ? { width } : undefined} className="flex h-full flex-col nova-nav">
            <div className="nova-panel-head flex shrink-0 items-center justify-between border-b border-studio-border px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="nova-hero-icon h-9 w-9 shrink-0 rounded-[11px]">
                  <Settings className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="nova-eyebrow">Inspector</p>
                  <h3 className="truncate text-sm font-semibold text-studio-fg">
                    {selectedContent
                      ? "خصائص المحتوى"
                      : selectedSection
                        ? "خصائص القسم"
                        : "خصائص العنصر"}
                  </h3>
                </div>
              </div>
              {onClose && (
                <StudioButton
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="إغلاق لوحة الخصائص"
                  className="nova-icon-btn h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </StudioButton>
              )}
            </div>

            <div className="flex-1 overflow-y-auto studio-scrollbar p-4">
              {selectedContent ? (
                <ContentProperties item={selectedContent} />
              ) : selectedSection ? (
                <motion.div
                  key={selectedSection.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-studio-accent-soft">
                      <Layers className="h-5 w-5 text-studio-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-studio-fg">
                        {selectedSection.title}
                      </p>
                      <StudioStatusBadge status={selectedSection.status} />
                    </div>
                  </div>

                  <div className="nova-group">
                    <h4 className="nova-group-title">
                      الخصائص
                    </h4>
                    <StudioPropertyRow
                      label="الظهور (الرؤية)"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {selectedSection.freePreview
                            ? "معاينة مجانية"
                            : selectedSection.locked
                              ? "مقفل"
                              : "ظاهر"}
                        </span>
                      }
                    />
                    <StudioPropertyRow
                      label="الحالة"
                      value={<StudioStatusBadge status={selectedSection.status} />}
                    />
                    <StudioPropertyRow
                      label="المدة التقديرية"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {selectedSection.durationMinutes ? `${selectedSection.durationMinutes} دقيقة` : "—"}
                        </span>
                      }
                    />
                    <StudioPropertyRow
                      label="الترتيب"
                      value={selectedSection.order}
                    />
                    <StudioPropertyRow
                      label="عدد المحتوى"
                      value={
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {selectedSection.lessonsCount}
                        </span>
                      }
                    />
                    <StudioPropertyRow
                      label="البيانات الوصفية"
                      value={
                        <span className="text-start text-xs text-studio-fg-muted">
                          {selectedSection.color ? `اللون: ${selectedSection.color}` : "—"}
                          {selectedSection.notes ? " · يوجد ملاحظات" : ""}
                        </span>
                      }
                    />
                  </div>

                  <div className="nova-group">
                    <h4 className="nova-group-title">
                      المعلومات
                    </h4>
                    <StudioPropertyRow
                      label="تاريخ الإنشاء"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {new Date(selectedSection.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      }
                    />
                    <StudioPropertyRow
                      label="آخر تحديث"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-studio-fg-muted" />
                          {new Date(selectedSection.updatedAt).toLocaleDateString("ar-SA")}
                        </span>
                      }
                    />
                  </div>

                  <div className="nova-group">
                    <h4 className="nova-group-title">
                      الإجراءات
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <StudioButton
                        variant="secondary"
                        size="sm"
                        icon={<Pencil className="h-4 w-4" />}
                        onClick={() => onEditSection?.(selectedSection)}
                        className="w-full"
                      >
                        تعديل
                      </StudioButton>
                      <StudioButton
                        variant="secondary"
                        size="sm"
                        icon={<Copy className="h-4 w-4" />}
                        onClick={() => onDuplicateSection?.(selectedSection)}
                        className="w-full"
                      >
                        نسخ
                      </StudioButton>
                      {!selectedSection.deletedAt && (
                        <StudioButton
                          variant="secondary"
                          size="sm"
                          icon={<Archive className="h-4 w-4" />}
                          onClick={() => onArchiveSection?.(selectedSection)}
                          className="w-full"
                        >
                          أرشفة
                        </StudioButton>
                      )}
                      {selectedSection.deletedAt && (
                        <StudioButton
                          variant="soft"
                          size="sm"
                          icon={<RotateCcw className="h-4 w-4" />}
                          onClick={() => onRestoreSection?.(selectedSection)}
                          className="w-full"
                        >
                          استعادة
                        </StudioButton>
                      )}
                      <StudioButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => onDeleteSection?.(selectedSection)}
                        className="col-span-2 w-full"
                      >
                        حذف
                      </StudioButton>
                    </div>

                    {onMoveSection && (
                      <div className="mt-3 border-t border-studio-border pt-3">
                        <p className="mb-2 text-xs font-medium text-studio-fg-muted">
                          نقل إلى محاضرة
                        </p>
                        <select
                          aria-label="نقل القسم إلى محاضرة"
                          defaultValue={selectedSection.courseModuleId ?? ""}
                          onChange={(e) =>
                            onMoveSection(
                              selectedSection,
                              e.target.value === "" ? null : e.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-studio-border bg-studio-surface px-3 py-2 text-sm text-studio-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
                        >
                          <option value="">بدون محاضرة</option>
                          {(lectures ?? []).map((lecture) => (
                            <option key={lecture.id} value={lecture.id}>
                              {lecture.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-3"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-studio-soft">
                      <Settings className="h-7 w-7 text-studio-fg-subtle" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-studio-fg">
                        خصائص العنصر
                      </p>
                      <p className="mt-1 text-xs text-studio-fg-muted">
                        اختر عنصراً لعرض خصائصه
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
    </div>
  );

  if (variant === "drawer") {
    return open ? <div className={cn("nova-drawer flex h-full flex-col bg-studio-surface", className)}>{inner}</div> : null;
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: 18, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 18, scale: 0.98 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className={cn("nova-float-panel nova-float-inspector shrink-0 overflow-hidden", className)}
          role="complementary"
          aria-label="لوحة الخصائص"
        >
          {inner}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export { CourseStudioInspector };
```

---

## `apps/web/src/features/course-studio/components/CourseStudioLectureOverview.tsx`

```tsx
"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Layers,
  Plus,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioSurfaceCard } from "@/components/studio/surfaces/StudioSurfaceCard";
import { cn } from "@/lib/cn";
import type { CourseModule } from "@/features/course-modules/types";
import type { CourseSection } from "@/features/course-sections/types";

interface CourseStudioLectureOverviewProps {
  lecture: CourseModule;
  sections?: CourseSection[];
  onAddSection?: () => void;
  onSelectSection?: (id: string) => void;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const easeCurve = [0.22, 1, 0.36, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeCurve } },
};

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <motion.div variants={itemVariants} className="nova-stat-chip">
      <span><Icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        <small>{label}</small>
        <strong className="truncate">{value}</strong>
      </span>
    </motion.div>
  );
}

function CourseStudioLectureOverview({
  lecture,
  sections,
  onAddSection,
  onSelectSection,
  className,
}: CourseStudioLectureOverviewProps) {
  const sectionList = sections ?? [];
  const totalContent = sectionList.reduce((sum, s) => sum + (s.lessonsCount ?? 0), 0);
  const totalDurationMinutes = sectionList.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const displayDuration = totalDurationMinutes > 0
    ? `${totalDurationMinutes} دقيقة`
    : lecture.estimatedDuration
      ? `${lecture.estimatedDuration} دقيقة`
      : "—";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("nova-page", className)}
    >
      <motion.section variants={itemVariants} className="nova-editorial-hero p-5 sm:p-7" data-mark="01">
        <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="nova-hero-index h-14 w-14 text-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="nova-section-label">ملف المحاضرة</p>
                <StudioStatusBadge status={lecture.status} />
              </div>
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-studio-fg sm:text-3xl">
                {lecture.title}
              </h1>
              {lecture.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-studio-fg-muted">
                  {lecture.description}
                </p>
              )}
            </div>
          </div>
          {onAddSection && (
            <StudioButton
              onClick={onAddSection}
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              className="nova-primary-btn shrink-0"
            >
              قسم جديد
            </StudioButton>
          )}
        </div>
      </motion.section>

      <motion.div variants={itemVariants} className="nova-stat-ribbon my-5">
        <StatChip icon={Layers} label="الأقسام" value={sectionList.length} />
        <StatChip icon={FileText} label="وحدات المحتوى" value={totalContent} />
        <StatChip icon={Clock} label="المدة التقديرية" value={displayDuration} />
      </motion.div>

      <motion.section variants={itemVariants} className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="nova-section-label">مسار المحاضرة</p>
            <h2 className="text-base font-extrabold text-studio-fg">الأقسام داخل هذه المحاضرة</h2>
          </div>
          <span className="rounded-full border border-studio-border bg-white/80 px-3 py-1 text-[11px] font-bold text-studio-fg-muted">
            {sectionList.length} قسم
          </span>
        </div>

        {sectionList.length === 0 ? (
          <div className="nova-empty-card flex flex-col items-center gap-3 p-10 text-center">
            <div className="nova-hero-icon h-14 w-14"><Layers className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-bold text-studio-fg">لا توجد أقسام بعد</p>
              <p className="mt-1 text-xs text-studio-fg-muted">
                ابدأ بإضافة قسم لتنظيم المحتوى التعليمي داخل المحاضرة.
              </p>
            </div>
            {onAddSection && (
              <StudioButton onClick={onAddSection} variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} className="nova-primary-btn">
                إنشاء أول قسم
              </StudioButton>
            )}
          </div>
        ) : (
          <div className="nova-timeline">
            {sectionList.map((section, index) => (
              <motion.div
                key={section.id}
                variants={itemVariants}
                className="nova-timeline-item"
              >
                <span className="nova-step-bubble">{String(index + 1).padStart(2, "0")}</span>
                <button
                  type="button"
                  onClick={() => onSelectSection?.(section.id)}
                  className="nova-story-card w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
                  aria-label={`فتح القسم ${section.title}`}
                >
                  <div className="nova-story-card-head">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="nova-hero-icon h-10 w-10 rounded-xl"><Layers className="h-4 w-4" /></span>
                      <span className="min-w-0">
                        <span className="nova-mini-label">قسم {String(index + 1).padStart(2, "0")}</span>
                        <span className="block truncate text-sm font-extrabold text-studio-fg">{section.title}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StudioStatusBadge status={section.status} />
                      <ArrowLeft className="h-4 w-4 text-studio-fg-subtle" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="nova-story-card-body">
                    <span>
                      <span className="nova-mini-label">وحدات المحتوى</span>
                      <span className="nova-mini-value">{section.lessonsCount} عنصر</span>
                    </span>
                    <span>
                      <span className="nova-mini-label">المدة</span>
                      <span className="nova-mini-value">{section.durationMinutes ? `${section.durationMinutes} دقيقة` : "—"}</span>
                    </span>
                    <span>
                      <span className="nova-mini-label">الترتيب</span>
                      <span className="nova-mini-value">{section.order}</span>
                    </span>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="elevated" padding="md" className="nova-card">
          <p className="nova-section-label mb-4">بطاقة المحاضرة</p>
          <div className="nova-meta-grid">
            {[
              ["الترتيب", String(lecture.order)],
              ["الحالة", lecture.status ?? "—"],
              ["تاريخ الإنشاء", new Date(lecture.createdAt).toLocaleDateString("ar-SA")],
              ["آخر تحديث", new Date(lecture.updatedAt).toLocaleDateString("ar-SA")],
            ].map(([label, value]) => (
              <div key={label} className="nova-meta-tile">
                <span className="nova-mini-label">{label}</span>
                <span className="nova-mini-value">{value}</span>
              </div>
            ))}
          </div>
        </StudioSurfaceCard>
      </motion.div>
    </motion.div>
  );
}

export { CourseStudioLectureOverview };
```

---

## `apps/web/src/features/course-studio/components/CourseStudioSectionOverview.tsx`

```tsx
"use client";

import { motion } from "framer-motion";
import {
  Archive,
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  Clock,
  Copy,
  Eye,
  FileText,
  Layers,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioSurfaceCard } from "@/components/studio/surfaces/StudioSurfaceCard";
import { cn } from "@/lib/cn";
import type { CourseSection } from "@/features/course-sections/types";
import type { CourseModule } from "@/features/course-modules/types";

interface CourseStudioSectionOverviewProps {
  section: CourseSection;
  lecture?: CourseModule | null;
  breadcrumb?: { label: string; href?: string }[];
  onAddContent?: () => void;
  onEdit?: (section: CourseSection) => void;
  onDuplicate?: (section: CourseSection) => void;
  onArchive?: (section: CourseSection) => void;
  onDelete?: (section: CourseSection) => void;
  onRestore?: (section: CourseSection) => void;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

const easeCurve = [0.22, 1, 0.36, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeCurve } },
};

function visibilityLabel(section: CourseSection): { label: string; tone: "success" | "info" | "default" | "warning" } {
  if (section.freePreview) return { label: "معاينة مجانية", tone: "success" };
  if (section.locked) return { label: "مقفل", tone: "warning" };
  return { label: "ظاهر", tone: "info" };
}

function ActionChip({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  tone?: "danger";
}) {
  return (
    <button type="button" className="nova-action-chip" data-tone={tone} onClick={onClick}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function CourseStudioSectionOverview({
  section,
  lecture,
  breadcrumb,
  onAddContent,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onRestore,
  className,
}: CourseStudioSectionOverviewProps) {
  const displayDuration = section.durationMinutes ? `${section.durationMinutes} دقيقة` : "—";
  const visibility = visibilityLabel(section);
  const isDeleted = !!section.deletedAt;

  const crumbs = breadcrumb ?? [
    { label: "الدورة" },
    ...(lecture ? [{ label: lecture.title }] : []),
    { label: section.title },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("nova-page", className)}
    >
      <motion.nav
        variants={itemVariants}
        aria-label="مسار التنقل"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] text-studio-fg-muted"
      >
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronLeft className="h-3 w-3 rotate-180 text-studio-fg-subtle rtl:rotate-0" />}
            <span className={cn(i === crumbs.length - 1 && "font-extrabold text-studio-fg")}>{crumb.label}</span>
          </span>
        ))}
      </motion.nav>

      <motion.section variants={itemVariants} className="nova-editorial-hero p-5 sm:p-7" data-mark="02">
        <div className="relative z-[1] flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="nova-hero-index h-14 w-14 text-xl"
              style={section.color ? { background: section.color } : undefined}
            >
              <Layers className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="nova-section-label">وحدة تعليمية</p>
                <StudioStatusBadge status={section.status} />
                {isDeleted && (
                  <span className="rounded-full bg-studio-soft px-2 py-0.5 text-[10px] font-bold text-studio-fg-muted">مؤرشف</span>
                )}
              </div>
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-studio-fg sm:text-3xl">{section.title}</h1>
              {section.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-studio-fg-muted">{section.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold text-studio-fg-muted">
                  <Eye className="h-3.5 w-3.5" />
                  {visibility.label}
                </span>
                {section.freePreview && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-studio-success/10 px-3 py-1 text-[11px] font-bold text-studio-success">
                    <Eye className="h-3.5 w-3.5" /> معاينة مجانية
                  </span>
                )}
                {section.locked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-studio-warning/10 px-3 py-1 text-[11px] font-bold text-studio-warning">
                    <Lock className="h-3.5 w-3.5" /> مقفل
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="nova-action-strip relative z-[1] lg:max-w-[320px] lg:justify-end">
            {onAddContent && !isDeleted && (
              <StudioButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={onAddContent} className="nova-primary-btn">
                إضافة محتوى
              </StudioButton>
            )}
            <ActionChip icon={Pencil} label="تعديل" onClick={() => onEdit?.(section)} />
            <ActionChip icon={Copy} label="نسخ" onClick={() => onDuplicate?.(section)} />
            {isDeleted ? (
              <ActionChip icon={RotateCcw} label="استعادة" onClick={() => onRestore?.(section)} />
            ) : (
              <ActionChip icon={Archive} label="أرشفة" onClick={() => onArchive?.(section)} />
            )}
            <ActionChip icon={Trash2} label="حذف" tone="danger" onClick={() => onDelete?.(section)} />
          </div>
        </div>
      </motion.section>

      <motion.div variants={itemVariants} className="nova-stat-ribbon my-5">
        <div className="nova-stat-chip">
          <span><FileText className="h-4 w-4" /></span>
          <span><small>وحدات المحتوى</small><strong>{section.lessonsCount}</strong></span>
        </div>
        <div className="nova-stat-chip">
          <span><Clock className="h-4 w-4" /></span>
          <span><small>المدة التقديرية</small><strong className="text-sm">{displayDuration}</strong></span>
        </div>
        <div className="nova-stat-chip">
          <span><Eye className="h-4 w-4" /></span>
          <span><small>الظهور</small><strong className="text-sm">{visibility.label}</strong></span>
        </div>
        <div className="nova-stat-chip">
          <span><ArrowUpDown className="h-4 w-4" /></span>
          <span><small>الترتيب</small><strong>{section.order}</strong></span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="elevated" padding="md" className="nova-card">
          <p className="nova-section-label mb-4">بطاقة القسم</p>
          <div className="nova-meta-grid">
            {([
              { label: "تاريخ الإنشاء", value: new Date(section.createdAt).toLocaleDateString("ar-SA"), icon: CalendarDays },
              { label: "آخر تحديث", value: new Date(section.updatedAt).toLocaleDateString("ar-SA"), icon: CalendarDays },
              { label: "المدة التقديرية", value: displayDuration, icon: Clock },
              { label: "الترتيب", value: String(section.order), icon: ArrowUpDown },
            ] as const).map(({ label, value, icon: Icon }) => (
              <div key={label} className="nova-meta-tile">
                <span className="nova-mini-label flex items-center gap-1.5">
                  <Icon className="h-3 w-3" /> {label}
                </span>
                <span className="nova-mini-value">{value}</span>
              </div>
            ))}
          </div>
        </StudioSurfaceCard>
      </motion.div>
    </motion.div>
  );
}

export { CourseStudioSectionOverview, visibilityLabel };
```

---

## `apps/web/src/features/course-studio/components/CourseStudioContentOverview.tsx`

```tsx
﻿"use client";

import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  FileType,
  FolderOpen,
  Globe,
  Headphones,
  Link,
  Lock,
  Monitor,
  Pencil,
  Puzzle,
  Video,
} from "lucide-react";
import { StudioStatusBadge } from "@/components/studio/badges";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioSurfaceCard } from "@/components/studio/surfaces/StudioSurfaceCard";
import { cn } from "@/lib/cn";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";

const TYPE_META: Record<ContentItemType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  video: { label: "فيديو", icon: Video, color: "text-secondary", bg: "bg-secondary/10" },
  pdf: { label: "PDF", icon: FileType, color: "text-red-500", bg: "bg-red-500/10" },
  exam: { label: "اختبار", icon: ClipboardList, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  assignment: { label: "واجب", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" },
  resource: { label: "مورد", icon: FolderOpen, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  audio: { label: "صوت", icon: Headphones, color: "text-pink-500", bg: "bg-pink-500/10" },
  live: { label: "جلسة مباشرة", icon: Monitor, color: "text-rose-500", bg: "bg-rose-500/10" },
  scorm: { label: "SCORM", icon: Puzzle, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  external_link: { label: "رابط خارجي", icon: Link, color: "text-blue-500", bg: "bg-blue-500/10" },
  certificate: { label: "شهادة", icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  session: { label: "جلسة", icon: Calendar, color: "text-teal-500", bg: "bg-teal-500/10" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
};

interface CourseStudioContentOverviewProps {
  item: ContentItem;
  onEdit?: () => void;
  className?: string;
}

function PreviewStage({ item }: { item: ContentItem }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.resource;
  const Icon = meta.icon;

  return (
    <div className="nova-preview-stage">
      <div className="max-w-md">
        <div className={cn("mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl", meta.bg)}>
          <Icon className={cn("h-10 w-10", meta.color)} />
        </div>
        <h3 className="text-lg font-extrabold text-studio-fg">{meta.label}</h3>
        <p className="mt-2 text-sm leading-relaxed text-studio-fg-muted">
          {item.mediaId
            ? "تم ربط هذا المحتوى بوسائط من المكتبة."
            : "هذا امتداد لاختيار المحتوى موجود. يمكن ربط المحتوى من الوحدة المخصصة."}
        </p>
        {item.externalUrl && (
          <p className="mt-3 truncate text-xs text-studio-fg-subtle" dir="ltr">{item.externalUrl}</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] font-bold text-studio-fg-subtle">
          {item.mediaId && <span className="rounded-full bg-white px-3 py-1">معرف الوسائط: {item.mediaId}</span>}
          {item.examId && <span className="rounded-full bg-white px-3 py-1">معرف الاختبار: {item.examId}</span>}
        </div>
      </div>
    </div>
  );
}

function CourseStudioContentOverview({
  item,
  onEdit,
  className,
}: CourseStudioContentOverviewProps) {
  const meta = TYPE_META[item.type] ?? TYPE_META.resource;
  const Icon = meta.icon;
  const displayDuration = item.duration ? `${Math.round(item.duration / 60)} دقيقة` : "—";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("nova-page", className)}
    >
      <motion.section variants={itemVariants} className="nova-editorial-hero p-5 sm:p-7" data-mark="03">
        <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className={cn("nova-hero-icon h-14 w-14", meta.bg)}>
              <Icon className={cn("h-7 w-7", meta.color)} />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="nova-section-label">{meta.label}</p>
                <StudioStatusBadge status={item.status} />
              </div>
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-studio-fg sm:text-3xl">{item.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-studio-fg-muted">
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {displayDuration}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}</span>
                {item.freePreview && <span className="inline-flex items-center gap-1 text-studio-success"><Globe className="h-3.5 w-3.5" /> معاينة مجانية</span>}
                {item.locked && <span className="inline-flex items-center gap-1 text-studio-warning"><Lock className="h-3.5 w-3.5" /> مقفل</span>}
              </div>
            </div>
          </div>
          {onEdit && (
            <StudioButton variant="primary" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} className="nova-primary-btn shrink-0">
              تعديل المحتوى
            </StudioButton>
          )}
        </div>
      </motion.section>

      <motion.div variants={itemVariants} className="my-5">
        <PreviewStage item={item} />
      </motion.div>

      <motion.section variants={itemVariants} className="mb-5">
        <p className="nova-section-label mb-2">وصف المحتوى</p>
        <p className="rounded-2xl border border-studio-border bg-white/80 p-4 text-sm leading-relaxed text-studio-fg-muted">
          {item.description || "لا يوجد وصف"}
        </p>
      </motion.section>

      <motion.div variants={itemVariants}>
        <StudioSurfaceCard variant="elevated" padding="md" className="nova-card">
          <p className="nova-section-label mb-4">مواصفات الوحدة</p>
          <div className="nova-meta-grid">
            {[
              ["النوع", meta.label],
              ["الحالة", item.status === "published" ? "منشور" : item.status === "archived" ? "مؤرشف" : "مسودة"],
              ["الظهور", item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"],
              ["المدة", displayDuration],
              ["المعاينة المجانية", item.freePreview ? "مفعلة" : "غير مفعلة"],
              ["القفل", item.locked ? "نعم" : "لا"],
              ["تاريخ الإنشاء", new Date(item.createdAt).toLocaleDateString("ar-SA")],
              ["آخر تحديث", new Date(item.updatedAt).toLocaleDateString("ar-SA")],
            ].map(([label, value]) => (
              <div key={label} className="nova-meta-tile">
                <span className="nova-mini-label">{label}</span>
                <span className="nova-mini-value">{value}</span>
              </div>
            ))}
          </div>
        </StudioSurfaceCard>
      </motion.div>
    </motion.div>
  );
}

export { CourseStudioContentOverview };
```

---

## `apps/web/src/features/course-studio/components/CourseStudioContentList.tsx`

```tsx
﻿"use client";

import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ListMusic, Plus } from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { CourseStudioContentItem } from "./CourseStudioContentItem";
import { cn } from "@/lib/cn";
import type { ContentItem } from "@/features/course-content/types";

interface CourseStudioContentListProps {
  items: ContentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddContent?: () => void;
  onEdit?: (item: ContentItem) => void;
  onPublish?: (item: ContentItem) => void;
  onArchive?: (item: ContentItem) => void;
  onDuplicate?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
  onRestore?: (item: ContentItem) => void;
  onToggleFreePreview?: (item: ContentItem) => void;
  onReorder?: (items: ContentItem[], fromIndex: number, toIndex: number) => void;
  className?: string;
}

function CourseStudioContentList({
  items,
  selectedId,
  onSelect,
  onAddContent,
  onEdit,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onToggleFreePreview,
  onReorder,
  className,
}: CourseStudioContentListProps) {
  const dragItem = useRef<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, item: ContentItem) => {
      dragItem.current = items.findIndex((i) => i.id === item.id);
      e.dataTransfer.effectAllowed = "move";
    },
    [items],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, item: ContentItem) => {
      e.preventDefault();
      if (dragItem.current === null) return;
      const toIndex = items.findIndex((i) => i.id === item.id);
      if (dragItem.current === toIndex) return;
      onReorder?.(items, dragItem.current, toIndex);
      dragItem.current = null;
    },
    [items, onReorder],
  );

  return (
    <section className={cn("mt-7", className)} aria-label="وحدات المحتوى">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="nova-hero-icon h-10 w-10 rounded-xl"><ListMusic className="h-4 w-4" /></span>
          <div>
            <p className="nova-section-label">تدفق الدرس</p>
            <h3 className="flex items-center gap-2 text-base font-extrabold text-studio-fg">
              وحدات المحتوى
              <span className="rounded-full bg-studio-accent-soft px-2 py-0.5 text-[11px] font-bold text-studio-accent">
                {items.length}
              </span>
            </h3>
          </div>
        </div>
        {onAddContent && (
          <StudioButton variant="primary" size="sm" onClick={onAddContent} icon={<Plus className="h-4 w-4" />} className="nova-primary-btn">
            إضافة محتوى
          </StudioButton>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="nova-empty-card flex flex-col items-center gap-3 p-10 text-center"
        >
          <div className="nova-hero-icon h-12 w-12"><Layers className="h-6 w-6" /></div>
          <div>
            <h4 className="text-sm font-extrabold text-studio-fg">لم يتم إضافة محتوى بعد</h4>
            <p className="mt-1 text-xs text-studio-fg-muted">أضف فيديوهات، ملفات PDF، اختبارات، أو أي نوع من المحتوى.</p>
          </div>
          {onAddContent && (
            <StudioButton variant="primary" size="sm" onClick={onAddContent} icon={<Plus className="h-4 w-4" />} className="nova-primary-btn">
              إضافة محتوى
            </StudioButton>
          )}
        </motion.div>
      ) : (
        <div className="nova-timeline" role="list" aria-label="قائمة المحتوى">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <CourseStudioContentItem
                key={item.id}
                item={item}
                order={index + 1}
                isSelected={selectedId === item.id}
                onSelect={onSelect}
                onEdit={onEdit}
                onPublish={onPublish}
                onArchive={onArchive}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onRestore={onRestore}
                onToggleFreePreview={onToggleFreePreview}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onMoveUp={index > 0 && onReorder ? () => onReorder(items, index, index - 1) : undefined}
                onMoveDown={index < items.length - 1 && onReorder ? () => onReorder(items, index, index + 1) : undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

export { CourseStudioContentList };
```

---

## `apps/web/src/features/course-studio/components/CourseStudioContentItem.tsx`

```tsx
﻿"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Copy,
  Eye,
  FileText,
  FileType,
  FolderOpen,
  Globe,
  GripVertical,
  Headphones,
  Link,
  Lock,
  Monitor,
  Pencil,
  Puzzle,
  RotateCcw,
  Trash2,
  Video,
  Award,
  XCircle,
} from "lucide-react";
import { StudioStatusBadge } from "@/components/studio/badges";
import { cn } from "@/lib/cn";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";

const TYPE_ICONS: Record<ContentItemType, React.ComponentType<{ className?: string }>> = {
  video: Video,
  pdf: FileType,
  exam: ClipboardList,
  assignment: FileText,
  resource: FolderOpen,
  audio: Headphones,
  live: Monitor,
  scorm: Puzzle,
  external_link: Link,
  certificate: Award,
  session: CalendarDays,
};

const TYPE_META: Record<ContentItemType, { label: string; className: string }> = {
  video: { label: "فيديو", className: "text-secondary bg-secondary/10" },
  pdf: { label: "PDF", className: "text-red-500 bg-red-500/10" },
  exam: { label: "اختبار", className: "text-emerald-500 bg-emerald-500/10" },
  assignment: { label: "واجب", className: "text-orange-500 bg-orange-500/10" },
  resource: { label: "مورد", className: "text-cyan-500 bg-cyan-500/10" },
  audio: { label: "صوت", className: "text-pink-500 bg-pink-500/10" },
  live: { label: "جلسة مباشرة", className: "text-rose-500 bg-rose-500/10" },
  scorm: { label: "SCORM", className: "text-indigo-500 bg-indigo-500/10" },
  external_link: { label: "رابط خارجي", className: "text-blue-500 bg-blue-500/10" },
  certificate: { label: "شهادة", className: "text-yellow-500 bg-yellow-500/10" },
  session: { label: "جلسة", className: "text-teal-500 bg-teal-500/10" },
};

interface CourseStudioContentItemProps {
  item: ContentItem;
  order: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit?: (item: ContentItem) => void;
  onPublish?: (item: ContentItem) => void;
  onArchive?: (item: ContentItem) => void;
  onDuplicate?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
  onRestore?: (item: ContentItem) => void;
  onToggleFreePreview?: (item: ContentItem) => void;
  onDragStart?: (e: React.DragEvent, item: ContentItem) => void;
  onDragOver?: (e: React.DragEvent, item: ContentItem) => void;
  onDrop?: (e: React.DragEvent, item: ContentItem) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function MiniAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      className="nova-action-chip"
      data-tone={tone}
      disabled={disabled || !onClick}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

const CourseStudioContentItem = memo(function CourseStudioContentItem({
  item,
  order,
  isSelected,
  onSelect,
  onEdit,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onToggleFreePreview,
  onDragStart,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
}: CourseStudioContentItemProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(item.id);
      }
    },
    [item.id, onSelect],
  );

  const Icon = TYPE_ICONS[item.type] ?? FolderOpen;
  const meta = TYPE_META[item.type] ?? TYPE_META.resource;
  const isPublished = item.status === "published";
  const isArchived = item.status === "archived";
  const displayDuration = item.duration ? `${Math.round(item.duration / 60)} د` : "—";

  return (
    <motion.div
      data-content-id={item.id}
      data-selected={isSelected}
      role="listitem"
      aria-label={item.title}
      tabIndex={isSelected ? 0 : -1}
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="nova-timeline-item"
    >
      <span className="nova-step-bubble">{String(order).padStart(2, "0")}</span>
      <div
        className="nova-story-card cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
        onClick={() => onSelect(item.id)}
        onKeyDown={handleKeyDown}
        draggable
        onDragStart={(e) => onDragStart?.(e as unknown as React.DragEvent, item)}
        onDragOver={(e) => onDragOver?.(e as unknown as React.DragEvent, item)}
        onDrop={(e) => onDrop?.(e as unknown as React.DragEvent, item)}
      >
        <div className="nova-story-card-head">
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", meta.className)}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="nova-mini-label">{meta.label}</span>
              <span className="block truncate text-sm font-extrabold text-studio-fg">{item.title}</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StudioStatusBadge status={item.status} />
            <span className="nova-drag-handle" aria-hidden="true">
              <GripVertical className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="nova-story-card-body">
          <span>
            <span className="nova-mini-label">المدة</span>
            <span className="nova-mini-value">{displayDuration}</span>
          </span>
          <span>
            <span className="nova-mini-label">الظهور</span>
            <span className="nova-mini-value">
              {item.visibility === "public" ? "عام" : item.visibility === "preview" ? "معاينة" : "خاص"}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-studio-fg-muted">
            {item.freePreview && <Globe className="h-3.5 w-3.5 text-studio-success" aria-label="معاينة مجانية" />}
            {item.locked && <Lock className="h-3.5 w-3.5 text-studio-warning" aria-label="مقفل" />}
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>

        <div className="nova-action-strip border-t border-dashed border-studio-border px-3 py-3">
          <MiniAction icon={Pencil} label="تعديل" onClick={() => onEdit?.(item)} />
          <MiniAction icon={Copy} label="نسخ" onClick={() => onDuplicate?.(item)} />
          {!isPublished && !isArchived && <MiniAction icon={CheckCircle} label="نشر" onClick={() => onPublish?.(item)} />}
          {isPublished && <MiniAction icon={XCircle} label="إلغاء النشر" onClick={() => onArchive?.(item)} />}
          {!isArchived && <MiniAction icon={Archive} label="أرشفة" onClick={() => onArchive?.(item)} />}
          {isArchived && <MiniAction icon={RotateCcw} label="استعادة" onClick={() => onRestore?.(item)} />}
          <MiniAction
            icon={Globe}
            label={item.freePreview ? "إيقاف المعاينة" : "معاينة مجانية"}
            onClick={() => onToggleFreePreview?.(item)}
          />
          <MiniAction icon={ArrowUp} label="أعلى" onClick={onMoveUp} disabled={!onMoveUp} />
          <MiniAction icon={ArrowDown} label="أسفل" onClick={onMoveDown} disabled={!onMoveDown} />
          <MiniAction icon={Trash2} label="حذف" tone="danger" onClick={() => onDelete?.(item)} />
        </div>
      </div>
    </motion.div>
  );
});

export { CourseStudioContentItem };
```

---
