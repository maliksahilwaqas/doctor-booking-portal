"use client";

import { useTransition } from "react";
import Link from "next/link";
import { receivePayment, toggleCheckedIn } from "@/actions/reception";
import { tokenCount, tokenTime } from "@/lib/calc/tokens";
import { formatMoney } from "@/lib/calc/format";
import { SectionHeading } from "@/components/ui/primitives";
import { NowServingBanner } from "./NowServingBanner";
import type { BookingRow } from "@/lib/data/bookings";
import type { NowServing } from "@/lib/data/queue";
import type { CurrencyCode } from "@/types/database.types";

export function QueueTab({
  bookings,
  loc,
  locationId,
  visitDate,
  nowServing,
  currency,
}: {
  bookings: BookingRow[];
  loc: { fromMin: number; toMin: number; slotMin: number };
  locationId: string;
  visitDate: string;
  nowServing: NowServing | null;
  currency: CurrencyCode;
}) {
  const [pending, startTransition] = useTransition();
  const total = tokenCount(loc);
  const checkedInCount = bookings.filter((b) => b.checkedIn).length;
  const readyForRoom = bookings.filter((b) => b.queueStatus === "checked_in").length;
  // The in-room patient is shown in the banner above, not in this list;
  // a 'done' patient has already been seen and drops off reception's view.
  const queueRows = bookings.filter((b) => b.queueStatus === "waiting" || b.queueStatus === "checked_in");

  return (
    <div className="flex flex-col gap-5">
      <NowServingBanner
        key={`${locationId}:${visitDate}`}
        locationId={locationId}
        visitDate={visitDate}
        waitingCount={readyForRoom}
        initial={{ tokenNumber: nowServing?.tokenNumber ?? null, patientName: nowServing?.patientName ?? null }}
      />

      <div>
        <SectionHeading meta={`${checkedInCount} checked in · ${bookings.length - checkedInCount} not yet arrived`}>
          {bookings.length} of {total} tokens issued
        </SectionHeading>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Waiting queue</div>
        </div>
        <div className="mt-2">
          {queueRows.length === 0 ? (
            <div className="border border-divider bg-surface p-4 text-sm text-muted">
              {bookings.length === 0 ? "No tokens issued yet for this session." : "Everyone issued a token is either in the room or done."}
            </div>
          ) : null}
          {queueRows.map((b) => (
            <QueueRow key={b.id} booking={b} loc={loc} currency={currency} pending={pending} startTransition={startTransition} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QueueRow({
  booking,
  loc,
  currency,
  pending,
  startTransition,
}: {
  booking: BookingRow;
  loc: { fromMin: number; toMin: number; slotMin: number };
  currency: CurrencyCode;
  pending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const meta = booking.isFollowUp ? "Follow-up" : "New patient";
  const freeEntry = booking.fee === 0;

  return (
    <div className="border-b border-divider py-2.5">
      <div className="flex items-center gap-3">
        <div className="w-10">
          <div className="text-sm font-extrabold">{tokenTime(loc, booking.tokenNumber)}</div>
          <div className="text-[10.5px] text-muted">T{booking.tokenNumber}</div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-extrabold">{booking.patientName}</div>
          <div className="text-[11.5px] font-bold">{booking.patientPhone}</div>
          <div className="text-[11.5px] text-muted">{booking.checkedIn ? `${meta} · checked in` : meta}</div>
        </div>
        {freeEntry ? (
          <div className="flex flex-none items-center gap-2">
            <button
              disabled={pending}
              onClick={() => startTransition(() => void toggleCheckedIn(booking.id))}
              className="cursor-pointer px-2.5 py-1.5 text-xs font-extrabold"
              style={
                booking.checkedIn
                  ? { background: "var(--accent)", color: "#fff", border: "1.5px solid var(--accent)" }
                  : { background: "#fff", color: "var(--accent)", border: "1.5px solid var(--accent)" }
              }
            >
              {booking.checkedIn ? "CHECKED IN ✓" : "CHECK IN"}
            </button>
            {booking.checkedIn ? (
              <Link
                href={`/reception/token/${booking.id}`}
                target="_blank"
                className="flex h-[30px] w-[30px] flex-none cursor-pointer items-center justify-center border-2 border-ink text-[12px] font-extrabold"
                aria-label="Print token slip"
              >
                T
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {!freeEntry ? (
        <div className="mt-2 border border-divider bg-surface px-2.5 py-2.5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">Fee to collect</div>
              <div className="text-[22px] font-extrabold leading-tight" style={{ color: booking.paid ? "var(--ink)" : "var(--accent-700)" }}>
                {formatMoney(booking.fee, currency)}
              </div>
              <div className="text-[11px] text-muted">
                {booking.paid ? `${meta} · received, checked in` : `${meta} rate -- receiving payment checks the patient in`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pending}
                onClick={() => startTransition(() => void receivePayment(booking.id))}
                className="cursor-pointer px-3 py-2 text-[12.5px] font-extrabold"
                style={
                  booking.paid
                    ? { background: "var(--accent)", color: "#fff", border: "1.5px solid var(--accent)" }
                    : { background: "#fff", color: "var(--accent)", border: "1.5px solid var(--accent)" }
                }
              >
                {booking.paid ? "RECEIVED ✓" : "RECEIVED"}
              </button>
              {booking.paid ? (
                <Link
                  href={`/reception/token/${booking.id}`}
                  target="_blank"
                  className="flex h-[38px] w-[38px] flex-none cursor-pointer items-center justify-center border-2 border-ink text-[13px] font-extrabold"
                  aria-label="Print token slip"
                >
                  T
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
