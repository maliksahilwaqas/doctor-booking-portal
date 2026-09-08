"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  bookingIdSchema,
  scheduleAppointmentSchema,
  walkInSchema,
  type ScheduleAppointmentInput,
  type WalkInInput,
} from "@/lib/validations/reception";
import { callNextTokenSchema, type CallNextTokenInput } from "@/lib/validations/queue";
import { tokenCount } from "@/lib/calc/tokens";
import { advanceQueue } from "@/lib/queue";

export interface ActionState {
  error?: string;
}

/** Front-desk arrival check-in -- distinct from being called into the room (see callNextToken below). */
export async function toggleCheckedIn(bookingId: string): Promise<ActionState> {
  await requireRole("reception");
  const parsed = bookingIdSchema.safeParse({ bookingId });
  if (!parsed.success) return { error: "Invalid booking" };

  const supabase = await createClient();
  const { data: booking } = await supabase.from("bookings").select("checked_in, queue_status").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found" };
  if (booking.queue_status === "in_room" || booking.queue_status === "done") {
    return { error: "This patient has already been called in." };
  }

  const nowCheckedIn = !booking.checked_in;
  const { error } = await supabase
    .from("bookings")
    .update({ checked_in: nowCheckedIn, queue_status: nowCheckedIn ? "checked_in" : "waiting" })
    .eq("id", bookingId);
  if (error) return { error: "Could not update check-in status" };
  revalidatePath("/reception");
  revalidatePath("/doctor");
  return {};
}

/**
 * For a paid session, this *is* the check-in step -- a patient isn't
 * checked in until their payment is received. Toggling paid off (a
 * correction) undoes the check-in too, since the gate it satisfied no
 * longer holds. Zero-fee bookings (paid online already) use
 * toggleCheckedIn above instead, since there's nothing to receive.
 */
export async function receivePayment(bookingId: string): Promise<ActionState> {
  await requireRole("reception");
  const parsed = bookingIdSchema.safeParse({ bookingId });
  if (!parsed.success) return { error: "Invalid booking" };

  const supabase = await createClient();
  const { data: booking } = await supabase.from("bookings").select("paid, queue_status").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found" };
  if (booking.queue_status === "in_room" || booking.queue_status === "done") {
    return { error: "This patient has already been called in." };
  }

  const nowPaid = !booking.paid;
  const { error } = await supabase
    .from("bookings")
    .update({
      paid: nowPaid,
      checked_in: nowPaid,
      queue_status: nowPaid ? "checked_in" : "waiting",
    })
    .eq("id", bookingId);
  if (error) return { error: "Could not update payment status" };
  revalidatePath("/reception");
  revalidatePath("/doctor");
  return {};
}

export async function confirmRequest(bookingId: string): Promise<ActionState> {
  await requireRole("reception");
  const parsed = bookingIdSchema.safeParse({ bookingId });
  if (!parsed.success) return { error: "Invalid booking" };

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId).eq("status", "pending");
  if (error) return { error: "Could not confirm this request" };
  revalidatePath("/reception");
  return {};
}

export async function declineRequest(bookingId: string): Promise<ActionState> {
  await requireRole("reception");
  const parsed = bookingIdSchema.safeParse({ bookingId });
  if (!parsed.success) return { error: "Invalid booking" };

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status: "declined" }).eq("id", bookingId).eq("status", "pending");
  if (error) return { error: "Could not decline this request" };
  revalidatePath("/reception");
  return {};
}

export async function addWalkIn(input: WalkInInput): Promise<ActionState> {
  await requireRole("reception");
  const parsed = walkInSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid walk-in" };
  const { locationId, visitDate, patientName, patientPhone } = parsed.data;

  const supabase = await createClient();

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("from_min, to_min, slot_min, fee")
    .eq("id", locationId)
    .single();
  if (locationError || !location) return { error: "Location not found" };

  const { data: taken, error: takenError } = await supabase
    .from("token_availability")
    .select("token_number")
    .eq("location_id", locationId)
    .eq("visit_date", visitDate);
  if (takenError) return { error: "Could not check availability" };

  const takenSet = new Set(taken.map((r) => r.token_number));
  const count = tokenCount({ fromMin: location.from_min, toMin: location.to_min, slotMin: location.slot_min });
  let nextToken: number | null = null;
  for (let n = 1; n <= count; n++) {
    if (!takenSet.has(n)) {
      nextToken = n;
      break;
    }
  }
  if (nextToken === null) return { error: "No free tokens left for this session." };

  const { error } = await supabase.from("bookings").insert({
    location_id: locationId,
    visit_date: visitDate,
    token_number: nextToken,
    status: "confirmed",
    patient_name: patientName,
    patient_phone: patientPhone,
    fee: Number(location.fee),
  });
  if (error) return { error: "Could not add walk-in token" };
  revalidatePath("/reception");
  return {};
}

/**
 * Reception booking a specific token directly -- for a walk-in that wants a
 * particular time, or a call-in booking for a future date. Unlike a
 * patient's own request (which starts 'pending'), a staff-created booking
 * is confirmed immediately since reception already has the patient on the
 * phone or in front of them.
 */
export async function scheduleAppointment(input: ScheduleAppointmentInput): Promise<ActionState> {
  await requireRole("reception");
  const parsed = scheduleAppointmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid appointment" };
  const { locationId, visitDate, tokenNumber, patientName, patientPhone } = parsed.data;

  const supabase = await createClient();

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("from_min, to_min, slot_min, fee, active")
    .eq("id", locationId)
    .single();
  if (locationError || !location || !location.active) return { error: "That location is no longer available." };

  const count = tokenCount({ fromMin: location.from_min, toMin: location.to_min, slotMin: location.slot_min });
  if (tokenNumber < 1 || tokenNumber > count) return { error: "That token is out of range for this session." };

  const { error } = await supabase.from("bookings").insert({
    location_id: locationId,
    visit_date: visitDate,
    token_number: tokenNumber,
    status: "confirmed",
    patient_name: patientName,
    patient_phone: patientPhone,
    fee: Number(location.fee),
  });

  if (error) {
    if (error.code === "23P01") return { error: "That token is already taken for this date." };
    return { error: "Could not schedule the appointment." };
  }

  revalidatePath("/reception");
  return {};
}

/** Moves the queue forward one patient -- see lib/queue.ts's advanceQueue (shared with actions/doctor.ts). */
export async function callNextToken(input: CallNextTokenInput): Promise<ActionState> {
  await requireRole("reception");
  const parsed = callNextTokenSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid session" };

  const result = await advanceQueue(parsed.data.locationId, parsed.data.visitDate);
  if (result.error) return result;

  revalidatePath("/reception");
  revalidatePath("/doctor");
  return {};
}
