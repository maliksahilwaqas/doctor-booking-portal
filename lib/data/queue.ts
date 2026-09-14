import { createClient } from "@/lib/supabase/server";

/**
 * The one booking currently 'in_room' for a location/date, if any -- the
 * single source of truth for "who's with the doctor right now". Reads
 * `bookings` directly, which RLS only grants to signed-in staff ("staff
 * can read all bookings" in 0003_bookings.sql) -- this is for the
 * reception queue banner and the doctor dashboard, both authenticated.
 * The public app/display page has no session and must use
 * getNowServingPublic below instead; see app/api/now-serving/route.ts,
 * which picks between the two based on whether the caller is signed in.
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

/**
 * Same question -- which token is in the room right now -- through the
 * `now_serving_public` view (0011_now_serving_public.sql), which RLS
 * grants to the `anon` role and which never carries a patient's name or
 * phone number. This is the only query the unauthenticated app/display
 * page is allowed to make.
 */
export async function getNowServingPublic(locationId: string, visitDate: string): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("now_serving_public")
    .select("token_number")
    .eq("location_id", locationId)
    .eq("visit_date", visitDate)
    .maybeSingle();
  if (error) throw new Error(`Could not load now-serving: ${error.message}`);
  return data?.token_number ?? null;
}
