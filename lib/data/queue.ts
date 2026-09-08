import { createClient } from "@/lib/supabase/server";

/**
 * The one booking currently 'in_room' for a location/date, if any -- the
 * single source of truth for "who's with the doctor right now". Read by
 * the reception queue banner, the doctor dashboard, and the public
 * app/display page -- see app/api/now-serving/route.ts, which every one
 * of those can poll without touching this module directly.
 */
export interface NowServing {
  bookingId: string;
  tokenNumber: number;
  patientName: string;
}

export async function getNowServing(locationId: string, visitDate: string): Promise<NowServing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, token_number, patient_name")
    .eq("location_id", locationId)
    .eq("visit_date", visitDate)
    .eq("queue_status", "in_room")
    .maybeSingle();
  if (error) throw new Error(`Could not load now-serving: ${error.message}`);
  return data ? { bookingId: data.id, tokenNumber: data.token_number, patientName: data.patient_name } : null;
}
