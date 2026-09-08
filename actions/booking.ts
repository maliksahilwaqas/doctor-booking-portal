"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bookingRequestSchema, type BookingRequestInput } from "@/lib/validations/booking";
import { tokenCount } from "@/lib/calc/tokens";
import { dayInfo, isDayOpen } from "@/lib/calc/schedule";
import { getDoctorProfile } from "@/lib/data/profile";

export interface RequestBookingState {
  error?: string;
  success?: boolean;
}

export async function requestAppointment(input: BookingRequestInput): Promise<RequestBookingState> {
  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
  const { locationId, visitDate, tokenNumber, patientName, patientPhone } = parsed.data;

  const supabase = await createClient();

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("from_min, to_min, slot_min, fee, days, active")
    .eq("id", locationId)
    .single();
  if (locationError || !location || !location.active) return { error: "That location is no longer available." };

  const profile = await getDoctorProfile();
  const { weekday } = dayInfo(visitDate);
  if (!isDayOpen(location.days, profile.offDays, weekday)) {
    return { error: "That day is closed at this location. Pick another day." };
  }

  const count = tokenCount({ fromMin: location.from_min, toMin: location.to_min, slotMin: location.slot_min });
  if (tokenNumber < 1 || tokenNumber > count) return { error: "That token is no longer available." };

  const { error: insertError } = await supabase.from("bookings").insert({
    location_id: locationId,
    visit_date: visitDate,
    token_number: tokenNumber,
    patient_name: patientName,
    patient_phone: patientPhone,
    fee: Number(location.fee),
  });

  if (insertError) {
    // Exclusion constraint violation -> someone else just took this token.
    if (insertError.code === "23P01") return { error: "Sorry, that token was just taken. Pick another." };
    return { error: "Could not submit your request. Please try again." };
  }

  revalidatePath("/");
  return { success: true };
}
