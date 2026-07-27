"use client";

import { BadgeCheck, Linkedin, Github, Twitter, Youtube } from "lucide-react";

interface InstructorSectionProps {
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

const socialLinks = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export function InstructorSection({ instructor }: InstructorSectionProps) {
  if (!instructor) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold course-text-primary">عن المدرب</h2>
        <div className="course-card p-6 text-center">
          <p className="text-sm course-text-secondary">معلومات المدرب غير متاحة حالياً.</p>
        </div>
      </div>
    );
  }

  const initial = instructor.name.charAt(0) ?? "؟";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold course-text-primary">عن المدرب</h2>

      <div className="course-card p-6 space-y-5">
        {/* Instructor info */}
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--course-card-border)]">
            {instructor.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={instructor.avatar}
                alt={instructor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--course-icon-bg)] text-xl font-bold course-accent-text">
                {initial}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold course-text-primary">{instructor.name}</h3>
              <BadgeCheck className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm course-text-secondary">مدرس الدورة</p>
          </div>
        </div>

        {/* Bio - static placeholder since API doesn't expose bio */}
        <p className="text-sm leading-relaxed course-text-secondary">
          مطور واجهات أمامية بخبرة واسعة في بناء تطبيقات الويب الحديثة.
          متخصص في React وأحدث الأدوات والتقنيات المعتمدة في سوق العمل.
        </p>

        {/* Social links */}
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--course-card-border)]">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--course-text-secondary)] transition-all duration-200 hover:course-accent-text hover:bg-[var(--course-icon-bg)]"
              aria-label={social.label}
            >
              <social.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
