import { NextResponse } from "next/server";
import { getTodayPrescriptionsForStore } from "@/lib/data/store";
import { getCurrentStaff } from "@/lib/auth";

/** Polled by the store console so a prescription shows up the moment the doctor writes one. Staff-only, any role. */
export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prescriptions = await getTodayPrescriptionsForStore();
  return NextResponse.json({ prescriptions });
}
