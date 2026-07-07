import type { AxiosError } from "axios";
import type { ApiError } from "@/types/common.types";

/** Arabic fallback messages for common failure modes. */
const NETWORK_MESSAGE = "تعذّر الاتصال بالخادم.";
const UNEXPECTED_MESSAGE = "حدث خطأ غير متوقع. حاول مرة أخرى.";
const UNAUTHORIZED_MESSAGE = "انتهت الجلسة، يرجى تسجيل الدخول مجددًا.";
const FORBIDDEN_MESSAGE = "ليست لديك صلاحية تنفيذ هذا الإجراء.";

interface LaravelValidationPayload {
  message?: string;
  errors?: Record<string, string | string[]>;
}

/**
 * Convert an Axios error into a normalized ApiError consumed by the UI layer.
 * Extracts Laravel 422 validation field errors and maps status codes to Arabic
 * messages. Network failures get status 0 and isNetworkError true.
 */
export function normalizeApiError(error: unknown): ApiError {
  // Already normalized (e.g. re-thrown by a hook).
  if (isAlreadyApiError(error)) {
    return error;
  }

  const axiosError = error as AxiosError<LaravelValidationPayload>;
  const status = axiosError.response?.status ?? 0;

  // Network failure / timeout / aborted.
  if (!axiosError.response) {
    return {
      status: 0,
      message: NETWORK_MESSAGE,
      fieldErrors: {},
      isNetworkError: true,
      raw: error,
    };
  }

  const payload = axiosError.response.data;
  const fieldErrors = extractFieldErrors(payload);

  const message =
    payload?.message ??
    mapStatusMessage(status) ??
    UNEXPECTED_MESSAGE;

  return {
    status,
    message,
    fieldErrors,
    isNetworkError: false,
    raw: payload,
  };
}

function isAlreadyApiError(error: unknown): error is ApiError {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as Record<string, unknown>;

  return (
    "isNetworkError" in candidate &&
    typeof candidate.isNetworkError === "boolean" &&
    typeof candidate.message === "string" &&
    typeof candidate.status === "number"
  );
}

function mapStatusMessage(status: number): string | null {
  switch (status) {
    case 401:
      return UNAUTHORIZED_MESSAGE;
    case 403:
      return FORBIDDEN_MESSAGE;
    case 404:
      return "المورد المطلوب غير موجود.";
    case 419:
      return "انتهت صلاحية الجلسة. حدّث الصفحة وحاول مجددًا.";
    case 422:
      return "يرجى تصحيح الأخطاء في النموذج.";
    case 429:
      return "طلبات كثيرة جدًا. حاول لاحقًا.";
    default:
      return status >= 500 ? UNEXPECTED_MESSAGE : null;
  }
}

function extractFieldErrors(
  payload: LaravelValidationPayload | undefined,
): Record<string, string[]> {
  if (!payload?.errors) {
    return {};
  }

  const result: Record<string, string[]> = {};

  for (const [field, value] of Object.entries(payload.errors)) {
    result[field] = Array.isArray(value) ? value : [value];
  }

  return result;
}
