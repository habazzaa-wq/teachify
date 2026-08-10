"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Star, BookOpen, Users as UsersIcon, GraduationCap, Linkedin, Twitter, Youtube, Globe } from "lucide-react";
import { cn } from "@/lib/cn";
import { initialsOf, formatNumber } from "@/lib/format";
import { AppAvatar, AppAvatarImage, AppAvatarFallback } from "@/components/ui/AppAvatar";
import { SectionHeader } from "./primitives";
import { CTA_GRADIENT } from "../brand";
import type { PublicInstructor } from "../types";

interface InstructorCardProps {
  instructor: PublicInstructor | null;
}

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  website: Globe,
};

function InstructorCardInner({ instructor }: InstructorCardProps) {
  if (!instructor) return null;

  const socials = Array.isArray(instructor.socialLinks) ? instructor.socialLinks : [];

  const stats = [
    {
      icon: BookOpen,
      label: "الدورات",
      value: instructor.coursesCount != null ? formatNumber(instructor.coursesCount) : "—",
    },
    {
      icon: UsersIcon,
      label: "الطلاب",
      value: instructor.studentsCount != null ? formatNumber(instructor.studentsCount) : "—",
    },
    {
      icon: Star,
      label: "التقييم",
      value: instructor.rating != null ? formatNumber(instructor.rating) : "—",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="scroll-mt-24"
    >
      <SectionHeader
        icon={<GraduationCap className="h-5 w-5" />}
        title="المدرب"
        subtitle="تعرّف على من سيأخذ بيدك في رحلتك التعليمية"
        className="mb-6"
      />

      <div className="overflow-hidden rounded-3xl border border-[var(--brand-primary)] bg-card shadow-sm">
        <div
          className="h-1.5 w-full"
          style={{ background: CTA_GRADIENT }}
        />
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="shrink-0 self-center sm:self-auto">
            <AppAvatar className="h-24 w-24 border-4 border-[var(--brand-primary)] shadow-lg shadow-[rgba(0,0,0,0.1)] sm:h-28 sm:w-28">
              {instructor.avatar ? (
                <AppAvatarImage src={instructor.avatar} alt={instructor.name} />
              ) : null}
              <AppAvatarFallback className="bg-[var(--brand-primary)] text-2xl font-extrabold text-[var(--brand-primary-contrast)]">
                {initialsOf(instructor.name)}
              </AppAvatarFallback>
            </AppAvatar>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4 text-center sm:text-start">
            <div>
              <p className="mb-1 inline-block rounded-full bg-[var(--brand-primary)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary-contrast)]">
                المدرب
              </p>
              <h3 className="text-xl font-extrabold text-foreground sm:text-2xl">
                {instructor.name}
              </h3>
              {instructor.title && (
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                  {instructor.title}
                </p>
              )}
            </div>

            {instructor.bio && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {instructor.bio}
              </p>
            )}

            <div className="flex items-center justify-center gap-6 sm:justify-start">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-0.5 sm:items-start">
                  <span className="inline-flex items-center gap-1.5 text-sm font-extrabold tabular-nums text-foreground">
                    <stat.icon className="h-4 w-4 text-[var(--brand-primary)]" />
                    {stat.value}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {socials.length > 0 && (
            <div className="flex shrink-0 items-center justify-center gap-2 sm:flex-col">
              {socials.map((social, i) => {
                const Icon = SOCIAL_ICONS[social.platform.toLowerCase()] ?? Globe;
                return (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
                      "border-border/50 text-muted-foreground hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

const InstructorCard = memo(InstructorCardInner);

export { InstructorCard };
export type { InstructorCardProps };
