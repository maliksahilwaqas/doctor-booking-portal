import { requireStaff } from "@/lib/auth";
import { getActiveLocations } from "@/lib/data/locations";
import { getPendingRequests, getQueue } from "@/lib/data/bookings";
import { getDoctorProfile } from "@/lib/data/profile";
import { getPrescribedBookingIds, getUpcomingFollowUps } from "@/lib/data/prescriptions";
import { todayISO } from "@/lib/calc/schedule";
import { ReceptionShell } from "@/components/reception/ReceptionShell";
import { QueueLive } from "@/components/reception/QueueLive";
import { RequestsLive } from "@/components/reception/RequestsLive";
import { SessionPatientsTab } from "@/components/reception/SessionPatientsTab";
import { FollowUpsTab } from "@/components/reception/FollowUpsTab";
import { CreateTab } from "@/components/reception/CreateTab";
import { LocationSessionPicker } from "@/components/reception/LocationSessionPicker";

export default async function ReceptionConsolePage(props: PageProps<"/reception">) {
  const searchParams = await props.searchParams;
  const tab = typeof searchParams.tab === "string" ? searchParams.tab : "queue";
  const today = todayISO();

  const [staff, locations, profile, pendingRequests] = await Promise.all([
    requireStaff(),
    getActiveLocations(),
    getDoctorProfile(),
    getPendingRequests(),
  ]);

  const locationId = typeof searchParams.locationId === "string" ? searchParams.locationId : locations[0]?.id;
  const loc = locations.find((l) => l.id === locationId) ?? locations[0] ?? null;
  // The Patients tab is the only one with its own date control -- Queue is
  // always today, and re-entering Patients from the tab bar (rather than
  // its own date field) should land back on today too, so this only ever
  // reads from the URL, never carried over from another tab's link.
  const patientsDate = typeof searchParams.date === "string" ? searchParams.date : today;

  let content: React.ReactNode;
  if (tab === "requests") {
    const locationNames = Object.fromEntries(locations.map((l) => [l.id, `${l.name} — ${l.area}`]));
    content = <RequestsLive initialRequests={pendingRequests} locationNames={locationNames} currency={profile.currency} />;
  } else if (tab === "create") {
    content = loc ? (
      <CreateTab locations={locations} currentLocationId={loc.id} today={today} currency={profile.currency} />
    ) : (
      <div className="text-sm text-muted">No locations configured yet.</div>
    );
  } else if (tab === "followups") {
    content = (
      <FollowUpsTab followUps={await getUpcomingFollowUps()} backHref={`/reception?tab=patients${loc ? `&locationId=${loc.id}` : ""}`} />
    );
  } else if (tab === "patients" && loc) {
    const sessionBookings = await getQueue(loc.id, patientsDate);
    const doneIds = sessionBookings.filter((b) => b.queueStatus === "done").map((b) => b.id);
    const prescribedBookingIds = await getPrescribedBookingIds(doneIds);
    content = (
      <>
        <LocationSessionPicker locations={locations} currentLocationId={loc.id} tab="patients" sessionLabelStyle={profile.sessionLabels} date={patientsDate} />
        <SessionPatientsTab
          bookings={sessionBookings}
          loc={loc}
          followUpHref={`/reception?tab=followups&locationId=${loc.id}`}
          prescribedBookingIds={prescribedBookingIds}
        />
      </>
    );
  } else if (tab === "patients") {
    content = <div className="text-sm text-muted">No locations configured yet.</div>;
  } else if (loc) {
    const bookings = await getQueue(loc.id, today);
    content = (
      <>
        <LocationSessionPicker locations={locations} currentLocationId={loc.id} tab="queue" sessionLabelStyle={profile.sessionLabels} />
        <QueueLive locationId={loc.id} visitDate={today} loc={loc} currency={profile.currency} initialBookings={bookings} />
      </>
    );
  } else {
    content = <div className="text-sm text-muted">No locations configured yet.</div>;
  }

  return (
    <ReceptionShell
      staffName={staff.fullName}
      activeTab={tab}
      requestCount={pendingRequests.length}
      buildHref={(t) => `/reception?tab=${t}${loc ? `&locationId=${loc.id}` : ""}`}
    >
      {content}
    </ReceptionShell>
  );
}
