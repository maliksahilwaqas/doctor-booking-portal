"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDoctorProfile } from "@/lib/data/profile";
import { saveLocationScheduleSchema, type SaveLocationScheduleInput } from "@/lib/validations/doctorSettings";
import { addLocationSchema, locationIdSchema } from "@/lib/validations/admin";
import { savePrescriptionSchema, type SavePrescriptionInput } from "@/lib/validations/prescription";
import { callNextTokenSchema, type CallNextTokenInput } from "@/lib/validations/queue";
import { advanceQueue } from "@/lib/queue";

export interface ActionState {
  error?: string;
}

/**
 * The doctor's own Settings tab only exists, and only writes, when the
 * admin has left `feat_doctor_settings` on -- otherwise only the Platform
 * Admin's Locations tab may edit hours/days/slot (actions/admin.ts).
 */
export async function saveLocationSchedule(input: SaveLocationScheduleInput): Promise<ActionState> {
  await requireRole("doctor");
  const profile = await getDoctorProfile();
  if (!profile.feat.doctorSettings) return { error: "Settings are managed by the platform admin for this account." };

  const parsed = saveLocationScheduleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid schedule" };
  const { locationId, session, fromMin, toMin, days, slotMin, divideByCount } = parsed.data;
  // "By slot length" only ever offers the admin's own menu, so a real
  // client can't send anything else there -- but "by patient count"
  // deliberately produces whatever slot length that count implies, which
  // has no reason to land on one of those fixed options.
  if (!divideByCount && !profile.allowedSlotMinutes.includes(slotMin)) return { error: "That slot length isn't enabled." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({ session, from_min: fromMin, to_min: toMin, days, slot_min: slotMin })
    .eq("id", locationId);
  if (error) return { error: "Could not save the schedule" };

  revalidatePath("/doctor");
  revalidatePath("/");
  return {};
}

export async function toggleLocationActive(locationId: string): Promise<ActionState> {
  await requireRole("doctor");
  const profile = await getDoctorProfile();
  if (!profile.feat.doctorSettings) return { error: "Settings are managed by the platform admin for this account." };

  const supabase = await createClient();
  const { data: loc } = await supabase.from("locations").select("active").eq("id", locationId).single();
  if (!loc) return { error: "Location not found" };

  const { error } = await supabase.from("locations").update({ active: !loc.active }).eq("id", locationId);
  if (error) return { error: "Could not update location" };
  revalidatePath("/doctor");
  revalidatePath("/");
  return {};
}

export async function addLocation(name?: string): Promise<ActionState> {
  await requireRole("doctor");
  const profile = await getDoctorProfile();
  if (!profile.feat.doctorSettings) return { error: "Settings are managed by the platform admin for this account." };

  const parsed = addLocationSchema.safeParse({ name: name || undefined });
  const supabase = await createClient();
  const { data: p } = await supabase.from("doctor_profile").select("allowed_slot_minutes").eq("id", true).single();
  const defaultSlot = p?.allowed_slot_minutes?.[0] ?? 15;

  const { error } = await supabase.from("locations").insert({
    name: parsed.success ? parsed.data.name : "New location",
    area: "set in profile",
    session: "morning",
    days: [1, 2, 3, 4, 5],
    from_min: 540,
    to_min: 660,
    slot_min: defaultSlot,
    fee: 3000,
    follow_up_fee: 1500,
    detail: "Set the address, hours and fee here.",
    active: true,
    sort_order: 0,
  });
  if (error) return { error: "Could not add location" };

  revalidatePath("/doctor");
  revalidatePath("/");
  return {};
}

export async function removeLocation(locationId: string): Promise<ActionState> {
  await requireRole("doctor");
  const profile = await getDoctorProfile();
  if (!profile.feat.doctorSettings) return { error: "Settings are managed by the platform admin for this account." };

  const parsed = locationIdSchema.safeParse({ locationId });
  if (!parsed.success) return { error: "Invalid location" };

  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", parsed.data.locationId);
  if (error) return { error: "Could not remove location" };

  revalidatePath("/doctor");
  revalidatePath("/");
  return {};
}

export async function toggleOffDay(weekday: number): Promise<ActionState> {
  await requireRole("doctor");
  const profile = await getDoctorProfile();
  if (!profile.feat.doctorSettings) return { error: "Settings are managed by the platform admin for this account." };
  if (weekday < 1 || weekday > 7) return { error: "Invalid day" };

  const supabase = await createClient();
  const on = profile.offDays.includes(weekday);
  const next = on ? profile.offDays.filter((d) => d !== weekday) : [...profile.offDays, weekday].sort((a, b) => a - b);

  const { error } = await supabase.from("doctor_profile").update({ off_days: next }).eq("id", true);
  if (error) return { error: "Could not update off days" };
  revalidatePath("/doctor");
  revalidatePath("/");
  return {};
}

/**
 * Gated by feat_prescriptions -- off until the store portal (its own staff
 * login, print + dispense) exists to actually act on these. The row is
 * still real and persisted either way, so nothing here needs to change
 * when that portal is built; it just starts reading from this table.
 */
export async function savePrescription(input: SavePrescriptionInput): Promise<ActionState> {
  await requireRole("doctor");
  const profile = await getDoctorProfile();
  if (!profile.feat.prescriptions) return { error: "Prescriptions are turned off for this account." };

  const parsed = savePrescriptionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid prescription" };

  const supabase = await createClient();
  const { error } = await supabase.from("prescriptions").insert({
    booking_id: parsed.data.bookingId,
    items: parsed.data.items,
    notes: parsed.data.notes,
    follow_up_days: parsed.data.followUpDays,
  });
  if (error) return { error: "Could not save the prescription" };

  revalidatePath("/doctor");
  return {};
}

/** Moves the queue forward one patient -- see lib/queue.ts's advanceQueue (shared with actions/reception.ts). */
export async function callNextToken(input: CallNextTokenInput): Promise<ActionState> {
  await requireRole("doctor");
  const parsed = callNextTokenSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid session" };

  const result = await advanceQueue(parsed.data.locationId, parsed.data.visitDate);
  if (result.error) return result;

  revalidatePath("/doctor");
  revalidatePath("/reception");
  return {};
}
