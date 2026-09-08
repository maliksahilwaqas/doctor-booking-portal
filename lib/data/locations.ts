import { createClient } from "@/lib/supabase/server";
import type { SessionName } from "@/types/database.types";

export interface LocationRecord {
  id: string;
  name: string;
  area: string;
  session: SessionName;
  days: number[];
  fromMin: number;
  toMin: number;
  slotMin: number;
  fee: number;
  followUpFee: number;
  detail: string;
  active: boolean;
  sortOrder: number;
}

function toLocationRecord(r: {
  id: string;
  name: string;
  area: string;
  session: SessionName;
  days: number[];
  from_min: number;
  to_min: number;
  slot_min: number;
  fee: number;
  follow_up_fee: number;
  detail: string;
  active: boolean;
  sort_order: number;
}): LocationRecord {
  return {
    id: r.id,
    name: r.name,
    area: r.area,
    session: r.session,
    days: r.days,
    fromMin: r.from_min,
    toMin: r.to_min,
    slotMin: r.slot_min,
    fee: Number(r.fee),
    followUpFee: Number(r.follow_up_fee),
    detail: r.detail,
    active: r.active,
    sortOrder: r.sort_order,
  };
}

/** Active locations only, in display order -- for the patient booking page. */
export async function getActiveLocations(): Promise<LocationRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Could not load locations: ${error.message}`);
  return data.map(toLocationRecord);
}

/** All locations, active or not -- for the doctor Settings and admin Locations tabs. */
export async function getAllLocations(): Promise<LocationRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("locations").select("*").order("sort_order", { ascending: true });
  if (error) throw new Error(`Could not load locations: ${error.message}`);
  return data.map(toLocationRecord);
}
