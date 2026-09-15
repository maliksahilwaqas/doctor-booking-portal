import { z } from "zod";

export const saveLocationScheduleSchema = z.object({
  locationId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  area: z.string().trim().min(1).max(120),
  session: z.enum(["morning", "evening"]),
  fromMin: z.number().int().min(0).max(1439),
  toMin: z.number().int().min(1).max(1440),
  days: z.array(z.number().int().min(1).max(7)),
  slotMin: z.number().int().positive(),
  // Set when slotMin was derived from "by patient count" rather than
  // picked directly from the admin's slot-length menu -- see
  // actions/doctor.ts's saveLocationSchedule for why that skips the
  // allowed-slot-lengths check.
  divideByCount: z.boolean().optional(),
});

export type SaveLocationScheduleInput = z.infer<typeof saveLocationScheduleSchema>;
