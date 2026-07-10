"use client";

import { useState } from "react";

import {
  Plug,
  Database,
  Radio,
  Shield,
  Upload,
  Activity,
  AlertTriangle,
  Save,
} from "lucide-react";
import { motion, MotionConfig } from "framer-motion";
import { cn } from "@/lib/cn";
import { StudioButton } from "@/components/studio";
import { StudioPageLoading, StudioGenericError } from "@/components/studio";
import { useBunnySettings, useUpdateBunnySettings } from "../hooks";
import { BUNNY_SECTION_ORDER, BUNNY_SECTION_ICONS } from "../constants";
import { bunnyMessages as m } from "../messages";
import { buildUpdatePayload, emptyBunnySettings } from "../utils";
import { useBunnySettingsUIStore } from "../store";
import { BunnyConnectionSection } from "./BunnyConnectionSection";
import { BunnyStorageSection } from "./BunnyStorageSection";
import { BunnyStreamingSection } from "./BunnyStreamingSection";
import { BunnySecuritySection } from "./BunnySecuritySection";
import { BunnyUploadDefaultsSection } from "./BunnyUploadDefaultsSection";
import { BunnyVerificationSection } from "./BunnyVerificationSection";
import { BunnyDangerZoneSection } from "./BunnyDangerZoneSection";
import type { BunnySection, BunnySettings } from "../types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  plug: Plug,
  database: Database,
  radio: Radio,
  shield: Shield,
  upload: Upload,
  activity: Activity,
  "alert-triangle": AlertTriangle,
};

const SECTION_TITLES: Record<BunnySection, string> = {
  connection: m.navConnection,
  storage: m.navStorage,
  streaming: m.navStreaming,
  security: m.navSecurity,
  upload: m.navUpload,
  verification: m.navVerification,
  danger: m.navDanger,
};

export function BunnyWorkspace() {
  const { data, isLoading, isError, refetch } = useBunnySettings();
  const update = useUpdateBunnySettings();
  const activeSection = useBunnySettingsUIStore((s) => s.activeSection);
  const setActiveSection = useBunnySettingsUIStore((s) => s.setActiveSection);

  const settings = data?.settings ?? emptyBunnySettings();
  const [overrides, setOverrides] = useState<Partial<BunnySettings>>({});
  const draft = { ...settings, ...overrides };
  const dirty = Object.keys(overrides).length > 0;

  const handleChange = (patch: Partial<BunnySettings>) => {
    setOverrides((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    update.mutate(buildUpdatePayload(draft), {
      onSuccess: () => {
        setOverrides({});
      },
    });
  };

  if (isLoading) {
    return <StudioPageLoading />;
  }

  if (isError) {
    return <StudioGenericError onRetry={() => refetch()} />;
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-studio-fg">{m.title}</h2>
          <p className="text-sm text-studio-fg-muted">{m.description}</p>
          {dirty && (
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-studio-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-studio-warning" />
              {m.unsaved}
            </span>
          )}
        </div>
        <StudioButton
          type="button"
          onClick={handleSave}
          loading={update.isPending}
          disabled={!dirty}
          icon={<Save className="h-4 w-4" />}
        >
          {m.save}
        </StudioButton>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <nav
          aria-label={m.title}
          className="flex flex-row flex-wrap gap-1 lg:flex-col"
        >
          {BUNNY_SECTION_ORDER.map((section) => {
            const Icon = ICON_MAP[BUNNY_SECTION_ICONS[section]];
            const active = activeSection === section;
            return (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg",
                  active
                    ? "bg-studio-accent-soft text-studio-accent"
                    : "text-studio-fg-muted hover:bg-studio-soft hover:text-studio-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bunny-section-active"
                    className="absolute inset-y-1 start-0 w-1 rounded-full bg-studio-accent"
                    transition={{ duration: 0.2 }}
                  />
                )}
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span>{SECTION_TITLES[section]}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-6"
          >
            {activeSection === "connection" && (
              <BunnyConnectionSection
                settings={settings}
                draft={draft}
                onChange={handleChange}
                saving={update.isPending}
              />
            )}
            {activeSection === "storage" && (
              <BunnyStorageSection
                settings={settings}
                draft={draft}
                onChange={handleChange}
                saving={update.isPending}
              />
            )}
            {activeSection === "streaming" && (
              <BunnyStreamingSection
                settings={settings}
                draft={draft}
                onChange={handleChange}
                saving={update.isPending}
              />
            )}
            {activeSection === "security" && (
              <BunnySecuritySection
                settings={settings}
                draft={draft}
                onChange={handleChange}
                saving={update.isPending}
              />
            )}
            {activeSection === "upload" && (
              <BunnyUploadDefaultsSection
                settings={settings}
                draft={draft}
                onChange={handleChange}
                saving={update.isPending}
              />
            )}
            {activeSection === "verification" && (
              <BunnyVerificationSection
                settings={settings}
                draft={draft}
                onChange={handleChange}
                saving={update.isPending}
              />
            )}
            {activeSection === "danger" && <BunnyDangerZoneSection />}
          </motion.div>
        </div>
      </div>
    </div>
    </MotionConfig>
  );
}
