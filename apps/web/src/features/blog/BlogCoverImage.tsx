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
    <div className={`relative overflow-hidden bg-studio-accent ${className}`}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${imageClassName}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-studio-accent">
          <BookOpen className="h-10 w-10 text-studio-accent-fg/70" strokeWidth={1} aria-hidden="true" />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}
