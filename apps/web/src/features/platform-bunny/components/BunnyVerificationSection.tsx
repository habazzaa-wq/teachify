"use client";

import { Activity, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StudioSurfaceCard,
  StudioButton,
} from "@/components/studio";
import { BunnyConnectionBadge } from "./BunnyConnectionBadge";
import { useBunnyHealth } from "../hooks";
import { bunnyMessages as m } from "../messages";
import type { BunnySectionProps } from "../types";

export function BunnyVerificationSection({
  draft,
  saving,
}: BunnySectionProps) {
  const health = useBunnyHealth();

  const handleRun = () => {
    health.refetch();
  };

  return (
    <StudioSurfaceCard variant="default" padding="lg" className="border-studio-border">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-studio-accent-soft text-studio-accent">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-studio-fg">{m.verification}</h3>
          <p className="text-sm text-studio-fg-muted">{m.verificationDesc}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-studio-border bg-studio-soft px-4 py-3">
          <span className="text-sm font-medium text-studio-fg">{m.connectionStatus}:</span>
          <BunnyConnectionBadge status={draft.connectionStatus} />
        </div>

        <StudioButton
          type="button"
          variant="secondary"
          onClick={handleRun}
          loading={health.isFetching}
          disabled={saving}
        >
          <Stethoscope className="h-4 w-4" />
          {m.runHealth}
        </StudioButton>
      </div>

      <AnimatePresence>
        {health.data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-xl border border-studio-border bg-studio-soft p-4">
              <div className="mb-2 flex items-center gap-2">
                <BunnyConnectionBadge status={health.data.status} />
                {draft.lastVerifiedAt && (
                  <span className="text-xs text-studio-fg-muted">
                    {m.lastVerified}: {new Date(draft.lastVerifiedAt).toLocaleString()}
                  </span>
                )}
              </div>
              {health.data.error ? (
                <p className="text-sm text-studio-danger">{health.data.error}</p>
              ) : health.data.details &&
                Object.keys(health.data.details).length > 0 ? (
                <ul className="flex flex-col gap-1 text-sm text-studio-fg-muted">
                  {Object.entries(health.data.details).map(([key, value]) => (
                    <li key={key} className="flex justify-between gap-3">
                      <span>{key}</span>
                      <span className="font-medium text-studio-fg">{String(value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-studio-fg-muted">{m.noDetails}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StudioSurfaceCard>
  );
}
