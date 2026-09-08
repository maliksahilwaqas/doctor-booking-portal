import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/calc/schedule";
import type { PrescriptionItem } from "@/types/database.types";

export interface StorePrescription {
  bookingId: string;
  patientName: string;
  patientPhone: string;
  tokenNumber: number;
  visitDate: string;
  prescriptionId: string;
  items: PrescriptionItem[];
  notes: string;
  followUpDays: number | null;
  dispensed: boolean;
  createdAt: string;
}

/**
 * Today's patients who've been seen and have a prescription with at least
 * one medicine on it -- a prescription that's only a note or a follow-up
 * date has nothing for the store to dispense, so it doesn't show up here.
 * Only the latest prescription per booking counts (same rule as reception's
 * Follow-ups list), newest first.
 */
export async function getTodayPrescriptionsForStore(): Promise<StorePrescription[]> {
  const supabase = await createClient();
  const today = todayISO();

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, patient_name, patient_phone, token_number, visit_date")
    .eq("visit_date", today)
    .eq("status", "confirmed")
    .eq("queue_status", "done");
  if (bookingsError) throw new Error(`Could not load patients: ${bookingsError.message}`);
  if (bookings.length === 0) return [];

  const bookingIds = bookings.map((b) => b.id);
  const { data: prescriptions, error: prescriptionsError } = await supabase
    .from("prescriptions")
    .select("id, booking_id, items, notes, follow_up_days, dispensed, created_at")
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });
  if (prescriptionsError) throw new Error(`Could not load prescriptions: ${prescriptionsError.message}`);

  const latestByBooking = new Map<string, (typeof prescriptions)[number]>();
  for (const p of prescriptions) {
    if (!latestByBooking.has(p.booking_id)) latestByBooking.set(p.booking_id, p);
  }

  const bookingById = new Map(bookings.map((b) => [b.id, b]));
  const result: StorePrescription[] = [];
  for (const [bookingId, p] of latestByBooking) {
    if (!p.items || p.items.length === 0) continue;
    const b = bookingById.get(bookingId);
    if (!b) continue;
    result.push({
      bookingId,
      patientName: b.patient_name,
      patientPhone: b.patient_phone,
      tokenNumber: b.token_number,
      visitDate: b.visit_date,
      prescriptionId: p.id,
      items: p.items,
      notes: p.notes,
      followUpDays: p.follow_up_days,
      dispensed: p.dispensed,
      createdAt: p.created_at,
    });
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** One patient's prescription, for the detail/print page -- staff only. */
export async function getStorePrescription(bookingId: string): Promise<StorePrescription | null> {
  const supabase = await createClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, patient_name, patient_phone, token_number, visit_date")
    .eq("id", bookingId)
    .maybeSingle();
  if (bookingError) throw new Error(`Could not load patient: ${bookingError.message}`);
  if (!booking) return null;

  const { data: prescription, error: prescriptionError } = await supabase
    .from("prescriptions")
    .select("id, items, notes, follow_up_days, dispensed, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (prescriptionError) throw new Error(`Could not load prescription: ${prescriptionError.message}`);
  if (!prescription) return null;

  return {
    bookingId: booking.id,
    patientName: booking.patient_name,
    patientPhone: booking.patient_phone,
    tokenNumber: booking.token_number,
    visitDate: booking.visit_date,
    prescriptionId: prescription.id,
    items: prescription.items,
    notes: prescription.notes,
    followUpDays: prescription.follow_up_days,
    dispensed: prescription.dispensed,
    createdAt: prescription.created_at,
  };
}
