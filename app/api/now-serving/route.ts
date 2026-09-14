import { NextResponse, type NextRequest } from "next/server";
import { getNowServing, getNowServingPublic } from "@/lib/data/queue";
import { getCurrentStaff } from "@/lib/auth";

/**
 * Polled by the reception queue banner, the doctor dashboard, and the
 * public app/display page -- all three just need "which token is in the
 * room right now", so this one route serves all of them. Which query it
 * runs depends on whether the caller is signed in: staff get the real
 * `bookings` row (RLS-gated to staff already) with the patient's name;
 * an unauthenticated waiting-room screen has no session and RLS won't
 * let it read `bookings` at all, so it goes through the
 * now_serving_public view instead, which carries nothing but the token
 * number. Using getNowServing for an anon caller would silently return
 * nothing every time (RLS filters the row out, not an error) -- that
 * was the actual bug behind the display never showing a number for a
 * logged-out visitor.
 */
export async function GET(request: NextRequest) {
  const locationId = request.nextUrl.searchParams.get("locationId");
  const date = request.nextUrl.searchParams.get("date");
  if (!locationId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "locationId and date are required" }, { status: 400 });
  }

  const staff = await getCurrentStaff();
  if (!staff) {
    const tokenNumber = await getNowServingPublic(locationId, date);
    return NextResponse.json({ bookingId: null, tokenNumber, patientName: null });
  }

  const serving = await getNowServing(locationId, date);
  return NextResponse.json({
    bookingId: serving?.bookingId ?? null,
    tokenNumber: serving?.tokenNumber ?? null,
    patientName: serving?.patientName ?? null,
  });
}
