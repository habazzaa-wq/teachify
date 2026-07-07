"use client";

import {
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  type LucideProps,
} from "lucide-react";

/**
 * RTL-aware directional chevron. In an RTL document, the visual "start"
 * (forward-into submenu) is to the left, so we render ChevronLeft; in LTR
 * it's ChevronRight. This keeps menus and breadcrumbs pointing the right way
 * without conditional logic scattered across components.
 */
export function ChevronStartIcon(props: LucideProps) {
  return <ChevronLeft {...props} />;
}

export function ChevronEndIcon(props: LucideProps) {
  return <ChevronRight {...props} />;
}

export { Check, Circle };
