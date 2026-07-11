"use client";

import Link from "next/link";
import { Sparkles, BookOpen, Users, ArrowLeft } from "lucide-react";
import { routes } from "@/constants/routes";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { AppButton } from "@/components/ui";
import { HeroSection } from "@/components/home/HeroSection";

function HomePage() {
  const { tenant } = useActiveTenant();
  const academyName = tenant?.name ?? "أكاديميتي";
  const primary = tenant?.branding?.primary_color ?? "#4F46E5";

  return (
    <>
      <HeroSection />

      <div className="container py-8">
        <div className="space-y-16">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-bl from-primary/5 via-background to-background px-6 py-14 sm:px-10 sm:py-20">
            <div
              className="pointer-events-none absolute -top-24 -start-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
              style={{ backgroundColor: primary }}
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-3xl text-center">
              <span
                className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
                style={{ backgroundColor: `${primary}1a`, color: primary }}
              >
                <Sparkles className="h-4 w-4" />
                منصة تعليمية حديثة
              </span>

              <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                مرحباً بك في{" "}
                <span style={{ color: primary }}>{academyName}</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                اكتشف دورات تفاعلية، تعلّم من الأفضل، وتابع تقدّمك خطوة بخطوة في بيئة
                تعليمية مصمّمة لنجاحك.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <AppButton size="lg" asChild>
                  <Link href={routes.tenantLogin}>
                    ابدأ التعلّم
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </AppButton>
                <AppButton size="lg" variant="outline" asChild>
                  <Link href={routes.dashboard}>لوحة التحكم</Link>
                </AppButton>
              </div>
            </div>
          </section>

          {/* Highlights */}
          <section className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "دورات متنوعة",
                desc: "محتوى تعليمي غني يغطي مختلف المجالات.",
              },
              {
                icon: Users,
                title: "مدرّبون خبراء",
                desc: "تعلّم على يد نخبة من المتخصصين.",
              },
              {
                icon: Sparkles,
                title: "تجربة ذكية",
                desc: "تتبّع تقدّمك وتعلّم بمرونة في أي وقت.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${primary}1a`, color: primary }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}

export default HomePage;
