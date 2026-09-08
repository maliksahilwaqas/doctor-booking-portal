import { NowServingWidget } from "./NowServingWidget";
import { PatientsTab } from "./PatientsTab";
import type { BookingRow } from "@/lib/data/bookings";
import type { PrescriptionItem } from "@/types/database.types";

export function DashboardTab({
  locationName,
  locationArea,
  locationId,
  todayIso,
  nowServing,
  prescriptionsEnabled,
  initialPrescriptionItems,
  initialPrescriptionNotes,
  initialPrescriptionFollowUpDays,
  bookings,
  locByBookingLocationId,
}: {
  locationName: string | null;
  locationArea: string | null;
  locationId: string | null;
  todayIso: string;
  nowServing: { bookingId: string | null; tokenNumber: number | null; patientName: string | null };
  prescriptionsEnabled: boolean;
  initialPrescriptionItems: PrescriptionItem[];
  initialPrescriptionNotes: string;
  initialPrescriptionFollowUpDays: number | null;
  bookings: BookingRow[];
  locByBookingLocationId: Record<string, { fromMin: number; toMin: number; slotMin: number; name: string }>;
}) {
  // Seen patients are done -- they don't belong on an "active right now" view.
  const activeBookings = bookings.filter((b) => b.queueStatus !== "done");
  const waitingCount = activeBookings.filter((b) => b.queueStatus === "checked_in").length;
  // Not-yet-arrived patients aren't the doctor's concern -- that's reception's list.
  const visibleBookings = activeBookings.filter((b) => b.queueStatus !== "waiting");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent">
          {locationName ? `${locationName}${locationArea ? `, ${locationArea}` : ""}` : "No session today"}
        </div>

        {locationId ? (
          <div className="mt-2">
            <NowServingWidget
              key={`${locationId}:${todayIso}`}
              locationId={locationId}
              visitDate={todayIso}
              initial={nowServing}
              prescriptionsEnabled={prescriptionsEnabled}
              initialPrescriptionItems={initialPrescriptionItems}
              initialPrescriptionNotes={initialPrescriptionNotes}
              initialPrescriptionFollowUpDays={initialPrescriptionFollowUpDays}
            />
          </div>
        ) : (
          <div className="mt-2 border border-divider bg-surface p-4 text-sm text-muted">
            No location is open today -- nothing to run from here.
          </div>
        )}
      </div>

      <div className="border-2 border-ink px-4 py-2">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Remaining patient</div>
        <div className="mt-0.5 text-[28px] font-extrabold leading-none">{waitingCount}</div>
      </div>

      <PatientsTab bookings={visibleBookings} locByBookingLocationId={locByBookingLocationId} />
    </div>
  );
}
