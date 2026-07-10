import { z } from "zod";
import type { BunnyPrivacy, BunnyRegion } from "../types";

export const bunnyConnectionSchema = z.object({
  storageZoneName: z.string().min(1, "اسم منطقة التخزين مطلوب").max(255),
  storageZonePassword: z.string().min(1, "كلمة مرور منطقة التخزين مطلوبة").max(512),
  storageZoneRegion: z.enum(["de", "uk", "gb", "sg", "la", "ny"] as const),
  cdnHostname: z.string().max(255).optional().or(z.literal("")),
  libraryId: z.string().max(255).optional().or(z.literal("")),
  apiKey: z.string().min(1, "مفتاح API مطلوب").max(512),
  streamApiKey: z.string().max(512).optional().or(z.literal("")),
  enableStream: z.boolean().optional(),
});

export type BunnyConnectionInput = z.infer<typeof bunnyConnectionSchema>;

export const bunnyUploadDefaultsSchema = z.object({
  defaultPrivacy: z.enum(["private", "public", "paid"] as const),
  defaultExpirationDays: z
    .union([z.number().int().min(0).max(3650), z.null()])
    .optional(),
  maxUploadSize: z.union([z.number().int().min(1), z.null()]).optional(),
  chunkSize: z.union([z.number().int().min(1).max(512), z.null()]).optional(),
  defaultThumbnailTime: z.number().int().min(0).max(3600),
});

export type BunnyUploadDefaultsInput = z.infer<typeof bunnyUploadDefaultsSchema>;

export const bunnyStreamingSchema = z.object({
  enableStream: z.boolean(),
  enableCdn: z.boolean(),
  enableSignedUrls: z.boolean(),
  enableTranscoding: z.boolean(),
  defaultThumbnailTime: z.number().int().min(0).max(3600),
});

export type BunnyStreamingInput = z.infer<typeof bunnyStreamingSchema>;

export type BunnyPrivacyInput = BunnyPrivacy;
export type BunnyRegionInput = BunnyRegion;
