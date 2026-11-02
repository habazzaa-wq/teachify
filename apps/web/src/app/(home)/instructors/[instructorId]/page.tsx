"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowUpLeft, BookOpen, BriefcaseBusiness, Globe2, GraduationCap, Linkedin, Youtube } from "lucide-react";
import { resolveApiBaseUrl } from "@/config/env";
import { useTenantStore } from "@/stores/tenant.store";

interface InstructorProfile {
  id: string;
  name: string;
  avatar: string | null;
  jobTitle: string | null;
  department: string | null;
  bio: string | null;
  expertise: string | null;
  experienceYears: number | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  coursesCount: number;
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    shortDescription: string | null;
  }>;
}

export default function InstructorProfilePage() {
  const { instructorId } = useParams<{ instructorId: string }>();
  const tenant = useTenantStore((state) => state.activeTenant);
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (tenant?.id) headers["X-Tenant-ID"] = String(tenant.id);

    axios.get<{ data: InstructorProfile }>(
      `${resolveApiBaseUrl()}/public/instructors/${encodeURIComponent(instructorId)}`,
      { headers },
    ).then(({ data }) => {
      if (!cancelled) setProfile(data.data);
    }).catch(() => {
      if (!cancelled) setError("تعذر العثور على ملف المدرب.");
    });

    return () => { cancelled = true; };
  }, [instructorId, tenant?.id]);

  if (error) return <p role="alert" className="mx-auto max-w-5xl px-4 py-12 text-center text-destructive">{error}</p>;
  if (!profile) return <p className="mx-auto max-w-5xl px-4 py-12 text-center text-muted-foreground">جارٍ تحميل الملف...</p>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/instructors" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowUpLeft className="h-4 w-4" aria-hidden="true" />
        جميع المدربين
      </Link>
      <header className="relative my-7 overflow-hidden rounded-[2rem] border border-primary/15 bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:p-9 sm:text-start">
          <img
            src={profile.avatar || "/images/default-avatar.png"}
            alt=""
            className="h-28 w-28 shrink-0 rounded-full border-4 border-background object-cover shadow-lg sm:h-32 sm:w-32"
          />
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold text-primary">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              مدرّب في الأكاديمية
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{profile.name}</h1>
            {(profile.jobTitle || profile.department) && (
              <p className="mt-2 text-muted-foreground">{[profile.jobTitle, profile.department].filter(Boolean).join(" · ")}</p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile.expertise && (
                <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">{profile.expertise}</span>
              )}
              {profile.experienceYears != null && (
                <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {profile.experienceYears} {profile.experienceYears === 1 ? "سنة خبرة" : "سنوات خبرة"}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-studio-border bg-background/80 px-6 py-4 text-center">
            <BookOpen className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-2 text-2xl font-bold tabular-nums">{profile.coursesCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">دورة منشورة</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section>
          <h2 className="mb-5 text-2xl font-bold">الدورات</h2>
          {profile.courses.length ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {profile.courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`} className="overflow-hidden rounded-2xl border border-studio-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg">
                  {course.thumbnail && <img src={course.thumbnail} alt="" className="aspect-video w-full object-cover" />}
                  <div className="p-5">
                    <h3 className="font-semibold">{course.title}</h3>
                    {course.shortDescription && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{course.shortDescription}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-studio-border bg-card p-6 text-muted-foreground">لا توجد دورات منشورة حالياً.</p>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-studio-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <BriefcaseBusiness className="h-5 w-5 text-primary" aria-hidden="true" />
              نبذة عن المدرّب
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {profile.bio || "لم يضف المدرّب نبذة تعريفية بعد."}
            </p>
          </section>

          {(profile.websiteUrl || profile.linkedinUrl || profile.youtubeUrl) && (
            <section className="rounded-2xl border border-studio-border bg-card p-5">
              <h2 className="font-bold">روابط مهنية</h2>
              <div className="mt-4 space-y-3">
                {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary">
                    <Globe2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    الموقع الشخصي
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary">
                    <Linkedin className="h-4 w-4 text-primary" aria-hidden="true" />
                    LinkedIn
                  </a>
                )}
                {profile.youtubeUrl && (
                  <a href={profile.youtubeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary">
                    <Youtube className="h-4 w-4 text-primary" aria-hidden="true" />
                    YouTube
                  </a>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
