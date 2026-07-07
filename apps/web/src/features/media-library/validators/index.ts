import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1, "اسم المجلد مطلوب").max(255, "الاسم طويل جداً"),
  parent_id: z.number().nullable().optional(),
});

export const renameAssetSchema = z.object({
  title: z.string().min(1, "الاسم مطلوب").max(255, "الاسم طويل جداً"),
});

export const moveAssetSchema = z.object({
  folder_id: z.number().nullable(),
});

export const updateAssetSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  tags: z.array(z.string().max(100)).optional(),
  visibility: z.enum(["private", "organization", "public"]).optional(),
  folder_id: z.number().nullable().optional(),
});

export const bulkTagSchema = z.object({
  ids: z.array(z.number()),
  tags: z.array(z.string().max(100)),
});

export type CreateFolderFormValues = z.infer<typeof createFolderSchema>;
export type RenameAssetFormValues = z.infer<typeof renameAssetSchema>;
export type MoveAssetFormValues = z.infer<typeof moveAssetSchema>;
export type UpdateAssetFormValues = z.infer<typeof updateAssetSchema>;
