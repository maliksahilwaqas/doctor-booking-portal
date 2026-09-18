import { createClient } from "@/lib/supabase/server";
import { followUpDateISO } from "@/lib/calc/schedule";
import type { PrescriptionItem } from "@/types/database.types";

export interface Prescription {
  id: string;
  items: PrescriptionItem[];
  notes: string;
  followUpDays: number | null;
  createdAt: string;
}

/** The most recent prescription written for a booking, if any -- staff only. */
export async function getLatestPrescription(bookingId: string): Promise<Prescription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select("id, items, notes, follow_up_days, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not load prescription: ${error.message}`);
  return data
    ? { id: data.id, items: data.items, notes: data.notes, followUpDays: data.follow_up_days, createdAt: data.created_at }
    : null;
}

/** Which of these bookings have at least one prescription written -- for a "view prescription" link. */
export async function getPrescribedBookingIds(bookingIds: string[]): Promise<Set<string>> {
  if (bookingIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase.from("prescriptions").select("booking_id").in("booking_id", bookingIds);
  if (error) throw new Error(`Could not load prescriptions: ${error.message}`);
  return new Set(data.map((r) => r.booking_id));
}

export interface FollowUp {
  bookingId: string;
  patientName: string;
  patientPhone: string;
  followUpDate: string; // ISO date, derived from the prescription's created_at + follow_up_days
}

/**
 * Every patient with a follow-up on their most recent prescription,
 * soonest first -- for reception to work through manually (call/text) until
 * a WhatsApp integration exists to do it automatically. Only the latest
 * prescription per booking counts, so a later edit that clears the
 * follow-up (or changes it) always wins over an earlier one.
 */
export async function getUpcomingFollowUps(): Promise<FollowUp[]> {
  const supabase = await createClient();
  const { data: prescriptions, error } = await supabase
    .from("prescriptions")
    .select("booking_id, follow_up_days, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load follow-ups: ${error.message}`);

  const latestByBooking = new Map<string, { followUpDays: number | null; createdAt: string }>();
  for (const row of prescriptions) {
    if (!latestByBooking.has(row.booking_id)) {
      latestByBooking.set(row.booking_id, { followUpDays: row.follow_up_days, createdAt: row.created_at });
    }
  }

  const withFollowUp = Array.from(latestByBooking.entries()).filter(
    (entry): entry is [string, { followUpDays: number; createdAt: string }] => entry[1].followUpDays !== null,
  );
  if (withFollowUp.length === 0) return [];

  const bookingIds = withFollowUp.map(([id]) => id);
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, patient_name, patient_phone")
    .in("id", bookingIds);
  if (bookingsError) throw new Error(`Could not load patients: ${bookingsError.message}`);

  const infoById = new Map(withFollowUp);
  const result: FollowUp[] = bookings.map((b) => {
    const info = infoById.get(b.id)!;
    return {
      bookingId: b.id,
      patientName: b.patient_name,
      patientPhone: b.patient_phone,
      followUpDate: followUpDateISO(info.createdAt, info.followUpDays),
    };
  });
  return result.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
}
