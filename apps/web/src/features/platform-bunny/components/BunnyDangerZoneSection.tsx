"use client";

import { useState } from "react";
import { AlertTriangle, PowerOff, RotateCcw, Trash2 } from "lucide-react";
import {
  StudioSurfaceCard,
  StudioButton,
} from "@/components/studio";
import { BunnyConfirmDialog } from "./BunnyConfirmDialog";
import {
  useDisableBunnyIntegration,
  useResetBunnyConfig,
  useDeleteBunnyCredentials,
} from "../hooks";
import { bunnyMessages as m } from "../messages";

export function BunnyDangerZoneSection() {
  const [disableOpen, setDisableOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const disable = useDisableBunnyIntegration();
  const reset = useResetBunnyConfig();
  const del = useDeleteBunnyCredentials();

  return (
    <StudioSurfaceCard
      variant="outline"
      padding="lg"
      className="border-studio-danger/40 bg-studio-danger/5"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-studio-danger/10 text-studio-danger">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-studio-fg">{m.danger}</h3>
          <p className="text-sm text-studio-fg-muted">{m.dangerDesc}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-studio-border bg-studio-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.disableIntegration}</p>
            <p className="text-xs text-studio-fg-muted">{m.disableIntegrationDesc}</p>
          </div>
          <StudioButton
            type="button"
            variant="danger"
            onClick={() => setDisableOpen(true)}
          >
            <PowerOff className="h-4 w-4" />
            {m.disable}
          </StudioButton>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-studio-border bg-studio-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.resetConfig}</p>
            <p className="text-xs text-studio-fg-muted">{m.resetConfigDesc}</p>
          </div>
          <StudioButton
            type="button"
            variant="secondary"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
            {m.reset}
          </StudioButton>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-studio-border bg-studio-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium text-studio-fg">{m.deleteCredentials}</p>
            <p className="text-xs text-studio-fg-muted">{m.deleteCredentialsDesc}</p>
          </div>
          <StudioButton
            type="button"
            variant="danger"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {m.delete}
          </StudioButton>
        </div>
      </div>

      <BunnyConfirmDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        title={m.disableIntegration}
        description={m.disableIntegrationDesc}
        confirmLabel={m.disable}
        requiredText={m.disable}
        loading={disable.isPending}
        onConfirm={() =>
          disable.mutate(undefined, { onSuccess: () => setDisableOpen(false) })
        }
      />

      <BunnyConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={m.resetConfig}
        description={m.resetConfigDesc}
        confirmLabel={m.reset}
        requiredText={m.reset}
        loading={reset.isPending}
        onConfirm={() =>
          reset.mutate(undefined, { onSuccess: () => setResetOpen(false) })
        }
      />

      <BunnyConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={m.deleteCredentials}
        description={m.deleteCredentialsDesc}
        confirmLabel={m.delete}
        requiredText={m.delete}
        loading={del.isPending}
        onConfirm={() =>
          del.mutate(undefined, { onSuccess: () => setDeleteOpen(false) })
        }
      />
    </StudioSurfaceCard>
  );
}
