"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Flame,
  GraduationCap,
  Home,
  Medal,
  Wallet,
} from "lucide-react";
import { useBrandTheme } from "./StudentCard";
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  BRAND_TEXT_ON_PRIMARY,
} from "../constants";
import { formatNumber } from "@/lib/format";

export type DashboardViewId =
  | "overview"
  | "courses"
  | "exams"
  | "tasks"
  | "wallet"
  | "achievements"
  | "calendar";

interface DashboardViewMeta {
  id: DashboardViewId;
  label: string;
  icon: LucideIcon;
}

export const DASHBOARD_VIEWS: DashboardViewMeta[] = [
  { id: "overview", label: "الرئيسية", icon: Home },
  { id: "courses", label: "دوراتي", icon: BookOpen },
  { id: "exams", label: "الاختبارات", icon: ClipboardCheck },
  { id: "tasks", label: "المهام", icon: CalendarClock },
  { id: "wallet", label: "سجل المحفظة", icon: Wallet },
  { id: "achievements", label: "الإنجازات", icon: Medal },
  { id: "calendar", label: "المواعيد", icon: CalendarDays },
];

interface NavDockProps {
  active: DashboardViewId;
  onChange: (id: DashboardViewId) => void;
  streakDays: number;
}

const orbBase =
  "group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300";

function Orb({
  meta,
  isActive,
  onClick,
  t,
}: {
  meta: DashboardViewMeta;
  isActive: boolean;
  onClick: () => void;
  t: ReturnType<typeof useBrandTheme>;
}) {
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={meta.label}
      aria-current={isActive ? "page" : undefined}
      className={`${orbBase} ${isActive ? "" : "hover:-translate-y-0.5"}`}
      style={
        isActive
          ? {
              background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
              color: BRAND_TEXT_ON_PRIMARY,
              boxShadow: "0 8px 22px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.12) inset",
            }
          : {
              backgroundColor: t.isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.75)",
              color: t.muted,
              border: `1px solid ${t.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            }
      }
    >
      {isActive && (
        <span
          className="absolute -inset-1.5 animate-pulse-soft rounded-full border-2"
          style={{ borderColor: BRAND_PRIMARY, opacity: 0.55 }}
          aria-hidden="true"
        />
      )}
      <Icon className="h-[22px] w-[22px]" aria-hidden="true" />

      <span
        className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-black opacity-0 shadow-lg backdrop-blur transition-all duration-200 group-hover:-translate-x-0.5 group-hover:opacity-100 lg:block"
        style={{
          backgroundColor: t.isDark ? "rgba(24,22,30,0.94)" : "rgba(255,255,255,0.96)",
          borderColor: t.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          color: t.ink,
          boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
        }}
      >
        {meta.label}
      </span>
    </button>
  );
}

/**
 * Floating navigation dock — a slim vertical capsule anchored to the reading
 * edge (right in RTL). Items switch views in place; nothing navigates.
 */
export function NavDock({ active, onChange, streakDays }: NavDockProps) {
  const t = useBrandTheme();
  const activeIndex = Math.max(
    0,
    DASHBOARD_VIEWS.findIndex((v) => v.id === active),
  );
  const fillPercent = ((activeIndex + 1) / DASHBOARD_VIEWS.length) * 100;
  const activeLabel = DASHBOARD_VIEWS[activeIndex]?.label ?? "";

  return (
    <>
      {/* ─── Desktop: floating capsule dock ─── */}
      <nav
        aria-label="التنقل داخل لوحة الطالب"
        className="animate-fade-in-left fixed bottom-0 right-4 top-[7.5rem] z-40 my-auto hidden lg:block"
        style={{ animationDelay: "0.15s" }}
      >
        <div
          className="relative flex flex-col items-center gap-1.5 rounded-[2rem] border px-2.5 py-4 shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: t.isDark ? "rgba(20,18,26,0.9)" : "rgba(255,253,248,0.88)",
            borderColor: t.isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)",
            boxShadow: t.isDark
              ? "0 12px 40px rgba(0,0,0,0.45)"
              : "0 12px 40px rgba(120,90,60,0.16)",
          }}
        >
          {/* spine */}
          <div
            className="absolute inset-y-6 right-1/2 w-[3px] translate-x-1/2 rounded-full"
            style={{
              backgroundColor: t.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-6 right-1/2 w-[3px] translate-x-1/2 rounded-full transition-all duration-500 ease-out"
            style={{
              height: `calc((100% - 3rem) * ${fillPercent / 100})`,
              background: `linear-gradient(180deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
              opacity: 0.9,
            }}
            aria-hidden="true"
          />

          {/* hub */}
          <div className="relative mb-2">
            <button
              type="button"
              onClick={() => onChange("overview")}
              aria-label="لوحة التحكم"
              className="relative flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: `linear-gradient(140deg, ${BRAND_SECONDARY}, ${BRAND_PRIMARY})`,
                color: BRAND_TEXT_ON_PRIMARY,
                boxShadow: "0 8px 20px rgba(0,0,0,0.28)",
              }}
            >
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </button>
            <span
              className="absolute -inset-1.5 rounded-full border border-dashed"
              style={{ borderColor: BRAND_SECONDARY, opacity: 0.6 }}
              aria-hidden="true"
            />
          </div>

          <div className="my-1 h-px w-7 rounded-full" style={{ backgroundColor: t.divider }} aria-hidden="true" />

          <div className="relative flex flex-col items-center gap-1.5">
            {DASHBOARD_VIEWS.map((meta) => (
              <Orb
                key={meta.id}
                meta={meta}
                isActive={meta.id === active}
                onClick={() => onChange(meta.id)}
                t={t}
              />
            ))}
          </div>

          {/* streak readout */}
          <div className="my-1 h-px w-7 rounded-full" style={{ backgroundColor: t.divider }} aria-hidden="true" />
          <div
            className="relative mt-1 flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${t.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
            }}
          >
            <Flame className="h-5 w-5" style={{ color: BRAND_SECONDARY }} aria-hidden="true" />
            <span
              className="absolute -bottom-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black tabular-nums"
              style={{
                backgroundColor: BRAND_PRIMARY,
                color: BRAND_TEXT_ON_PRIMARY,
                boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
              }}
            >
              {formatNumber(streakDays)}
            </span>
          </div>
        </div>
      </nav>

      {/* ─── Mobile: floating bottom bar ─── */}
      <nav
        aria-label="التنقل داخل لوحة الطالب"
        className="animate-fade-in-up fixed inset-x-3 bottom-3 z-40 lg:hidden"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="relative mx-auto max-w-md">
          <div
            className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border px-3.5 py-1.5 text-xs font-black shadow-lg backdrop-blur"
            style={{
              backgroundColor: t.isDark ? "rgba(24,22,30,0.94)" : "rgba(255,255,255,0.96)",
              borderColor: t.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              color: t.ink,
            }}
          >
            {activeLabel}
          </div>
          <div
            className="flex items-center justify-between gap-1 rounded-3xl border px-2 py-2 shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: t.isDark ? "rgba(20,18,26,0.92)" : "rgba(255,253,248,0.92)",
              borderColor: t.isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)",
            }}
          >
            {DASHBOARD_VIEWS.map((meta) => (
              <button
                key={meta.id}
                type="button"
                onClick={() => onChange(meta.id)}
                aria-label={meta.label}
                aria-current={meta.id === active ? "page" : undefined}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 ${
                  meta.id === active ? "scale-110" : ""
                }`}
                style={
                  meta.id === active
                    ? {
                        background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`,
                        color: BRAND_TEXT_ON_PRIMARY,
                        boxShadow: "0 8px 18px rgba(0,0,0,0.3)",
                      }
                    : { color: t.muted }
                }
              >
                <meta.icon className="h-5 w-5" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
