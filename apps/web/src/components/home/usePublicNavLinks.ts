"use client";

import { useMemo, type ElementType } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  Home,
  Layers,
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react";

import { routes } from "@/constants/routes";
import { getAboutIcon } from "@/features/about-page/icons";
import { usePublicAboutPage } from "@/features/about-page/hooks";
import { useActiveTenant } from "@/hooks/useActiveTenant";

export type PublicNavLink = {
  label: string;
  href: string;
  icon: ElementType;
  scrollTarget?: string;
};

const baseNavLinks: PublicNavLink[] = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "المراحل", href: "/#educational-stages", icon: Layers, scrollTarget: "educational-stages" },
  { label: "الكورسات", href: "/courses", icon: BookOpen },
];

/**
 * The mobile dock has always shown these six entries. Keep them as a floor so
 * a responsive fix never removes an item a tenant user is used to seeing, even
 * if an optional flag (about page / instructors) is turned off.
 */
const mobileBaseNavLinks: PublicNavLink[] = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "من نحن", href: routes.publicAbout, icon: Sparkles },
  ...baseNavLinks.slice(1),
  { label: "المدربون", href: "/instructors", icon: Users },
  { label: "المدونة", href: "/blog", icon: Newspaper },
];

/**
 * Single source of truth for the tenant storefront navigation.
 * Both the desktop navbar and the mobile dock consume it so feature-flagged
 * items (services, instructors, about page) are never missing on small screens.
 */
export function usePublicNavLinks(): PublicNavLink[] {
  const { tenant } = useActiveTenant();
  const { data: aboutPage } = usePublicAboutPage();

  const hasServices = tenant?.feature_flags?.has_services ?? false;
  const hasInstructors = tenant?.feature_flags?.has_instructors ?? false;

  return useMemo(
    () => [
      ...baseNavLinks,
      ...(hasServices
        ? [{ label: "الخدمات", href: routes.publicServices, icon: BriefcaseBusiness }]
        : []),
      { label: "المدونة", href: "/blog", icon: Newspaper },
      ...(hasInstructors
        ? [{ label: "المدربون", href: "/instructors", icon: Users }]
        : []),
      ...(aboutPage?.enabled
        ? [{ label: aboutPage.navLabel, href: routes.publicAbout, icon: getAboutIcon(aboutPage.navIcon) }]
        : []),
    ],
    [hasServices, hasInstructors, aboutPage],
  );
}

/**
 * Mobile-safe list: every item the dock already had, plus any feature-flagged
 * desktop item that is not there yet. Desktop metadata wins for shared hrefs
 * so custom about-page labels/icons stay in sync.
 */
export function useMobileNavLinks(): PublicNavLink[] {
  const desktopLinks = usePublicNavLinks();

  return useMemo(() => {
    const links = new Map(mobileBaseNavLinks.map((link) => [link.href, link]));
    for (const link of desktopLinks) links.set(link.href, link);
    return Array.from(links.values());
  }, [desktopLinks]);
}
