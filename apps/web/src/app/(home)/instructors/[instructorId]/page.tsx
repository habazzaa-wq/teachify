"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { resolveApiBaseUrl } from "@/config/env";
import { useTenantStore } from "@/stores/tenant.store";

interface InstructorProfile {
  id: string;
  name: string;
  avatar: string | null;
  jobTitle: string | null;
  department: string | null;
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
      <Link href="/instructors" className="text-sm text-primary hover:underline">جميع المدربين</Link>
      <header className="my-8 flex flex-col items-center gap-5 rounded-3xl border bg-card p-8 text-center sm:flex-row sm:text-start">
        <img src={profile.avatar || "/images/default-avatar.png"} alt="" className="h-28 w-28 rounded-full object-cover" />
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          {(profile.jobTitle || profile.department) && (
            <p className="mt-2 text-muted-foreground">{[profile.jobTitle, profile.department].filter(Boolean).join(" · ")}</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">{profile.coursesCount} دورة منشورة</p>
        </div>
      </header>
      <h2 className="mb-5 text-2xl font-bold">الدورات</h2>
      {profile.courses.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {profile.courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`} className="overflow-hidden rounded-2xl border bg-card transition hover:shadow-lg">
              {course.thumbnail && <img src={course.thumbnail} alt="" className="aspect-video w-full object-cover" />}
              <div className="p-5">
                <h3 className="font-semibold">{course.title}</h3>
                {course.shortDescription && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.shortDescription}</p>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">لا توجد دورات منشورة حالياً.</p>
      )}
    </main>
  );
}
