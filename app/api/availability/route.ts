import { NextResponse, type NextRequest } from "next/server";
import { getTakenTokens } from "@/lib/data/bookings";

export async function GET(request: NextRequest) {
  const locationId = request.nextUrl.searchParams.get("locationId");
  const date = request.nextUrl.searchParams.get("date");
  if (!locationId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "locationId and date are required" }, { status: 400 });
  }

  const taken = await getTakenTokens(locationId, date);
  return NextResponse.json({ taken });
}
