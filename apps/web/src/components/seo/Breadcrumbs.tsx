import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-x-1.5">
              {index > 0 && <ChevronLeft className="h-3.5 w-3.5 shrink-0 opacity-50" />}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.name}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "font-medium text-foreground" : undefined}
                >
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
