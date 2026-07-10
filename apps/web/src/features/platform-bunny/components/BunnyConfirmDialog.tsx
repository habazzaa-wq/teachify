"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { StudioDialog, StudioButton, StudioInput } from "@/components/studio";
import { bunnyMessages as m } from "../messages";

interface BunnyConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  requiredText?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}

export function BunnyConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  requiredText,
  confirmLabel = m.confirmOk,
  loading,
  onConfirm,
}: BunnyConfirmDialogProps) {
  const [text, setText] = useState("");

  const handleClose = () => {
    setText("");
    onOpenChange(false);
  };

  const handleConfirm = () => {
    setText("");
    onConfirm();
  };

  const matches = !requiredText || text === requiredText;
  const canConfirm = matches && !loading;

  return (
    <StudioDialog
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <StudioButton
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            {m.cancel}
          </StudioButton>
          <StudioButton
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={!canConfirm}
            loading={loading}
          >
            {confirmLabel}
          </StudioButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {requiredText && (
          <p className="text-sm text-studio-fg-muted">
            {m.confirmDanger}{" "}
            <span className="font-semibold text-studio-danger">{requiredText}</span>
          </p>
        )}
        {requiredText && (
          <StudioInput
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={m.confirmPlaceholder}
            aria-label={m.confirmPlaceholder}
            autoFocus
          />
        )}
        {!matches && requiredText && (
          <p role="alert" className="text-xs text-studio-danger">
            {m.confirmDanger}
          </p>
        )}
        <div className="flex items-center gap-2 rounded-lg bg-studio-danger/10 px-3 py-2 text-xs text-studio-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{m.confirmDanger}</span>
        </div>
      </div>
    </StudioDialog>
  );
}
