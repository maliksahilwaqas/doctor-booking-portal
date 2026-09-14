import { NextResponse, type NextRequest } from "next/server";
import { getNowServing } from "@/lib/data/queue";
import { getCurrentStaff } from "@/lib/auth";

/**
 * Polled by the reception queue banner, the doctor dashboard, and the
 * public app/display page -- all three just need "which token is in the
 * room right now", so this one route serves all of them. Patient name is
 * only included for signed-in staff; an unauthenticated caller (a
 * waiting-room screen) gets the token number alone.
 */
export async function GET(request: NextRequest) {
  const locationId = request.nextUrl.searchParams.get("locationId");
  const date = request.nextUrl.searchParams.get("date");
  if (!locationId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "locationId and date are required" }, { status: 400 });
  }

  const [serving, staff] = await Promise.all([getNowServing(locationId, date), getCurrentStaff()]);
  if (!serving) return NextResponse.json({ bookingId: null, tokenNumber: null, patientName: null });

  return NextResponse.json({
    bookingId: serving.bookingId,
    tokenNumber: serving.tokenNumber,
    patientName: staff ? serving.patientName : null,
  });
}
