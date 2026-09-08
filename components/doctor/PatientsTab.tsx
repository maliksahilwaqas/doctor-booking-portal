import { tokenTime } from "@/lib/calc/tokens";
import type { BookingRow } from "@/lib/data/bookings";
import type { QueueStatus } from "@/types/database.types";

const STATUS_LABEL: Record<QueueStatus, string> = {
  waiting: "WAITING",
  checked_in: "CHECKED IN",
  in_room: "IN ROOM",
  done: "SEEN",
};
const STATUS_BG: Record<QueueStatus, string> = {
  waiting: "transparent",
  checked_in: "var(--accent-100)",
  in_room: "var(--accent)",
  done: "var(--ink)",
};
const STATUS_FG: Record<QueueStatus, string> = {
  waiting: "var(--ink)",
  checked_in: "var(--accent-700)",
  in_room: "#fff",
  done: "var(--bg)",
};

export function PatientsTab({
  bookings,
  locByBookingLocationId,
}: {
  bookings: BookingRow[];
  locByBookingLocationId: Record<string, { fromMin: number; toMin: number; slotMin: number; name: string }>;
}) {
  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Today&apos;s patients</div>
      <div className="mt-2">
        {bookings.length === 0 ? (
          <div className="border border-divider bg-surface p-4 text-sm text-muted">No patients booked today.</div>
        ) : null}
        {bookings.map((b) => {
          const loc = locByBookingLocationId[b.locationId];
          return (
            <div key={b.id} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
              <div className="w-9">
                <div className="text-sm font-extrabold">T{b.tokenNumber}</div>
                <div className="text-[10.5px] text-muted">{loc ? tokenTime(loc, b.tokenNumber) : ""}</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-extrabold">{b.patientName}</div>
                <div className="text-[11.5px] text-muted">
                  {loc?.name} · {b.isFollowUp ? "Follow-up" : "New patient"}
                </div>
              </div>
              <div
                className="px-2 py-1 text-[10.5px] font-extrabold"
                style={{ background: STATUS_BG[b.queueStatus], color: STATUS_FG[b.queueStatus] }}
              >
                {STATUS_LABEL[b.queueStatus]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
