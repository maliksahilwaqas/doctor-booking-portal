import { requireRole } from "@/lib/auth";
import { getDoctorProfile } from "@/lib/data/profile";
import { getActiveLocations, getAllLocations } from "@/lib/data/locations";
import { getBookingsForDate, getEarningsByLocation } from "@/lib/data/bookings";
import { getNowServing } from "@/lib/data/queue";
import { getLatestPrescription } from "@/lib/data/prescriptions";
import { tokenCount } from "@/lib/calc/tokens";
import { sessionLabel } from "@/lib/calc/labels";
import { DOW_SHORT, addDaysISO, dayInfo, dayLabel, isDayOpen, todayISO } from "@/lib/calc/schedule";
import { DoctorShell } from "@/components/doctor/DoctorShell";
import { DashboardTab } from "@/components/doctor/DashboardTab";
import { ScheduleTab, type TodaySessionVM, type WeekDayVM } from "@/components/doctor/ScheduleTab";
import { EarningsTab, type LocationEarningsVM } from "@/components/doctor/EarningsTab";
import { SettingsTab } from "@/components/doctor/SettingsTab";

function monthRange(iso: string): { start: string; end: string; label: string } {
  const d = new Date(`${iso}T00:00:00Z`);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  const label = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }) + " so far";
  return { start, end, label };
}

export default async function DoctorConsolePage(props: PageProps<"/doctor">) {
  const searchParams = await props.searchParams;
  const tab = typeof searchParams.tab === "string" ? searchParams.tab : "dashboard";

  const [, profile, activeLocations, allLocations] = await Promise.all([
    requireRole("doctor"),
    getDoctorProfile(),
    getActiveLocations(),
    getAllLocations(),
  ]);

  const today = todayISO();
  const todayInfo = dayInfo(today);
  const openToday = activeLocations.filter((l) => isDayOpen(l.days, profile.offDays, todayInfo.weekday));

  let content: React.ReactNode;

  if (tab === "earnings") {
    const { start, end, label } = monthRange(today);
    const earnings = await getEarningsByLocation(start, end);
    const byLocation: LocationEarningsVM[] = earnings.map((e) => {
      const loc = allLocations.find((l) => l.id === e.locationId);
      return { name: loc?.name ?? "Location", area: loc?.area ?? "", total: e.total, patientCount: e.patientCount };
    });
    content = <EarningsTab monthLabel={label} byLocation={byLocation} currency={profile.currency} />;
  } else if (tab === "settings" && profile.feat.doctorSettings) {
    content = (
      <SettingsTab
        locations={allLocations.map((l) => ({
          id: l.id,
          name: l.name,
          area: l.area,
          session: l.session,
          days: l.days,
          fromMin: l.fromMin,
          toMin: l.toMin,
          slotMin: l.slotMin,
          active: l.active,
        }))}
        allowedSlotMinutes={profile.allowedSlotMinutes}
        offDays={profile.offDays}
      />
    );
  } else if (tab === "schedule") {
    const bookings = await getBookingsForDate(openToday.map((l) => l.id), today);
    const bookedByLocation = new Map<string, number>();
    for (const b of bookings) bookedByLocation.set(b.locationId, (bookedByLocation.get(b.locationId) ?? 0) + 1);

    const sessions: TodaySessionVM[] = openToday.map((l) => ({
      locationId: l.id,
      name: l.name,
      area: l.area,
      sessionLabel: sessionLabel(profile.sessionLabels, l.session),
      fromMin: l.fromMin,
      toMin: l.toMin,
      booked: bookedByLocation.get(l.id) ?? 0,
      capacity: tokenCount(l),
    }));

    const week: WeekDayVM[] = [];
    for (let i = 1; i <= 6; i++) {
      const iso = addDaysISO(today, i);
      const info = dayInfo(iso);
      const open = activeLocations.filter((l) => isDayOpen(l.days, profile.offDays, info.weekday));
      const dayBookings = open.length ? await getBookingsForDate(open.map((l) => l.id), iso) : [];
      week.push({
        dow: info.dow,
        day: info.day,
        openSummary: open.length
          ? open.map((l) => `${sessionLabel(profile.sessionLabels, l.session)} · ${l.name}`).join(", ")
          : "Closed",
        booked: dayBookings.length,
      });
    }

    const offDayNames = profile.offDays.map((d) => {
      const short = DOW_SHORT[d - 1];
      return short.charAt(0) + short.slice(1).toLowerCase();
    });

    content = (
      <ScheduleTab todayLabel={dayLabel(todayInfo)} sessions={sessions} week={week} offDayNames={offDayNames} settingsHref="/doctor?tab=settings" />
    );
  } else {
    // Dashboard -- the default landing tab: what's happening right now.
    const primary = openToday[0] ?? null;
    const [bookings, nowServing] = await Promise.all([
      getBookingsForDate(openToday.map((l) => l.id), today),
      primary ? getNowServing(primary.id, today) : Promise.resolve(null),
    ]);
    const latestPrescription = nowServing ? await getLatestPrescription(nowServing.bookingId) : null;
    const initialPrescriptionItems = latestPrescription?.items ?? [];
    const initialPrescriptionNotes = latestPrescription?.notes ?? "";
    const initialPrescriptionFollowUpDays = latestPrescription?.followUpDays ?? null;

    const locByBookingLocationId = Object.fromEntries(
      allLocations.map((l) => [l.id, { fromMin: l.fromMin, toMin: l.toMin, slotMin: l.slotMin, name: l.name }]),
    );

    content = (
      <DashboardTab
        locationName={primary?.name ?? null}
        locationArea={primary?.area ?? null}
        locationId={primary?.id ?? null}
        todayIso={today}
        nowServing={{
          bookingId: nowServing?.bookingId ?? null,
          tokenNumber: nowServing?.tokenNumber ?? null,
          patientName: nowServing?.patientName ?? null,
        }}
        prescriptionsEnabled={profile.feat.prescriptions}
        initialPrescriptionItems={initialPrescriptionItems}
        initialPrescriptionNotes={initialPrescriptionNotes}
        initialPrescriptionFollowUpDays={initialPrescriptionFollowUpDays}
        bookings={bookings}
        locByBookingLocationId={locByBookingLocationId}
      />
    );
  }

  return (
    <DoctorShell doctorName={profile.name} activeTab={tab} showSettings={profile.feat.doctorSettings} buildHref={(t) => `/doctor?tab=${t}`}>
      {content}
    </DoctorShell>
  );
}
