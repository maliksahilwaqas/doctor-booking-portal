import { NextResponse, type NextRequest } from "next/server";
import { getQueue } from "@/lib/data/bookings";
import { getCurrentStaff } from "@/lib/auth";

/**
 * Polled by the doctor dashboard so it reflects reception's actions --
 * check-in, payment, call next -- without a page reload. Carries patient
 * names and phone numbers, so unlike app/api/now-serving/route.ts this one
 * is staff-only, not something a logged-out caller can ever reach.
 */
export async function GET(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const locationId = request.nextUrl.searchParams.get("locationId");
  const date = request.nextUrl.searchParams.get("date");
  if (!locationId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "locationId and date are required" }, { status: 400 });
  }

  const bookings = await getQueue(locationId, date);
  return NextResponse.json({ bookings });
}
