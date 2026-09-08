import Link from "next/link";
import { tokenTime } from "@/lib/calc/tokens";
import { SectionHeading } from "@/components/ui/primitives";
import type { BookingRow } from "@/lib/data/bookings";
import type { QueueStatus } from "@/types/database.types";

// Three tags, not the full four-stage queue_status -- 'checked_in' and
// 'in_room' both read as "waiting" here; the reception Queue tab is where
// that distinction (and the call-next action) actually lives.
const TAG_LABEL: Record<QueueStatus, string> = {
  waiting: "NOT SHOWED UP YET",
  checked_in: "WAITING",
  in_room: "WAITING",
  done: "SEEN",
};
const TAG_BG: Record<QueueStatus, string> = {
  waiting: "transparent",
  checked_in: "var(--accent)",
  in_room: "var(--accent)",
  done: "var(--ink)",
};
const TAG_FG: Record<QueueStatus, string> = {
  waiting: "var(--ink)",
  checked_in: "#fff",
  in_room: "#fff",
  done: "var(--bg)",
};

export function SessionPatientsTab({
  bookings,
  loc,
  followUpHref,
  prescribedBookingIds,
}: {
  bookings: BookingRow[];
  loc: { fromMin: number; toMin: number; slotMin: number };
  followUpHref: string;
  prescribedBookingIds: Set<string>;
}) {
  return (
    <div>
      <Link
        href={followUpHref}
        className="mb-3 flex w-full items-center justify-between border border-ink px-3 py-2.5 text-[12.5px] font-extrabold"
      >
        <span>FOLLOW UP</span>
        <span>→</span>
      </Link>

      <SectionHeading meta={`${bookings.length} booked`}>All patients this session</SectionHeading>
      <div className="mt-2">
        {bookings.length === 0 ? (
          <div className="border border-divider bg-surface p-4 text-sm text-muted">No tokens issued yet for this session.</div>
        ) : null}
        {bookings.map((b) => (
          <div key={b.id} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
            <div className="w-10">
              <div className="text-sm font-extrabold">{tokenTime(loc, b.tokenNumber)}</div>
              <div className="text-[10.5px] text-muted">T{b.tokenNumber}</div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-extrabold">{b.patientName}</div>
              <div className="text-[11.5px] font-bold">{b.patientPhone}</div>
            </div>
            {b.queueStatus === "done" && prescribedBookingIds.has(b.id) ? (
              <Link
                href={`/store/${b.id}`}
                className="flex-none cursor-pointer border-2 border-ink px-2.5 py-1.5 text-[11px] font-extrabold whitespace-nowrap"
              >
                PRESCRIPTION
              </Link>
            ) : null}
            <div
              className="px-2 py-1 text-[10.5px] font-extrabold whitespace-nowrap"
              style={{ background: TAG_BG[b.queueStatus], color: TAG_FG[b.queueStatus] }}
            >
              {TAG_LABEL[b.queueStatus]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
