"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  className: string;
  imageClassName?: string;
};

export function BlogCoverImage({ src, alt, className, imageClassName = "" }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-[var(--brand-primary)] ${className}`}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${imageClassName}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_75%_15%,var(--brand-secondary),transparent_38%),linear-gradient(145deg,var(--brand-primary),#171c36)]">
          <BookOpen className="h-10 w-10 text-white/60" strokeWidth={1} aria-hidden="true" />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}
