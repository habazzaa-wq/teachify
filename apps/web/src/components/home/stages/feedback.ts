"use client";

/**
 * Micro-feedback for touch devices — a premium, app-like tactile layer that
 * degrades silently everywhere else.
 *
 *  · Haptic: a 10ms tick on card tap and carousel snap, via `navigator.vibrate`
 *    wrapped in a feature check. No-op on unsupported browsers / desktop.
 *  · Sound: OPTIONAL and OFF by default. Flip `STAGE_SOUND_ENABLED` only if the
 *    platform already uses UI sound cues elsewhere. When on, it synthesises a
 *    sub-100ms soft "pop" with the Web Audio API — it never autoplays and
 *    never fires on hover, only on a deliberate tap/click, and it respects
 *    `prefers-reduced-motion`.
 */

const STAGE_SOUND_ENABLED = false;

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Very light haptic tick. Safe to call unconditionally. */
export function triggerHaptic(pattern: number | number[] = 10): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

let audioCtx: AudioContext | null = null;

/** Extremely subtle, short UI "pop". No-op unless explicitly enabled. */
export function triggerTapSound(): void {
  if (!STAGE_SOUND_ENABLED) return;
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioCtx = audioCtx ?? new Ctor();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    /* ignore */
  }
}

/** Combined deliberate-tap feedback (haptic + optional sound). */
export function tapFeedback(): void {
  triggerHaptic(10);
  triggerTapSound();
}
