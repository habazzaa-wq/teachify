import type { TenantByDomainResponse } from "./types";

/**
 * Result of the public tenant bootstrap request (`GET /api/v1/tenant/by-domain`).
 *
 * - `tenant`    → the domain is bound to an active tenant.
 * - `not-found` → the API answered with a well-formed JSON 404: the domain is
 *                 genuinely not registered (or the tenant is not active).
 * - `error`     → the request never produced a usable tenant payload: the API
 *                 is unreachable, returned 5xx, or answered with something that
 *                 is not JSON (e.g. an HTML page served by a misrouted proxy).
 *
 * The distinction matters: a misrouted `/api` proxy used to be reported to the
 * visitor as "the academy does not exist", which is both wrong and impossible
 * to recover from. Infrastructure failures must surface as a retryable error.
 */
export type TenantBootstrapOutcome =
  | { kind: "tenant"; tenant: TenantByDomainResponse }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

/** Minimal shape of the `Response` the bootstrap relies on. */
export interface TenantBootstrapResponse {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}

export const TENANT_BOOTSTRAP_ERRORS = {
  network:
    "تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.",
  misrouted:
    "تعذّر الوصول إلى واجهة الدومين: استُلم رد غير صالح من الخادم. يرجى مراجعة إعداد التوجيه على الخادم ثم إعادة المحاولة.",
  invalidPayload:
    "تعذّر قراءة بيانات البيئة التعليمية من الخادم. يرجى مراجعة سجلات الخادم ثم إعادة المحاولة.",
  server: (status: number) =>
    `الخادم لا يستطيع معالجة الطلب حالياً (الرمز ${status}). يرجى إعادة المحاولة بعد قليل.`,
  request: (status: number) =>
    `تعذّر التحقق من الدومين (الرمز ${status}). يرجى مراجعة بيانات الدومين ثم إعادة المحاولة.`,
} as const;

function isJsonContentType(contentType: string | null): boolean {
  return !!contentType && contentType.toLowerCase().includes("json");
}

function isTenantPayload(payload: unknown): payload is TenantByDomainResponse {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.domain === "string" &&
    typeof candidate.status === "string"
  );
}

/**
 * Turn the raw bootstrap response into a decision the provider can act on.
 *
 * A JSON 404 is the only proof that the domain is unknown. Anything else
 * (HTML 404 from the SPA, 5xx, network failure, malformed payload) is an
 * infrastructure problem and must stay retryable.
 */
export async function classifyTenantResponse(
  res: TenantBootstrapResponse,
): Promise<TenantBootstrapOutcome> {
  const contentType = res.headers.get("content-type");
  const isJson = isJsonContentType(contentType);

  let payload: unknown = null;
  if (isJson) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    if (res.status === 404) {
      return isJson
        ? { kind: "not-found" }
        : { kind: "error", message: TENANT_BOOTSTRAP_ERRORS.misrouted };
    }
    if (res.status >= 500) {
      return { kind: "error", message: TENANT_BOOTSTRAP_ERRORS.server(res.status) };
    }
    return { kind: "error", message: TENANT_BOOTSTRAP_ERRORS.request(res.status) };
  }

  if (!isJson) {
    return { kind: "error", message: TENANT_BOOTSTRAP_ERRORS.misrouted };
  }

  if (!isTenantPayload(payload)) {
    return { kind: "error", message: TENANT_BOOTSTRAP_ERRORS.invalidPayload };
  }

  if (payload.status !== "active") {
    return { kind: "not-found" };
  }

  return { kind: "tenant", tenant: payload };
}
