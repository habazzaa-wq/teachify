import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared marketing primitives: section shells, editorial labels, buttons,
 * and a browser-window frame used to stage the product mockups.
 */

export function SectionShell({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative scroll-mt-20 py-20 sm:py-24 lg:py-32", className)}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">{children}</div>
    </section>
  );
}

export function SectionLabel({
  children,
  onDeep = false,
  className,
}: {
  children: ReactNode;
  onDeep?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("mk-label", onDeep && "mk-label-on-deep", className)}>{children}</p>
  );
}

export function CtaButton({
  children,
  href,
  variant = "primary",
  className,
  external = false,
  ariaLabel,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "gold" | "ghost" | "ghost-deep";
  className?: string;
  external?: boolean;
  ariaLabel?: string;
}) {
  const classes = cn(
    "mk-btn",
    {
      "mk-btn-primary": variant === "primary",
      "mk-btn-gold": variant === "gold",
      "mk-btn-ghost": variant === "ghost",
      "mk-btn-ghost-deep": variant === "ghost-deep",
    },
    className,
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function WindowFrame({
  url,
  children,
  className,
  deep = false,
}: {
  url: ReactNode;
  children: ReactNode;
  className?: string;
  deep?: boolean;
}) {
  return (
    <div className={cn("mk-window", deep && "mk-window-deep", className)}>
      <div className="mk-window-bar">
        <span className="mk-window-dot" style={{ background: "hsl(var(--mk-primary) / 0.75)" }} />
        <span className="mk-window-dot" style={{ background: "hsl(var(--mk-gold))" }} />
        <span className="mk-window-dot" style={{ background: "hsl(var(--mk-line-strong))" }} />
        <span className="mk-window-url">{url}</span>
      </div>
      {children}
    </div>
  );
}

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5", className)}
    >
      <path
        d="M3 8h9M8 3.5 12.5 8 8 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
