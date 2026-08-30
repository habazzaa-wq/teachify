import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

/**
 * Accessible, crawlable breadcrumb navigation. Renders as plain links so it
 * contributes to internal linking; pair with `breadcrumbJsonLd` for rich results.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="مسار التنقل">
      <ol className="flex flex-wrap items-center gap-y-1.5 text-[13px] font-semibold sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.name}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronLeft
                  aria-hidden
                  className="mx-1 h-3.5 w-3.5 shrink-0 stroke-[2.5] text-foreground/25"
                />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.name}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1",
                    isLast ? "bg-muted font-bold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {isLast && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary,#D87B63)]"
                    />
                  )}
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
