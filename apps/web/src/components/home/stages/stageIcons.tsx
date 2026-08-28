import type { ReactElement, SVGProps } from "react";
import type { StageIconKey } from "./types";

type IconProps = SVGProps<SVGSVGElement>;

/* Each icon is purpose-built (not a stock glyph) and uses `currentColor`,
   so it automatically picks up the badge's `--tone-fg` token and stays
   legible on every tonal variant / dark mode. */

function Sprout(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13c0-3 2-5 5-5 0 3.2-2 5-5 5Z" fill="currentColor" opacity="0.92" />
      <path d="M12 13c0-2.6-1.8-4.6-4.6-4.6C7.5 11.2 9.4 13 12 13Z" fill="currentColor" opacity="0.66" />
    </svg>
  );
}

function Blocks(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="11.5" width="8" height="8" rx="2.2" fill="currentColor" opacity="0.92" />
      <rect x="12.5" y="4.5" width="8" height="8" rx="2.2" fill="currentColor" opacity="0.66" />
    </svg>
  );
}

function Book(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 6.2C10 4.9 7.8 4.9 5.5 5.2v11.1c2.3-.3 4.5-.3 6.5 1 2-1.3 4.2-1.3 6.5-1V5.2C16.2 4.9 14 4.9 12 6.2Z" fill="currentColor" opacity="0.9" />
      <path d="M12 6.2V17.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Compass(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14.8 9.2 12 11l-2.8 1.8 2.4 1.8L15.6 11Z" fill="currentColor" />
    </svg>
  );
}

function Trending(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 15.5 9 10.5l3.2 3.2L20 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 6.5H20V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19.5v-3M8 19.5v-5M12 19.5v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function Graduation(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M3 9.2 12 5l9 4.2-9 4.2L3 9.2Z" fill="currentColor" />
      <path d="M7 11.2v3.8c0 1.6 2.4 3 5 3s5-1.4 5-3v-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21 9.2v3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Target(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.7" opacity="0.7" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

const REGISTRY: Record<Exclude<StageIconKey, "auto">, (p: IconProps) => ReactElement> = {
  sprout: Sprout,
  blocks: Blocks,
  book: Book,
  compass: Compass,
  trending: Trending,
  graduation: Graduation,
  target: Target,
};

export function StageIcon({ name, className }: { name: StageIconKey; className?: string }) {
  const Key = name === "auto" ? "book" : name;
  const Cmp = REGISTRY[Key] ?? Book;
  return <Cmp className={className} />;
}
