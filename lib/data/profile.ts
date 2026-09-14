import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AccentName } from "@/lib/calc/accents";
import type { CurrencyCode, LocationTerm, SessionLabelStyle } from "@/types/database.types";

export interface DoctorProfile {
  name: string;
  speciality: string;
  quals: string;
  phone: string;
  clinicName: string;
  address: string;
  accent: AccentName;
  sessionLabels: SessionLabelStyle;
  locationTerm: LocationTerm;
  currency: CurrencyCode;
  bookingWindowDays: number;
  overbookPerSession: number;
  allowedSlotMinutes: number[];
  offDays: number[];
  feat: {
    pay: boolean;
    sms: boolean;
    video: boolean;
    cancel: boolean;
    doctorSettings: boolean;
    queueScreen: boolean;
    prescriptions: boolean;
  };
}

/**
 * Wrapped in React's `cache()` -- the root layout and every page call this
 * (see app/layout.tsx and each app/*\/page.tsx), and without memoization
 * that's two separate Supabase round-trips for the same row on every single
 * request. Same pattern as lib/auth.ts's getCurrentStaff.
 */
export const getDoctorProfile = cache(async (): Promise<DoctorProfile> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("doctor_profile").select("*").eq("id", true).single();
  if (error || !data) throw new Error(`Could not load doctor profile: ${error?.message ?? "not found"}`);

  return {
    name: data.name,
    speciality: data.speciality,
    quals: data.quals,
    phone: data.phone,
    clinicName: data.clinic_name,
    address: data.address,
    accent: data.accent,
    sessionLabels: data.session_labels,
    locationTerm: data.location_term,
    currency: data.currency,
    bookingWindowDays: data.booking_window_days,
    overbookPerSession: data.overbook_per_session,
    allowedSlotMinutes: data.allowed_slot_minutes,
    offDays: data.off_days,
    feat: {
      pay: data.feat_pay,
      sms: data.feat_sms,
      video: data.feat_video,
      cancel: data.feat_cancel,
      doctorSettings: data.feat_doctor_settings,
      queueScreen: data.feat_queue_screen,
      prescriptions: data.feat_prescriptions,
    },
  };
});
