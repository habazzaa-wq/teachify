"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";
import { useBrandColors } from "@/hooks/useBrandColors";
import { usePublicStages, useStageStatsState } from "@/features/homepage/educational-stages/hooks";
import type { StageItem, StageStats } from "@/features/homepage/educational-stages/types";
import { formatNumber } from "@/lib/format";
import { toAbsoluteAssetUrl } from "@/lib/url";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function stageTag(name: string | null): string {
  const t = (name ?? "").trim();
  if (!t) return "";
  if (t.startsWith("المرحلة ")) return t.slice("المرحلة ".length).replace(/^ال/, "").trim();
  if (t.startsWith("الصف ")) return t.slice("الصف ".length).trim();
  if (t.startsWith("رياض الأطفال")) return "رياض الأطفال";
  return t.length > 14 ? `${t.slice(0, 12)}…` : t;
}

/* ────────────── featured image ────────────── */

function FeaturedVisual({ stage, brand, secondary }: { stage: StageItem; brand: string; secondary: string }) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => toAbsoluteAssetUrl(stage.image), [stage.image]);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="relative order-1 h-full min-h-[200px] w-full sm:order-2 sm:min-h-[280px]">
      {showImage ? (
        <Image
          src={src as string}
          alt={stage.name}
          fill
          sizes="(max-width: 1023px) 100vw, 38vw"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full min-h-[200px] w-full items-center justify-center sm:min-h-[280px]"
          style={{ background: `linear-gradient(135deg, ${brand}14 0%, ${secondary}0c 100%)` }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl border"
            style={{ borderColor: `${brand}33`, background: `${brand}14`, color: brand }}
          >
            <GraduationCap aria-hidden="true" className="h-8 w-8" />
          </span>
        </div>
      )}

      <span className="absolute start-4 top-4 z-10 inline-flex items-center rounded-full border border-white/60 bg-white/85 px-3 py-1 text-[11px] font-bold text-primary backdrop-blur-sm">
        {stageTag(stage.name)}
      </span>
    </div>
  );
}

/* ────────────── section ────────────── */

export function EducationalStagesSection() {
  const { primary, secondary } = useBrandColors();

  const { data, isLoading } = usePublicStages();
  const all = useMemo(() => data?.items ?? [], [data]);
  const allIds = useMemo(() => all.map((s) => s.id), [all]);
  const { statsById, loadingIds } = useStageStatsState(allIds, true);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const active = (selectedId != null ? all.find((s) => s.id === selectedId) : undefined) ?? all[0];
  const activeIndex = all.findIndex((s) => s.id === active?.id);

  const count = all.length;

  if (count === 0 && !isLoading) return null;

  const activeStats: StageStats | undefined = active ? statsById.get(active.id) : undefined;
  const activeLoading = active ? loadingIds.has(active.id) : false;

  return (
    <section
      id="educational-stages"
      dir="rtl"
      aria-labelledby="educational-stages-title"
      className="relative w-full scroll-mt-24 bg-background py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span aria-hidden="true" className="h-px w-8 bg-border" />
              المسار التعليمي
            </div>
            <h2
              id="educational-stages-title"
              className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              المراحل الدراسية
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              مسارات تعليمية مصمّمة بعناية لكل مرحلة — اختر مستواك وابدأ رحلتك من حيث أنت.
            </p>
          </div>
          <div className="hidden items-baseline gap-2 text-sm text-muted-foreground md:flex">
            <span className="text-lg font-extrabold tabular-nums text-foreground">{formatNumber(count)}</span>
            مراحل متاحة
          </div>
        </div>

        {/* body */}
        {isLoading || !active ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:gap-8" aria-busy="true" aria-label="جارٍ تحميل المراحل الدراسية">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="aspect-[16/10] w-full animate-pulse rounded-3xl bg-muted" />
            </div>
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
            {/* featured */}
            <div className="lg:col-span-7 xl:col-span-8">
              <article className="stage-swap relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card sm:flex-row" key={active.id}>
                <FeaturedVisual stage={active} brand={primary} secondary={secondary} />

                <div className="flex flex-1 flex-col justify-between gap-6 p-6 sm:p-8">
                  <div>
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      <span className="tabular-nums">المرحلة {pad(activeIndex + 1)}</span>
                      <span aria-hidden="true" className="h-px w-8 bg-primary/40" />
                    </div>
                    <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-card-foreground sm:text-3xl">{active.name}</h3>
                    {active.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{active.description}</p>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <span className="inline-flex items-center gap-2 font-semibold text-muted-foreground">
                        <BookOpen aria-hidden="true" className="h-4 w-4" style={{ color: primary }} />
                        {activeLoading ? (
                          <span className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                        ) : (
                          <>{formatNumber(activeStats?.coursesCount ?? 0)} دورة</>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-2 font-semibold text-muted-foreground">
                        <Users aria-hidden="true" className="h-4 w-4" style={{ color: primary }} />
                        {activeLoading ? (
                          <span className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                        ) : (
                          <>{formatNumber(activeStats?.teachersCount ?? 0)} مدرّس</>
                        )}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <Link
                        href={`/stages/${active.id}`}
                        aria-label={`${active.name} — استكشف المرحلة`}
                        className="group/cta inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-[var(--brand-primary-contrast)] transition-colors duration-200 hover:bg-primary/90"
                      >
                        استكشف المرحلة
                        <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover/cta:-translate-x-1" />
                      </Link>
                      <span className="text-xs text-muted-foreground">تصفّح الدورات والمدرّسين المتاحين</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* index */}
            <nav
              aria-label="قائمة المراحل الدراسية"
              className="lg:col-span-5 xl:col-span-4"
            >
              <div className="rounded-3xl border border-border bg-card p-3 sm:p-4">
                {all.map((stage, i) => {
                  const isActive = stage.id === active.id;
                  const cStats = statsById.get(stage.id);
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setSelectedId(stage.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={`group relative flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-start transition-colors duration-200 ${
                        isActive ? "bg-muted/60" : "hover:bg-muted/50"
                      }`}
                    >
                      {isActive ? (
                        <span aria-hidden="true" className="absolute inset-y-2 start-1 w-1 rounded-full bg-primary" />
                      ) : null}

                      <span
                        className={`text-sm font-bold tabular-nums transition-colors duration-200 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {pad(i + 1)}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-base font-bold transition-colors duration-200 ${
                            isActive ? "text-card-foreground" : "text-card-foreground/80 group-hover:text-card-foreground"
                          }`}
                        >
                          {stage.name}
                        </span>
                        {stage.description ? (
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{stage.description}</span>
                        ) : null}
                      </span>

                      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                        {formatNumber(cStats?.coursesCount ?? 0)} دورة
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
}
