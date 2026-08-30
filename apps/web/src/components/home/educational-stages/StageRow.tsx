"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";
import type { StageSectionItem } from "./types";

/** Brand-tinted blur placeholder so a missing image never flashes broken. */
const IMAGE_BLUR = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f0cdc4'/><stop offset='1' stop-color='#ffe3a3'/></linearGradient></defs><rect width='8' height='8' fill='url(#g)'/></svg>`,
)}`;

interface StageRowProps {
  item: StageSectionItem;
  /** Global 0-based position in the list — drives side alternation, brand tint
   *  alternation and the slide direction. */
  index: number;
  /** Eager-load the image. Kept true only for the first row. */
  priority?: boolean;
}

/** Flat brand-tinted placeholder for stages that have no usable image. */
function StagePlaceholder() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--primary-tint), var(--secondary-tint))",
      }}
    >
      <span className="relative h-14 w-14 rounded-full bg-[var(--ink)]/10" />
    </span>
  );
}

/**
 * One educational stage as a full-width horizontal "split profile" row.
 *
 * Desktop (≥1024px): a 2-column grid — a full-bleed `next/image` photograph on
 * one side and a brand-tinted content panel on the other, alternating sides via
 * `index % 2`. Tablet & mobile stack image-top / content-below.
 *
 * The single scroll-entrance moment uses one `whileInView` trigger per row
 * (the container) with opposing horizontal slides for image and content.
 */
export function StageRow({ item, index, priority = false }: StageRowProps) {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);

  const isEven = index % 2 === 0;
  const href = item.href ?? `/stages/${item.id}`;
  const hasImage = Boolean(item.image) && !failed;

  const slide = isEven ? 24 : -24;
  const imageVariants: Variants = {
    hidden: { opacity: 0, x: slide },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };
  const contentVariants: Variants = {
    hidden: { opacity: 0, x: -slide },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };
  const revealProps = {
    initial: reduce ? false : "hidden",
    whileInView: "show",
    viewport: { once: true, margin: "-100px" },
  } as const;

  return (
    <motion.article
      {...revealProps}
      className="relative grid w-full overflow-hidden lg:grid-cols-2 lg:min-h-[min(60vh,600px)]"
    >
      {/* ——— Image column: full-bleed, no rounding, no overlay ——— */}
      <motion.div
        variants={imageVariants}
        className={cn(
          "relative aspect-[4/3] overflow-hidden bg-[var(--paper)] sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[min(60vh,600px)]",
          !isEven && "lg:order-last",
        )}
      >
        {hasImage ? (
          <Image
            src={item.image as string}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            placeholder="blur"
            blurDataURL={IMAGE_BLUR}
            className="object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <StagePlaceholder />
        )}
      </motion.div>

      {/* ——— Content column: vertically centered, brand-tinted panel ——— */}
      <motion.div
        variants={contentVariants}
        className={cn(
          "flex items-center px-6 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12",
          isEven ? "bg-[var(--primary-tint)]" : "bg-[var(--secondary-tint)]",
        )}
      >
        <div className="w-full max-w-[55ch]">
          <h3 className="font-display text-3xl font-bold leading-tight text-[var(--ink)] sm:text-4xl lg:text-5xl">
            {item.name}
          </h3>

          {item.meta ? (
            <p className="mt-3 text-sm font-medium text-[var(--ink)]/70">{item.meta}</p>
          ) : null}

          {item.description ? (
            <p className="mt-5 text-base leading-[1.6] text-[var(--ink)]/90 md:text-lg">
              {item.description}
            </p>
          ) : null}

          <Link
            href={href}
            className={cn(
              "mt-8 block border-b-2 border-[var(--ink)]/80 py-2 text-lg font-semibold text-[var(--ink)]",
              "transition-all duration-200 hover:border-b-[3px] sm:inline-block",
              "focus-visible:outline-2 focus-visible:outline-offset-4",
              isEven
                ? "focus-visible:outline-[var(--primary-deep)]"
                : "focus-visible:outline-[var(--secondary-deep)]",
            )}
          >
            التفاصيل الكاملة
          </Link>
        </div>
      </motion.div>
    </motion.article>
  );
}
