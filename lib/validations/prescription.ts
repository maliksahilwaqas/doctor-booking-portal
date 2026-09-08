import { z } from "zod";

export const prescriptionItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  morning: z.boolean(),
  night: z.boolean(),
});

export const followUpDaysSchema = z.union([z.literal(15), z.literal(30), z.literal(60), z.null()]);

export const savePrescriptionSchema = z
  .object({
    bookingId: z.string().uuid(),
    items: z.array(prescriptionItemSchema),
    notes: z.string().trim().max(2000),
    followUpDays: followUpDaysSchema,
  })
  .refine((v) => v.items.length > 0 || v.notes.length > 0 || v.followUpDays !== null, {
    message: "Add at least one medicine, a note, or a follow-up",
  });

export type SavePrescriptionInput = z.infer<typeof savePrescriptionSchema>;
