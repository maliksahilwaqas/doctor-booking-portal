"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { callNextToken, receivePayment, toggleCheckedIn } from "@/actions/reception";
import { tokenCount, tokenTime } from "@/lib/calc/tokens";
import { formatMoney } from "@/lib/calc/format";
import { SectionHeading } from "@/components/ui/primitives";
import type { BookingRow } from "@/lib/data/bookings";
import type { CurrencyCode } from "@/types/database.types";

const POLL_MS = 4000;

/**
 * The reception Queue tab's entire live surface -- now-serving banner,
 * call-next, counts, and the waiting queue -- all driven from one polled
 * bookings list instead of the page's initial server render, the same way
 * components/doctor/DashboardLive.tsx does for the doctor's dashboard.
 * Replaces the old QueueTab + NowServingBanner (which polled separately
 * from each other, and left the waiting-queue rows themselves static).
 */
export function QueueLive({
  locationId,
  visitDate,
  loc,
  currency,
  initialBookings,
}: {
  locationId: string;
  visitDate: string;
  loc: { fromMin: number; toMin: number; slotMin: number };
  currency: CurrencyCode;
  initialBookings: BookingRow[];
}) {
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    let nextPollTimer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const res = await fetch(`/api/doctor-queue?locationId=${locationId}&date=${visitDate}`, { cache: "no-store" });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (Array.isArray(data.bookings)) setBookings(data.bookings);
        }
      } catch {
        // Network blip -- next cycle tries again.
      } finally {
        if (!cancelled) nextPollTimer = setTimeout(poll, POLL_MS);
      }
    }

    function pollNow() {
      if (nextPollTimer) clearTimeout(nextPollTimer);
      void poll();
    }

    poll();
    function onWake() {
      if (document.visibilityState === "visible") pollNow();
    }
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);

    return () => {
      cancelled = true;
      if (nextPollTimer) clearTimeout(nextPollTimer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
    };
  }, [locationId, visitDate]);

  const total = tokenCount(loc);
  const nowServing = bookings.find((b) => b.queueStatus === "in_room") ?? null;
  const checkedInCount = bookings.filter((b) => b.checkedIn).length;
  const readyForRoom = bookings.filter((b) => b.queueStatus === "checked_in").length;
  // The in-room patient is shown in the banner above, not in this list;
  // a 'done' patient has already been seen and drops off reception's view.
  const queueRows = bookings.filter((b) => b.queueStatus === "waiting" || b.queueStatus === "checked_in");

  function callNext() {
    startTransition(async () => {
      await callNextToken({ locationId, visitDate });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="mb-1 bg-ink px-3 py-3 text-bg">
        {nowServing ? (
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] tracking-[0.1em] opacity-70">TOKEN {nowServing.tokenNumber}</div>
              <div className="text-[19px] font-extrabold">{nowServing.patientName}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] tracking-[0.1em] opacity-70">IN ROOM</div>
            </div>
          </div>
        ) : (
          <div className="text-[13px] font-bold opacity-80">No one in the room right now.</div>
        )}
        <button
          disabled={pending || readyForRoom === 0}
          onClick={callNext}
          className="mt-3 w-full cursor-pointer bg-accent px-3 py-2.5 text-[13px] font-extrabold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "CALLING…" : "CALL NEXT TOKEN"}
        </button>
      </div>

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
