import { NextResponse } from "next/server";
import { getPendingRequests } from "@/lib/data/bookings";
import { getCurrentStaff } from "@/lib/auth";

/** Polled by reception's Requests tab so a new online booking request shows up on its own. Staff-only, any role. */
export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await getPendingRequests();
  return NextResponse.json({ requests });
}
