"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
}

export async function toggleDispensed(prescriptionId: string): Promise<ActionState> {
  await requireRole("store");
  const supabase = await createClient();

  const { data: prescription } = await supabase.from("prescriptions").select("dispensed").eq("id", prescriptionId).single();
  if (!prescription) return { error: "Prescription not found" };

  const { error } = await supabase.from("prescriptions").update({ dispensed: !prescription.dispensed }).eq("id", prescriptionId);
  if (error) return { error: "Could not update" };

  revalidatePath("/store");
  return {};
}
