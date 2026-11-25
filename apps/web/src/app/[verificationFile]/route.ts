import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import {
  googleVerificationFileContent,
  isGoogleVerificationFileName,
} from "@/lib/seo/verification-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves each tenant's Google Search Console HTML verification file from its
 * own root domain, e.g. https://geo-top.teachify.tech/googleabc123.html.
 * The file name is stored in that tenant's SEO settings; nothing is served
 * unless the requesting host is that tenant and the names match exactly.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ verificationFile: string }> },
) {
  const { verificationFile } = await params;
  const requestedFile = verificationFile.trim();

  if (!isGoogleVerificationFileName(requestedFile)) {
    return new NextResponse(null, { status: 404 });
  }

  const tenant = await getTenantSeoContext();
  const configuredFile = tenant?.seo?.googleVerificationFile?.trim();

  if (!configuredFile || configuredFile !== requestedFile) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(googleVerificationFileContent(requestedFile), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
