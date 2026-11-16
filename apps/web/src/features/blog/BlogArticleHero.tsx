"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  BookOpen,
  CalendarDays,
  Clock3,
  Feather,
  Sparkles,
  Tag,
  UserRound,
} from "lucide-react";
import { BlogCoverImage } from "./BlogCoverImage";
import styles from "./blog-article.module.css";

type Props = {
  title: string;
  excerpt: string | null;
  category: string | null;
  coverImageUrl: string | null;
  author: string | null;
  publishedLabel: string;
  readingMinutes: number;
  sectionCount: number;
  siteName: string;
};

function initials(name: string | null): string {
  if (!name?.trim()) return "م";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

/** A CSS 3D cube built from six translucent brand-tinted faces. */
function FloatingCube({
  size = 64,
  className = "",
  duration = 26,
}: {
  size?: number;
  className?: string;
  duration?: number;
}) {
  const half = size / 2;
  const faces = [
    `translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ];

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size, perspective: "620px" }}
    >
      <div
        className={styles.cube}
        style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          animationDuration: `${duration}s`,
        }}
      >
        {faces.map((transform) => (
          <span key={transform} className={styles.cubeFace} style={{ transform }} />
        ))}
      </div>
    </div>
  );
}

/** The layered 3D cover scene: tilted cover card, depth plates, cube, ring, sphere. */
function CoverScene({
  coverImageUrl,
  title,
  category,
  readingMinutes,
}: {
  coverImageUrl: string | null;
  title: string;
  category: string | null;
  readingMinutes: number;
}) {
  const reduceMotion = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [12, -7]), {
    stiffness: 110,
    damping: 18,
    mass: 0.6,
  });
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-20, 6]), {
    stiffness: 110,
    damping: 18,
    mass: 0.6,
  });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === "touch") return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  };

  const resetPointer = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  return (
    <div
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className={`${styles.scene} relative mx-auto flex h-[340px] w-full max-w-[460px] items-center justify-center sm:h-[420px] lg:h-[540px]`}
    >
      {/* Ambient brand glow */}
      <div
        aria-hidden="true"
        className={`${styles.glowPulse} pointer-events-none absolute inset-0`}
      >
        <div
          className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--brand-secondary) 46%, transparent), transparent 68%)",
          }}
        />
        <div
          className="absolute bottom-[6%] right-[2%] h-[46%] w-[46%] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 60%, transparent), transparent 70%)",
          }}
        />
      </div>

      {/* Orbital ring behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="relative h-[86%] w-[86%]"
          style={{ transform: "rotateX(70deg) rotateZ(-14deg)" }}
        >
          <div
            className={`${styles.ringSpin} absolute inset-0 rounded-full border`}
            style={{
              borderColor: "color-mix(in srgb, var(--brand-secondary) 34%, transparent)",
              borderWidth: "1.5px",
              boxShadow:
                "0 0 60px -18px color-mix(in srgb, var(--brand-secondary) 55%, transparent), inset 0 0 60px -18px color-mix(in srgb, var(--brand-primary) 45%, transparent)",
            }}
          >
            <span
              className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: "var(--brand-secondary)" }}
            />
            <span
              className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full"
              style={{ background: "var(--brand-primary)" }}
            />
          </div>
        </div>
      </div>

      {/* Floating 3D cube */}
      <div className={`${styles.floaty} pointer-events-none absolute right-[3%] top-[6%]`}>
        <FloatingCube size={58} />
      </div>

      {/* Floating sphere */}
      <div
        aria-hidden="true"
        className={`${styles.floatySlow} pointer-events-none absolute left-[5%] top-[14%] h-14 w-14 rounded-full sm:h-16 sm:w-16`}
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #ffffff 0%, color-mix(in srgb, var(--brand-secondary) 82%, white) 22%, var(--brand-secondary) 52%, color-mix(in srgb, var(--brand-secondary) 55%, black) 100%)",
          boxShadow:
            "0 18px 40px -16px color-mix(in srgb, var(--brand-secondary) 70%, transparent), inset -6px -8px 18px rgba(0,0,0,.22)",
        }}
      />

      {/* Small brand diamond */}
      <div
        aria-hidden="true"
        className={`${styles.floatySlower} pointer-events-none absolute bottom-[20%] right-[7%] h-9 w-9 rotate-45 rounded-lg border border-white/40`}
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 75%, transparent), color-mix(in srgb, var(--brand-secondary) 45%, transparent))",
          boxShadow: "0 16px 34px -18px rgba(0,0,0,.6)",
        }}
      />

      {/* Glass shard */}
      <div
        aria-hidden="true"
        className={`${styles.floaty} pointer-events-none absolute bottom-[9%] left-[7%] h-24 w-16 rounded-2xl border border-white/25 sm:h-28 sm:w-20`}
        style={{
          background:
            "linear-gradient(150deg, rgba(255,255,255,.18), rgba(255,255,255,.03))",
          backdropFilter: "blur(6px)",
          transform: "rotate(-16deg)",
          boxShadow: "0 20px 44px -22px rgba(0,0,0,.7)",
        }}
      />

      {/* Tilted cover card */}
      <motion.div
        className={`${styles.tilt} relative w-[70%] max-w-[330px] sm:w-[72%]`}
        style={{ rotateX, rotateY }}
      >
        {/* Depth plate behind */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[1.6rem] border border-white/15"
          style={{
            transform: "translateZ(-70px) translateX(-22px) translateY(14px) rotate(-5deg)",
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--brand-primary) 42%, transparent), transparent)",
            opacity: 0.7,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[1.6rem] border border-white/20"
          style={{
            transform: "translateZ(-36px) translateX(14px) translateY(-10px) rotate(4deg)",
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--brand-secondary) 32%, transparent), transparent)",
            opacity: 0.55,
          }}
        />

        <div
          className="relative overflow-hidden rounded-[1.5rem] border border-white/25 shadow-[0_40px_90px_-30px_rgba(0,0,0,.85)]"
          style={{ transform: "translateZ(24px)" }}
        >
          {coverImageUrl ? (
            <BlogCoverImage
              src={coverImageUrl}
              alt={title}
              className="aspect-[4/3] w-full"
              imageClassName="transition-transform duration-700 ease-out hover:scale-[1.04]"
            />
          ) : (
            <div
              className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-3"
              style={{
                background:
                  "linear-gradient(150deg, color-mix(in srgb, var(--brand-primary) 78%, #05080f), color-mix(in srgb, var(--brand-secondary) 42%, #05080f))",
              }}
            >
              <span className="absolute -left-8 -top-10 h-32 w-32 rounded-full border border-white/20" />
              <span className="absolute -bottom-10 -right-6 h-28 w-28 rounded-full border border-white/15" />
              <BookOpen className="h-12 w-12 text-white/80" strokeWidth={1.2} />
              <span className="text-[11px] font-bold tracking-[0.2em] text-white/70">
                JOURNAL
              </span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
          <div className={`${styles.sheen} pointer-events-none absolute inset-0 opacity-60`} />

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              <Clock3 className="h-3 w-3" />
              {readingMinutes} دقائق
            </span>
            {category && (
              <span className="max-w-[55%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-slate-900">
                {category}
              </span>
            )}
          </div>
        </div>

        {/* Floating seal */}
        <div
          className="absolute -left-4 -top-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 sm:-left-6 sm:h-20 sm:w-20"
          style={{
            transform: "translateZ(80px)",
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--brand-primary) 92%, black), color-mix(in srgb, var(--brand-secondary) 55%, black))",
            boxShadow: "0 22px 50px -18px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.35)",
          }}
        >
          <span
            aria-hidden="true"
            className={`${styles.orbit} absolute inset-1 rounded-full border border-dashed border-white/35`}
          />
          <div className="text-center leading-none">
            <span className="block text-lg font-black text-white sm:text-xl">{readingMinutes}</span>
            <span className="mt-1 block text-[8px] font-bold tracking-wider text-white/75">دقيقة</span>
          </div>
        </div>

        {/* Floating meta chip */}
        <div
          className="absolute -bottom-5 -right-3 hidden items-center gap-2 rounded-2xl border border-white/25 bg-white/12 px-3 py-2 text-[10px] font-bold text-white shadow-lg backdrop-blur-md sm:flex"
          style={{ transform: "translateZ(64px)" }}
        >
          <Feather className="h-3.5 w-3.5 text-[var(--brand-secondary)]" />
          قراءة على مهل
        </div>
      </motion.div>
    </div>
  );
}

export function BlogArticleHero({
  title,
  excerpt,
  category,
  coverImageUrl,
  author,
  publishedLabel,
  readingMinutes,
  sectionCount,
  siteName,
}: Props) {
  return (
    <header
      className="relative isolate overflow-hidden rounded-[1.75rem] text-white shadow-[0_40px_100px_-50px_rgba(2,6,23,.9)] sm:rounded-[2.25rem]"
      style={{
        background:
          "linear-gradient(150deg, color-mix(in srgb, var(--brand-primary) 34%, #05080f) 0%, #060a13 42%, color-mix(in srgb, var(--brand-secondary) 18%, #04070e) 100%)",
      }}
    >
      {/* Texture layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 82% 4%, color-mix(in srgb, var(--brand-secondary) 30%, transparent), transparent 42%), radial-gradient(ellipse at 4% 100%, color-mix(in srgb, var(--brand-primary) 46%, transparent), transparent 46%)",
        }}
      />
      <div aria-hidden="true" className={`${styles.gridLines} pointer-events-none absolute inset-0 -z-10`} />
      <div aria-hidden="true" className={`${styles.grain} pointer-events-none absolute inset-0 -z-10`} />

      {/* Oversized ghost ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-28 -z-10 h-80 w-80 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-14 -z-10 h-52 w-52 rounded-full border border-white/[.07]"
      />

      <div className="grid items-center gap-4 p-5 sm:p-8 lg:grid-cols-[1.06fr_.94fr] lg:gap-6 lg:p-12">
        <div className="order-2 lg:order-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[.08] px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-white/85 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand-secondary)]" />
              دفتر المعرفة
            </span>
            {category && (
              <Link
                href={`/blog?category=${encodeURIComponent(category)}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold backdrop-blur transition-colors"
                style={{
                  borderColor: "color-mix(in srgb, var(--brand-secondary) 45%, transparent)",
                  background: "color-mix(in srgb, var(--brand-secondary) 14%, transparent)",
                  color: "color-mix(in srgb, var(--brand-secondary) 70%, white)",
                }}
              >
                <Tag className="h-3 w-3" />
                {category}
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/55">
              <span className="h-1 w-1 rounded-full bg-white/40" />
              مقال منشور
            </span>
          </div>

          <h1 className="mt-5 font-display text-[1.95rem] font-bold leading-[1.32] tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.28] lg:text-[3.15rem]">
            {title}
          </h1>

          {excerpt && (
            <p className="mt-5 max-w-2xl border-r-2 border-[var(--brand-secondary)]/70 pr-4 text-[13px] leading-8 text-white/70 sm:text-[15px] sm:leading-9">
              {excerpt}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 text-[11px] font-black text-white"
                style={{
                  background:
                    "linear-gradient(145deg, color-mix(in srgb, var(--brand-primary) 85%, black), color-mix(in srgb, var(--brand-secondary) 55%, black))",
                }}
              >
                {author ? initials(author) : <UserRound className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-white">{author ?? "فريق التحرير"}</p>
                <p className="mt-0.5 text-[10px] text-white/55">كاتب المقال</p>
              </div>
            </div>
            <span aria-hidden="true" className="hidden h-7 w-px bg-white/15 sm:block" />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/65">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--brand-secondary)]" />
              {publishedLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/65">
              <Clock3 className="h-3.5 w-3.5 text-[var(--brand-secondary)]" />
              {readingMinutes} دقائق قراءة
            </span>
            {sectionCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/65">
                <Feather className="h-3.5 w-3.5 text-[var(--brand-secondary)]" />
                {sectionCount.toLocaleString("ar-EG")} محاور
              </span>
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#article-content"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[var(--brand-secondary)] px-5 py-3 text-xs font-black text-[var(--brand-secondary-contrast)] shadow-[0_16px_36px_-14px_color-mix(in_srgb,var(--brand-secondary)_70%,transparent)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-16px_color-mix(in_srgb,var(--brand-secondary)_75%,transparent)]"
            >
              ابدأ القراءة
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-[11px] font-semibold text-white/60 backdrop-blur">
              <BookOpen className="h-3.5 w-3.5 text-[var(--brand-secondary)]" />
              محتوى تحريري أصلي
            </span>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <CoverScene
            coverImageUrl={coverImageUrl}
            title={title}
            category={category}
            readingMinutes={readingMinutes}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 px-5 py-3.5 text-[10px] font-bold text-white/55 sm:px-8 lg:px-12">
        <span className="inline-flex items-center gap-2 text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-secondary)]" />
          {siteName}
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-white/15" />
        <span className="tracking-[0.22em]">JOURNAL</span>
        {category && (
          <>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <span className="max-w-40 truncate text-white/60">{category}</span>
          </>
        )}
        <span className="mr-auto hidden items-center gap-2 sm:inline-flex">
          <span className="h-px w-8 bg-white/20" />
          اقرأ · تأمّل · تعلّم
        </span>
      </div>
    </header>
  );
}
