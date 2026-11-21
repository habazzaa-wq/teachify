import { redirect } from "next/navigation";

import { routes } from "@/constants/routes";

/**
 * `/teacher` is the bare entry point for the tenant control panel. Keep it as
 * a bookmark-friendly alias that lands on the real dashboard instead of
 * falling through to the global 404 page.
 */
export default function TeacherIndexPage() {
  redirect(routes.dashboard);
}
