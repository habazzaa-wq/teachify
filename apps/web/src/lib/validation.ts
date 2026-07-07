import { z } from "zod";

/**
 * Shared Zod schemas and helpers. Forms use React Hook Form + @hookform/resolvers
 * to bind these. Server-side validation field errors are mapped back onto RHF
 * via the mapFieldErrors helper.
 */

/** Arabic error messages reused across forms. */
const messages = {
  required: (field: string) => `${field} مطلوب`,
  email: "صيغة البريد الإلكتروني غير صحيحة",
  minLength: (n: number) => `يجب ألا يقل عن ${n} أحرف`,
} as const;

export const loginSchema = z.object({
  email: z
    .string({ required_error: messages.required("البريد الإلكتروني") })
    .min(1, messages.required("البريد الإلكتروني"))
    .max(255, "البريد الإلكتروني طويل جداً")
    .email(messages.email),
  password: z
    .string({ required_error: messages.required("كلمة المرور") })
    .min(1, messages.required("كلمة المرور"))
    .max(255, "كلمة المرور طويلة جداً"),
  remember: z.boolean().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * Map a normalized ApiError's field errors into the shape React Hook Form's
 * `setError` expects. Keys map directly; the first message per field is used.
 */
export function mapFieldErrors(
  fieldErrors: Record<string, string[]>,
): Record<string, { message: string }> {
  const result: Record<string, { message: string }> = {};

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const first = messages[0];

    if (first) {
      result[field] = { message: first };
    }
  }

  return result;
}
