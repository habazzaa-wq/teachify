import dynamic from "next/dynamic";
import Link from "next/link";
import { env } from "@/config/env";
import { stagesServerService } from "@/features/homepage/educational-stages/server-services";

const NewsTicker = dynamic(
  () => import("@/components/home/NewsTicker").then((m) => m.NewsTicker),
  { ssr: true }
);

const PublicNavbar = dynamic(
  () => import("@/components/home/PublicNavbar").then((m) => m.PublicNavbar),
  { ssr: true }
);

const MobileSecondaryNav = dynamic(
  () => import("@/components/home/MobileSecondaryNav").then((m) => m.MobileSecondaryNav),
  { ssr: true }
);

/**
 * Public shell for tenant storefronts. The footer exposes real, crawlable
 * internal links (home, catalog, stages) so every public page reinforces the
 * site's linking structure — no fake or dead links (subjects/teachers have no
 * public routes yet, so they are intentionally omitted).
 */
async function PublicLayout({
  children,
  tenantName,
}: {
  children: React.ReactNode;
  tenantName?: string;
}) {
  const name = tenantName?.trim() || env.appName;
  const stages = await stagesServerService.getPublicStages();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NewsTicker />
      <PublicNavbar />
      <MobileSecondaryNav />

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card/50 py-10">
        <div className="container grid gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          <div>
            <p className="mb-3 text-base font-bold text-foreground">{name}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {env.appName === name
                ? "منصة تعليمية متكاملة للتعلم عن بُعد — دورات ومناهج شرح للمراحل الدراسية المختلفة."
                : `منصة ${name} التعليمية — دورات ومناهج شرح عبر الإنترنت.`}
            </p>
          </div>

          <nav aria-label="روابط سريعة">
            <p className="mb-3 text-sm font-bold text-foreground">روابط سريعة</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/courses" className="transition-colors hover:text-foreground">
                  جميع الكورسات
                </Link>
              </li>
            </ul>
          </nav>

          {stages?.items && stages.items.length > 0 && (
            <nav aria-label="المراحل الدراسية">
              <p className="mb-3 text-sm font-bold text-foreground">المراحل الدراسية</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {stages.items.map((stage) => (
                  <li key={stage.id}>
                    <Link
                      href={`/stages/${stage.id}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {stage.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <div className="container mt-8 px-4 text-center text-sm text-muted-foreground lg:px-8">
          © {new Date().getFullYear()} {name}. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}

export { PublicLayout };
