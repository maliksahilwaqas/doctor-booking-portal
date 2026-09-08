import { z } from "zod";

export const bookingIdSchema = z.object({ bookingId: z.string().uuid() });

export const walkInSchema = z.object({
  locationId: z.string().uuid(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  patientName: z.string().trim().min(2).max(120),
  patientPhone: z.string().trim().min(7).max(20),
});

export type WalkInInput = z.infer<typeof walkInSchema>;

export const scheduleAppointmentSchema = z.object({
  locationId: z.string().uuid(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tokenNumber: z.number().int().positive(),
  patientName: z.string().trim().min(2).max(120),
  patientPhone: z.string().trim().min(7).max(20),
});

export type ScheduleAppointmentInput = z.infer<typeof scheduleAppointmentSchema>;
