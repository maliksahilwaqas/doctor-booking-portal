import { DashboardLive } from "./DashboardLive";
import type { BookingRow } from "@/lib/data/bookings";
import type { PrescriptionItem } from "@/types/database.types";

export function DashboardTab({
  locationName,
  locationArea,
  locationId,
  todayIso,
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
  prescriptionsEnabled: boolean;
  initialPrescriptionItems: PrescriptionItem[];
  initialPrescriptionNotes: string;
  initialPrescriptionFollowUpDays: number | null;
  bookings: BookingRow[];
  locByBookingLocationId: Record<string, { fromMin: number; toMin: number; slotMin: number; name: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent">
          {locationName ? `${locationName}${locationArea ? `, ${locationArea}` : ""}` : "No session today"}
        </div>

        {locationId ? (
          <div className="mt-2">
            <DashboardLive
              key={`${locationId}:${todayIso}`}
              locationId={locationId}
              visitDate={todayIso}
              initialBookings={bookings}
              prescriptionsEnabled={prescriptionsEnabled}
              initialPrescriptionItems={initialPrescriptionItems}
              initialPrescriptionNotes={initialPrescriptionNotes}
              initialPrescriptionFollowUpDays={initialPrescriptionFollowUpDays}
              locByBookingLocationId={locByBookingLocationId}
            />
          </div>
        ) : (
          <div className="mt-2 border border-divider bg-surface p-4 text-sm text-muted">
            No location is open today -- nothing to run from here.
          </div>
        )}
      </div>
    </div>
  );
}
