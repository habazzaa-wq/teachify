import type { CSSProperties } from "react";
import { hexToRgb, mixWithBlack, mixWithWhite } from "@/lib/color";
import { accentClass, accentForProgress, type EducationalStage } from "./types";

/**
 * Per-stage accent tokens. An explicit `accentColor` wins; otherwise the shared
 * warm→gold journey via `accentClass` (which installs the `--stage-*` CSS vars).
 * Shared by the index card, its tab, and the deck.peek profiles so the file
 * reads as one paper system.
 */
export function stageAccentTokens(
  stage: EducationalStage,
  order: number,
  total: number,
): { className: string; style?: CSSProperties } {
  if (stage.accentColor) {
    const rgb = hexToRgb(stage.accentColor);
    const luminance = rgb ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 : 0.5;
    return {
      className: "",
      style: {
        "--stage-color": stage.accentColor,
        "--stage-color-soft": mixWithWhite(stage.accentColor, 0.42),
        "--stage-color-deep": mixWithBlack(stage.accentColor, 0.28),
        "--stage-fg": luminance > 0.62 ? "#1a120b" : "#ffffff",
      } as CSSProperties,
    };
  }
  const t = Math.max(0, Math.min(1, total > 1 ? order / (total - 1) : 0.45));
  return { className: accentClass(accentForProgress(t)) };
}