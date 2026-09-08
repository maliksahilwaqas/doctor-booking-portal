import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Moves the queue forward one patient: whoever is currently 'in_room' is
 * marked 'done', and the next checked-in patient (lowest token) becomes
 * 'in_room'. Shared by actions/reception.ts and actions/doctor.ts -- both
 * reception and the doctor can call the next patient in, each from their
 * own console, but it's the same one row change either way. This is what
 * the doctor dashboard, the reception queue banner and the public
 * app/display page all poll for via app/api/now-serving/route.ts.
 */
export async function advanceQueue(locationId: string, visitDate: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error: finishError } = await supabase
    .from("bookings")
    .update({ queue_status: "done" })
    .eq("location_id", locationId)
    .eq("visit_date", visitDate)
    .eq("queue_status", "in_room");
  if (finishError) return { error: "Could not clear the room" };

  const { data: next, error: nextError } = await supabase
    .from("bookings")
    .select("id")
    .eq("location_id", locationId)
    .eq("visit_date", visitDate)
    .eq("status", "confirmed")
    .eq("queue_status", "checked_in")
    .order("token_number", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (nextError) return { error: "Could not find the next patient" };

  if (next) {
    const { error } = await supabase.from("bookings").update({ queue_status: "in_room" }).eq("id", next.id);
    if (error) return { error: "Could not call the next token" };
  }

  return {};
}
