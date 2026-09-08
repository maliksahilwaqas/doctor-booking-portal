import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  speciality: z.string().trim().min(2).max(120),
  quals: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(5).max(30),
  clinicName: z.string().trim().min(2).max(120),
  address: z.string().trim().max(300),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const accentSchema = z.object({
  accent: z.enum(["blue", "teal", "indigo", "green", "maroon"]),
});

export const wordingVarSchema = z.object({
  key: z.enum(["labels", "term", "currency", "window", "overbook"]),
});

export const addLocationSchema = z.object({
  name: z.string().trim().min(2).max(120).default("New location"),
});

export const locationIdSchema = z.object({ locationId: z.string().uuid() });

export const cycleFieldSchema = z.object({
  locationId: z.string().uuid(),
  field: z.enum(["hours", "slot", "fee"]),
});

export const featureFlagSchema = z.object({
  key: z.enum(["pay", "sms", "video", "cancel", "doctorSettings", "queueScreen", "prescriptions"]),
});

export const slotMinuteToggleSchema = z.object({
  minutes: z.number().int().positive(),
});
