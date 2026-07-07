import { z } from "zod";

export const cloneRoleSchema = z.object({
  sourceRoleId: z.string().min(1, "المصدر مطلوب"),
  destinationRoleId: z.string().min(1, "الوجهة مطلوبة"),
  mode: z.enum(["replace", "merge"], {
    required_error: "نوع النسخ مطلوب",
  }),
});

export type CloneRoleFormValues = z.infer<typeof cloneRoleSchema>;
