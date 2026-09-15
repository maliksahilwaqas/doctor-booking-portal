import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, QueueStatus } from "@/types/database.types";

/** Which tokens are taken for one location/date -- no patient details (public). */
export async function getTakenTokens(locationId: string, visitDate: string): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("token_availability")
    .select("token_number")
    .eq("location_id", locationId)
    .eq("visit_date", visitDate);
  if (error) throw new Error(`Could not load availability: ${error.message}`);
  return data.map((r) => r.token_number);
}

export interface BookingRow {
  id: string;
  locationId: string;
  visitDate: string;
  tokenNumber: number;
  status: BookingStatus;
  patientName: string;
  patientPhone: string;
  isFollowUp: boolean;
  fee: number;
  checkedIn: boolean;
  paid: boolean;
  queueStatus: QueueStatus;
  createdAt: string;
}

function toBookingRow(r: {
  id: string;
  location_id: string;
  visit_date: string;
  token_number: number;
  status: BookingStatus;
  patient_name: string;
  patient_phone: string;
  is_follow_up: boolean;
  fee: number;
  checked_in: boolean;
  paid: boolean;
  queue_status: QueueStatus;
  created_at: string;
}): BookingRow {
  return {
    id: r.id,
    locationId: r.location_id,
    visitDate: r.visit_date,
    tokenNumber: r.token_number,
    status: r.status,
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    isFollowUp: r.is_follow_up,
    fee: Number(r.fee),
    checkedIn: r.checked_in,
    paid: r.paid,
    queueStatus: r.queue_status,
    createdAt: r.created_at,
  };
}

/**
 * Every confirmed booking for one location/date, in token order -- staff
 * only. Includes every queue_status (waiting/checked_in/in_room/done) so
 * "N of M tokens issued" and "checked in" counts stay accurate -- QueueTab
 * filters this down for the actual waiting-list rows it renders (the
 * in_room patient is shown separately via getNowServing, and 'done'
 * patients drop off reception's working view).
 */
export async function getQueue(locationId: string, visitDate: string): Promise<BookingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("location_id", locationId)
    .eq("visit_date", visitDate)
    .eq("status", "confirmed")
    .order("token_number", { ascending: true });
  if (error) throw new Error(`Could not load queue: ${error.message}`);
  return data.map(toBookingRow);
}

/** Pending booking requests across every location -- staff only. */
export async function getPendingRequests(): Promise<BookingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load requests: ${error.message}`);
  return data.map(toBookingRow);
}

/** Confirmed bookings for a date across a set of locations -- doctor's "today's patients". */
export async function getBookingsForDate(locationIds: string[], visitDate: string): Promise<BookingRow[]> {
  if (locationIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .in("location_id", locationIds)
    .eq("visit_date", visitDate)
    .eq("status", "confirmed")
    .order("token_number", { ascending: true });
  if (error) throw new Error(`Could not load bookings: ${error.message}`);
  return data.map(toBookingRow);
}

export interface LocationEarnings {
  locationId: string;
  total: number;
  unpaid: number;
  patientCount: number;
}

/** Confirmed-booking totals by location for a date range -- doctor's Earnings tab. */
export async function getEarningsByLocation(start: string, end: string): Promise<LocationEarnings[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("location_id, fee, paid")
    .eq("status", "confirmed")
    .gte("visit_date", start)
    .lte("visit_date", end);
  if (error) throw new Error(`Could not load earnings: ${error.message}`);

  const byLocation = new Map<string, LocationEarnings>();
  for (const row of data) {
    const entry = byLocation.get(row.location_id) ?? { locationId: row.location_id, total: 0, unpaid: 0, patientCount: 0 };
    entry.total += Number(row.fee);
    if (!row.paid) entry.unpaid += Number(row.fee);
    entry.patientCount += 1;
    byLocation.set(row.location_id, entry);
  }
  return Array.from(byLocation.values());
}

export interface BookingSlip {
  tokenNumber: number;
  patientName: string;
  visitDate: string;
}

/** Just enough to print a thermal token slip -- see app/reception/token/[bookingId]. */
export async function getBookingSlip(bookingId: string): Promise<BookingSlip | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("token_number, patient_name, visit_date")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw new Error(`Could not load booking: ${error.message}`);
  if (!data) return null;
  return { tokenNumber: data.token_number, patientName: data.patient_name, visitDate: data.visit_date };
}
