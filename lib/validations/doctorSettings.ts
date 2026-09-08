import { z } from "zod";

export const saveLocationScheduleSchema = z.object({
  locationId: z.string().uuid(),
  session: z.enum(["morning", "evening"]),
  fromMin: z.number().int().min(0).max(1439),
  toMin: z.number().int().min(1).max(1440),
  days: z.array(z.number().int().min(1).max(7)),
  slotMin: z.number().int().positive(),
});

export type SaveLocationScheduleInput = z.infer<typeof saveLocationScheduleSchema>;
