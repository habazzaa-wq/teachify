"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { resolveApiBaseUrl } from "@/config/env";
import { useTenantStore } from "@/stores/tenant.store";

interface InstructorSummary {
  id: string;
  name: string;
  avatar: string | null;
  jobTitle: string | null;
  department: string | null;
  expertise: string | null;
  experienceYears: number | null;
  bio: string | null;
  coursesCount: number;
}

export default function InstructorsPage() {
  const tenant = useTenantStore((state) => state.activeTenant);
  const [instructors, setInstructors] = useState<InstructorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (tenant?.id) headers["X-Tenant-ID"] = String(tenant.id);

    axios.get<{ data: InstructorSummary[] }>(
      `${resolveApiBaseUrl()}/public/instructors`,
      { headers },
    ).then(({ data }) => {
      if (!cancelled) setInstructors(data.data);
    }).catch(() => {
      if (!cancelled) setError("تعذر تحميل بيانات المدربين.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [tenant?.id]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold text-primary">فريق التعليم</p>
        <h1 className="mt-2 text-3xl font-bold">المدربون</h1>
        <p className="mt-3 text-muted-foreground">تعرّف على مدربي الأكاديمية والدورات التي يقدمونها.</p>
      </header>
      {loading ? (
        <p className="py-12 text-center text-muted-foreground">جارٍ تحميل المدربين...</p>
      ) : error ? (
        <p role="alert" className="py-12 text-center text-destructive">{error}</p>
      ) : instructors.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">لا توجد ملفات مدربين منشورة حالياً.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((instructor) => (
            <Link
              key={instructor.id}
              href={`/instructors/${instructor.id}`}
              className="rounded-2xl border bg-card p-6 text-center transition hover:-translate-y-1 hover:shadow-lg"
            >
              <img
                src={instructor.avatar || "/images/default-avatar.png"}
                alt=""
                className="mx-auto h-24 w-24 rounded-full object-cover"
              />
              <h2 className="mt-4 text-lg font-semibold">{instructor.name}</h2>
              {(instructor.jobTitle || instructor.department) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {[instructor.jobTitle, instructor.department].filter(Boolean).join(" · ")}
                </p>
              )}
              {instructor.expertise && (
                <p className="mt-2 text-xs font-medium text-primary">{instructor.expertise}</p>
              )}
              {instructor.bio && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{instructor.bio}</p>
              )}
              {instructor.experienceYears != null && (
                <p className="mt-3 text-xs text-muted-foreground">{instructor.experienceYears} سنوات خبرة</p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">{instructor.coursesCount} دورة</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
