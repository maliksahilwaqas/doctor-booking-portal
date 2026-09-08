import { requireStaff } from "@/lib/auth";
import { getActiveLocations } from "@/lib/data/locations";
import { getPendingRequests, getQueue } from "@/lib/data/bookings";
import { getNowServing } from "@/lib/data/queue";
import { getDoctorProfile } from "@/lib/data/profile";
import { getPrescribedBookingIds, getUpcomingFollowUps } from "@/lib/data/prescriptions";
import { todayISO } from "@/lib/calc/schedule";
import { ReceptionShell } from "@/components/reception/ReceptionShell";
import { QueueTab } from "@/components/reception/QueueTab";
import { RequestsTab } from "@/components/reception/RequestsTab";
import { SessionPatientsTab } from "@/components/reception/SessionPatientsTab";
import { FollowUpsTab } from "@/components/reception/FollowUpsTab";
import { CreateTab } from "@/components/reception/CreateTab";
import { LocationDatePicker } from "@/components/ui/LocationDatePicker";

export default async function ReceptionConsolePage(props: PageProps<"/reception">) {
  const searchParams = await props.searchParams;
  const tab = typeof searchParams.tab === "string" ? searchParams.tab : "queue";

  const [staff, locations, profile, pendingRequests] = await Promise.all([
    requireStaff(),
    getActiveLocations(),
    getDoctorProfile(),
    getPendingRequests(),
  ]);

  const locationId = typeof searchParams.locationId === "string" ? searchParams.locationId : locations[0]?.id;
  const date = typeof searchParams.date === "string" ? searchParams.date : todayISO();
  const loc = locations.find((l) => l.id === locationId) ?? locations[0] ?? null;

  let content: React.ReactNode;
  if (tab === "requests") {
    const locationNames = Object.fromEntries(locations.map((l) => [l.id, `${l.name} — ${l.area}`]));
    content = <RequestsTab requests={pendingRequests} locationNames={locationNames} currency={profile.currency} />;
  } else if (tab === "create") {
    content = loc ? (
      <CreateTab locations={locations} currentLocationId={loc.id} currentDate={date} today={todayISO()} />
    ) : (
      <div className="text-sm text-muted">No locations configured yet.</div>
    );
  } else if (tab === "followups") {
    content = (
      <FollowUpsTab
        followUps={await getUpcomingFollowUps()}
        backHref={`/reception?tab=patients${loc ? `&locationId=${loc.id}&date=${date}` : ""}`}
      />
    );
  } else if (tab === "patients" && loc) {
    const sessionBookings = await getQueue(loc.id, date);
    const doneIds = sessionBookings.filter((b) => b.queueStatus === "done").map((b) => b.id);
    const prescribedBookingIds = await getPrescribedBookingIds(doneIds);
    content = (
      <>
        <LocationDatePicker locations={locations} locationId={loc.id} date={date} tab="patients" />
        <SessionPatientsTab
          bookings={sessionBookings}
          loc={loc}
          followUpHref={`/reception?tab=followups&locationId=${loc.id}&date=${date}`}
          prescribedBookingIds={prescribedBookingIds}
        />
      </>
    );
  } else if (tab === "patients") {
    content = <div className="text-sm text-muted">No locations configured yet.</div>;
  } else if (loc) {
    const [bookings, nowServing] = await Promise.all([getQueue(loc.id, date), getNowServing(loc.id, date)]);
    content = (
      <>
        <LocationDatePicker locations={locations} locationId={loc.id} date={date} tab="queue" />
        <QueueTab bookings={bookings} loc={loc} locationId={loc.id} visitDate={date} nowServing={nowServing} currency={profile.currency} />
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
      buildHref={(t) => `/reception?tab=${t}${loc ? `&locationId=${loc.id}&date=${date}` : ""}`}
    >
      {content}
    </ReceptionShell>
  );
}
