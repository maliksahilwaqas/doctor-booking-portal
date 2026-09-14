import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getActiveLocations } from "@/lib/data/locations";
import { getDoctorProfile } from "@/lib/data/profile";
import { getNowServing } from "@/lib/data/queue";
import { dayInfo, isDayOpen, todayISO } from "@/lib/calc/schedule";
import { TokenDisplay } from "@/components/display/TokenDisplay";

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink text-bg">
      <div className="text-[5vw] font-extrabold">{children}</div>
    </div>
  );
}

/**
 * Public, unauthenticated, no chrome -- meant to run full-screen on a
 * waiting-room TV. Point one of these at each location with
 * ?locationId=<id> (falls back to whichever location is open today if
 * omitted). Everything live happens in components/display/TokenDisplay.tsx;
 * this just picks the location and hands it a starting value.
 */
export default async function DisplayPage(props: PageProps<"/display">) {
  if (!isSupabaseConfigured()) return <FullScreenMessage>Setup required</FullScreenMessage>;

  const searchParams = await props.searchParams;
  const [locations, profile] = await Promise.all([getActiveLocations(), getDoctorProfile()]);
  if (!profile.feat.queueScreen) return <FullScreenMessage>Not enabled</FullScreenMessage>;

  const today = todayISO();
  const todayInfo = dayInfo(today);
  const openToday = locations.filter((l) => isDayOpen(l.days, profile.offDays, todayInfo.weekday));

  const requestedId = typeof searchParams.locationId === "string" ? searchParams.locationId : undefined;
  const location = locations.find((l) => l.id === requestedId) ?? openToday[0] ?? null;

  if (!location) return <FullScreenMessage>No session today</FullScreenMessage>;

  const serving = await getNowServing(location.id, today);

  return <TokenDisplay locationId={location.id} initialTokenNumber={serving?.tokenNumber ?? null} />;
}
