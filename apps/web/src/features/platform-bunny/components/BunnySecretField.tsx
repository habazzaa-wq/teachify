"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { StudioButton } from "@/components/studio";
import { useRevealBunnySecret } from "../hooks";
import { bunnyMessages as m } from "../messages";
import type { BunnySecretField as BunnySecretFieldType } from "../types";

interface BunnySecretFieldProps {
  label: string;
  maskedValue: string | null;
  hasValue: boolean;
  field: BunnySecretFieldType;
  className?: string;
}

export function BunnySecretField({
  label,
  maskedValue,
  hasValue,
  field,
  className,
}: BunnySecretFieldProps) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const reveal = useRevealBunnySecret();

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(null);
      return;
    }
    try {
      const result = await reveal.mutateAsync(field);
      setRevealed(result.value);
    } catch {
      setRevealed(null);
    }
  };

  const handleCopy = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const display = revealed ?? maskedValue ?? "—";
  const isRevealed = revealed !== null;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border border-studio-border bg-studio-surface p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-studio-fg">{label}</span>
        <div className="flex items-center gap-2">
          <StudioButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReveal}
            loading={reveal.isPending}
            aria-label={isRevealed ? `${m.cancel} ${label}` : `${m.revealSecret} ${label}`}
          >
            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isRevealed ? m.cancel : m.revealSecret}
          </StudioButton>
          <StudioButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!isRevealed}
            aria-label={`${m.copySecret} ${label}`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </StudioButton>
        </div>
      </div>

      <div
        className="min-h-[2.25rem] rounded-lg border border-studio-border bg-studio-soft px-3 py-2 font-mono text-sm text-studio-fg-muted"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={isRevealed ? "revealed" : "masked"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(isRevealed ? "text-studio-fg" : "tracking-widest")}
          >
            {hasValue || revealed ? display : m.notSet}
          </motion.span>
        </AnimatePresence>
      </div>

      {isRevealed && (
        <span className="text-xs text-studio-fg-subtle">{m.revealHint}</span>
      )}
    </div>
  );
}
