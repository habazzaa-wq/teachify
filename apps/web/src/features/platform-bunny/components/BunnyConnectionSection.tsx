"use client";

import { Plug, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  StudioInput,
  StudioSelect,
  StudioButton,
  StudioSurfaceCard,
  StudioSwitch,
} from "@/components/studio";
import { BunnyConnectionBadge } from "./BunnyConnectionBadge";
import { useVerifyBunnyConnection } from "../hooks";
import { BUNNY_REGIONS } from "../constants";
import { bunnyMessages as m } from "../messages";
import type { BunnySectionProps, BunnyRegion } from "../types";

const REGION_OPTIONS = BUNNY_REGIONS.map((r) => ({
  value: r,
  label:
    r === "de"
      ? m.regionDe
      : r === "uk"
        ? m.regionUk
        : r === "gb"
          ? m.regionGb
          : r === "sg"
            ? m.regionSg
            : r === "la"
              ? m.regionLa
              : m.regionNy,
}));

export function BunnyConnectionSection({
  draft,
  onChange,
}: BunnySectionProps) {
  const verify = useVerifyBunnyConnection();

  const handleVerify = () => {
    verify.mutate(
      {
        storageZoneName: draft.storageZoneName ?? "",
        storageZonePassword: draft.storageZonePasswordValue ?? "",
        storageZoneRegion: draft.storageZoneRegion ?? "de",
        apiKey: draft.apiKeyValue ?? "",
        libraryId: draft.libraryId ?? undefined,
        streamApiKey: draft.streamApiKeyValue ?? undefined,
        enableStream: draft.enableStream,
      },
      {
        onSuccess: (result) => {
          onChange({
            connectionStatus: result.status,
            lastError: result.error,
            lastVerifiedAt: new Date().toISOString(),
          });
        },
        onError: () => {
          onChange({ connectionStatus: "api_error" });
        },
      },
    );
  };

  return (
    <StudioSurfaceCard variant="default" padding="lg" className="border-studio-border">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-studio-accent-soft text-studio-accent">
          <Plug className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-studio-fg">{m.connection}</h3>
          <p className="text-sm text-studio-fg-muted">{m.connectionDesc}</p>
        </div>
        <div className="me-auto">
          <BunnyConnectionBadge status={draft.connectionStatus} />
        </div>
        <StudioSwitch
          checked={draft.enabled}
          onCheckedChange={(v) => onChange({ enabled: v })}
          aria-label={m.enabledToggle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StudioInput
          label={m.storageZoneName}
          hint={m.storageZoneNameHint}
          value={draft.storageZoneName ?? ""}
          onChange={(e) => onChange({ storageZoneName: e.target.value })}
        />
        <StudioInput
          label={m.storageZonePassword}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={draft.storageZonePasswordValue ?? ""}
          onChange={(e) => onChange({ storageZonePasswordValue: e.target.value })}
        />
        <StudioSelect
          label={m.storageZoneRegion}
          value={draft.storageZoneRegion ?? "de"}
          options={REGION_OPTIONS}
          onChange={(e) =>
            onChange({
              storageZoneRegion: e.target.value as BunnyRegion,
            })
          }
        />
        <StudioInput
          label={m.cdnHostname}
          hint={m.cdnHostnameHint}
          value={draft.cdnHostname ?? ""}
          onChange={(e) => onChange({ cdnHostname: e.target.value })}
        />
        <StudioInput
          label={m.libraryId}
          hint={m.libraryIdHint}
          value={draft.libraryId ?? ""}
          onChange={(e) => onChange({ libraryId: e.target.value })}
        />
        <StudioInput
          label={m.apiKey}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={draft.apiKeyValue ?? ""}
          onChange={(e) => onChange({ apiKeyValue: e.target.value })}
        />
        <StudioInput
          label={m.streamApiKey}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={draft.streamApiKeyValue ?? ""}
          onChange={(e) => onChange({ streamApiKeyValue: e.target.value })}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-studio-border pt-4">
        <StudioButton
          type="button"
          variant="secondary"
          onClick={handleVerify}
          loading={verify.isPending}
        >
          {verify.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plug className="h-4 w-4" />
          )}
          {m.verify}
        </StudioButton>

        <div className="text-xs text-studio-fg-muted">
          {draft.lastVerifiedAt ? (
            <span className="flex items-center gap-1.5">
              <motion.span
                key={draft.connectionStatus}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {m.lastVerified}: {new Date(draft.lastVerifiedAt).toLocaleString()}
              </motion.span>
            </span>
          ) : (
            <span>{m.neverVerified}</span>
          )}
        </div>

        {verify.isError && (
          <p role="alert" className="text-xs text-studio-danger">
            {m.verifyFailed}
          </p>
        )}
      </div>
    </StudioSurfaceCard>
  );
}
