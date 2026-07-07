/**
 * Shared response and error shapes.
 *
 * The Laravel API uses two response conventions:
 * - Named-key envelopes for collection endpoints (e.g. { notifications: [...] }).
 * - Laravel paginator metadata at the top level (no wrapping key) for paginated
 *   endpoints (audit-logs, activity-logs).
 */

/** Generic success envelope used by most write endpoints. */
export interface ApiMessageResponse {
  message: string;
}

/** Laravel's standard LengthAwarePaginator shape, returned at the top level. */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  first_page_url: string;
  last_page_url: string;
  next_page_url: string | null;
  prev_page_url: string | null;
  path: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
}

/** Query params common to paginated list endpoints. */
export interface PaginationParams {
  page?: number;
}

/** Normalized API error surfaced to the UI layer. */
export interface ApiError {
  /** HTTP status code, or 0 for network failures. */
  status: number;
  /** Human-readable message (Arabic) for toasts and banners. */
  message: string;
  /** Validation field errors keyed by field name, when status is 422. */
  fieldErrors: Record<string, string[]>;
  /** Whether the request failed due to a network/timeout problem. */
  isNetworkError: boolean;
  /** Raw server payload for advanced handling. */
  raw: unknown;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as ApiError).message === "string"
  );
}
