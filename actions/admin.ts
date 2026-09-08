"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  accentSchema,
  addLocationSchema,
  cycleFieldSchema,
  featureFlagSchema,
  locationIdSchema,
  slotMinuteToggleSchema,
  updateProfileSchema,
  wordingVarSchema,
  type UpdateProfileInput,
} from "@/lib/validations/admin";
import {
  BOOKING_WINDOW_OPTIONS,
  CURRENCY_OPTIONS,
  FEE_OPTIONS,
  HOUR_SET_OPTIONS,
  LOCATION_TERM_OPTIONS,
  OVERBOOK_OPTIONS,
  SESSION_LABEL_OPTIONS,
  SLOT_MINUTE_OPTIONS,
  nextInRing,
} from "@/lib/calc/adminOptions";
import type { Database } from "@/types/database.types";

type DoctorProfileUpdate = Database["public"]["Tables"]["doctor_profile"]["Update"];
type LocationUpdate = Database["public"]["Tables"]["locations"]["Update"];

export interface ActionState {
  error?: string;
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/doctor");
  revalidatePath("/reception");
  revalidatePath("/");
}

export async function updateProfile(input: UpdateProfileInput): Promise<ActionState> {
  await requireRole("admin");
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid profile" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("doctor_profile")
    .update({
      name: parsed.data.name,
      speciality: parsed.data.speciality,
      quals: parsed.data.quals,
      phone: parsed.data.phone,
      clinic_name: parsed.data.clinicName,
      address: parsed.data.address,
    })
    .eq("id", true);
  if (error) return { error: "Could not save profile" };
  refresh();
  return {};
}

export async function setAccent(accent: string): Promise<ActionState> {
  await requireRole("admin");
  const parsed = accentSchema.safeParse({ accent });
  if (!parsed.success) return { error: "Invalid accent" };

  const supabase = await createClient();
  const { error } = await supabase.from("doctor_profile").update({ accent: parsed.data.accent }).eq("id", true);
  if (error) return { error: "Could not update accent" };
  refresh();
  return {};
}

const WORDING_COLUMNS = {
  labels: "session_labels",
  term: "location_term",
  currency: "currency",
  window: "booking_window_days",
  overbook: "overbook_per_session",
} as const;

export async function cycleWordingVar(key: string): Promise<ActionState> {
  await requireRole("admin");
  const parsed = wordingVarSchema.safeParse({ key });
  if (!parsed.success) return { error: "Invalid setting" };

  const supabase = await createClient();
  const column = WORDING_COLUMNS[parsed.data.key];
  const { data: profile, error: readError } = await supabase.from("doctor_profile").select(column).eq("id", true).single();
  if (readError || !profile) return { error: "Could not load profile" };

  const current = (profile as Record<string, unknown>)[column];
  let next: string | number;
  switch (parsed.data.key) {
    case "labels":
      next = nextInRing(SESSION_LABEL_OPTIONS, current as string);
      break;
    case "term":
      next = nextInRing(LOCATION_TERM_OPTIONS, current as string);
      break;
    case "currency":
      next = nextInRing(CURRENCY_OPTIONS, current as string);
      break;
    case "window":
      next = nextInRing(BOOKING_WINDOW_OPTIONS, current as number);
      break;
    case "overbook":
      next = nextInRing(OVERBOOK_OPTIONS, current as number);
      break;
  }

  const { error } = await supabase.from("doctor_profile").update({ [column]: next } as DoctorProfileUpdate).eq("id", true);
  if (error) return { error: "Could not update setting" };
  refresh();
  return {};
}

export async function addLocation(name?: string): Promise<ActionState> {
  await requireRole("admin");
  const parsed = addLocationSchema.safeParse({ name: name || undefined });

  const supabase = await createClient();
  const { data: profile } = await supabase.from("doctor_profile").select("allowed_slot_minutes").eq("id", true).single();
  const defaultSlot = profile?.allowed_slot_minutes?.[0] ?? 15;

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
  refresh();
  return {};
}

export async function removeLocation(locationId: string): Promise<ActionState> {
  await requireRole("admin");
  const parsed = locationIdSchema.safeParse({ locationId });
  if (!parsed.success) return { error: "Invalid location" };

  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", parsed.data.locationId);
  if (error) return { error: "Could not remove location" };
  refresh();
  return {};
}

export async function toggleLocationActive(locationId: string): Promise<ActionState> {
  await requireRole("admin");
  const parsed = locationIdSchema.safeParse({ locationId });
  if (!parsed.success) return { error: "Invalid location" };

  const supabase = await createClient();
  const { data: loc } = await supabase.from("locations").select("active").eq("id", parsed.data.locationId).single();
  if (!loc) return { error: "Location not found" };

  const { error } = await supabase.from("locations").update({ active: !loc.active }).eq("id", parsed.data.locationId);
  if (error) return { error: "Could not update location" };
  refresh();
  return {};
}

export async function cycleLocationField(locationId: string, field: string): Promise<ActionState> {
  await requireRole("admin");
  const parsed = cycleFieldSchema.safeParse({ locationId, field });
  if (!parsed.success) return { error: "Invalid field" };

  const supabase = await createClient();
  const { data: loc } = await supabase
    .from("locations")
    .select("from_min, to_min, slot_min, fee")
    .eq("id", parsed.data.locationId)
    .single();
  if (!loc) return { error: "Location not found" };

  const { data: profile } = await supabase.from("doctor_profile").select("allowed_slot_minutes").eq("id", true).single();
  const slotRing = profile?.allowed_slot_minutes?.length ? profile.allowed_slot_minutes : SLOT_MINUTE_OPTIONS;

  let patch: LocationUpdate = {};
  if (parsed.data.field === "hours") {
    const idx = HOUR_SET_OPTIONS.findIndex((h) => h[0] === loc.from_min && h[1] === loc.to_min);
    const next = HOUR_SET_OPTIONS[(idx + 1 + HOUR_SET_OPTIONS.length) % HOUR_SET_OPTIONS.length];
    patch = { from_min: next[0], to_min: next[1] };
  } else if (parsed.data.field === "slot") {
    patch = { slot_min: nextInRing(slotRing, loc.slot_min) };
  } else {
    patch = { fee: nextInRing(FEE_OPTIONS, Number(loc.fee)) };
  }

  const { error } = await supabase.from("locations").update(patch).eq("id", parsed.data.locationId);
  if (error) return { error: "Could not update location" };
  refresh();
  return {};
}

export async function setAllowedSlotMinutes(minutes: number): Promise<ActionState> {
  await requireRole("admin");
  const parsed = slotMinuteToggleSchema.safeParse({ minutes });
  if (!parsed.success) return { error: "Invalid slot length" };

  const supabase = await createClient();
  const { data: profile } = await supabase.from("doctor_profile").select("allowed_slot_minutes").eq("id", true).single();
  if (!profile) return { error: "Could not load profile" };

  const on = profile.allowed_slot_minutes.includes(parsed.data.minutes);
  const next = on
    ? profile.allowed_slot_minutes.filter((v) => v !== parsed.data.minutes)
    : [...profile.allowed_slot_minutes, parsed.data.minutes].sort((a, b) => a - b);

  const { error } = await supabase.from("doctor_profile").update({ allowed_slot_minutes: next }).eq("id", true);
  if (error) return { error: "Could not update slot lengths" };
  refresh();
  return {};
}

const FEATURE_COLUMNS = {
  pay: "feat_pay",
  sms: "feat_sms",
  video: "feat_video",
  cancel: "feat_cancel",
  doctorSettings: "feat_doctor_settings",
  queueScreen: "feat_queue_screen",
  prescriptions: "feat_prescriptions",
} as const;

export async function toggleFeatureFlag(key: string): Promise<ActionState> {
  await requireRole("admin");
  const parsed = featureFlagSchema.safeParse({ key });
  if (!parsed.success) return { error: "Invalid switch" };

  const supabase = await createClient();
  const column = FEATURE_COLUMNS[parsed.data.key];
  const { data: profile } = await supabase.from("doctor_profile").select(column).eq("id", true).single();
  if (!profile) return { error: "Could not load profile" };

  const current = (profile as Record<string, unknown>)[column] as boolean;
  const { error } = await supabase.from("doctor_profile").update({ [column]: !current } as DoctorProfileUpdate).eq("id", true);
  if (error) return { error: "Could not update switch" };
  refresh();
  return {};
}
