import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";

/** Old media-library links now open the self-hosted non-video library. */
export default function LegacyMediaPage() {
  redirect(routes.dashboardMediaLibrary);
}
