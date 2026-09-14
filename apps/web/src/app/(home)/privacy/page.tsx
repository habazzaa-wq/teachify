import type { Metadata } from "next";
import { LegalPageContent } from "@/features/legal/components/LegalPageContent";
import { legalServerService } from "@/features/legal/server-services";
import { mergeLegalSettings } from "@/features/legal/types";
import {
  buildSeoMetadata,
  getSiteName,
} from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, origin, legal] = await Promise.all([
    getTenantSeoContext(),
    getRequestOrigin(),
    legalServerService.getPublicLegal(),
  ]);

  const settings = mergeLegalSettings(legal);
  const content = settings.privacy;

  return buildSeoMetadata(
    {
      title: { absolute: `${content.title} — ${getSiteName(tenant)}` },
      description: `تعرف على كيفية جمع وحماية بياناتك على ${getSiteName(tenant)}.`,
      canonical: canonicalUrl(origin, "/privacy"),
    },
    tenant,
    origin,
  );
}

async function PrivacyPage() {
  const legal = await legalServerService.getPublicLegal();
  const settings = mergeLegalSettings(legal);

  return <LegalPageContent content={settings.privacy} />;
}

export default PrivacyPage;