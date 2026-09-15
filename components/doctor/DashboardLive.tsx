"use client";

import { useEffect, useState, useTransition } from "react";
import { callNextToken } from "@/actions/doctor";
import { PrescriptionBox } from "./PrescriptionBox";
import { PatientsTab } from "./PatientsTab";
import type { BookingRow } from "@/lib/data/bookings";
import type { PrescriptionItem } from "@/types/database.types";

const POLL_MS = 4000;

/**
 * The doctor dashboard's entire live surface -- "with you now", call next,
 * the prescription box, the remaining-patient count, and today's patient
 * list -- all driven from one polled bookings list instead of the page's
 * initial server render, so reception checking someone in or calling the
 * next token shows up here on its own, no reload. Same self-scheduling
 * poll-then-schedule-next loop as components/display/TokenDisplay.tsx
 * (never two requests in flight, wakes up instantly on
 * visibilitychange/focus/online) -- proven pattern, just on a snappier
 * 4-second cadence since this is an actively-worked screen rather than an
 * unattended one.
 */
export function DashboardLive({
  locationId,
  visitDate,
  initialBookings,
  prescriptionsEnabled,
  initialPrescriptionItems,
  initialPrescriptionNotes,
  initialPrescriptionFollowUpDays,
  locByBookingLocationId,
}: {
  locationId: string;
  visitDate: string;
  initialBookings: BookingRow[];
  prescriptionsEnabled: boolean;
  initialPrescriptionItems: PrescriptionItem[];
  initialPrescriptionNotes: string;
  initialPrescriptionFollowUpDays: number | null;
  locByBookingLocationId: Record<string, { fromMin: number; toMin: number; slotMin: number; name: string }>;
}) {
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings);
  const [pending, startTransition] = useTransition();
  const initialNowServingId = initialBookings.find((b) => b.queueStatus === "in_room")?.id ?? null;
  // While the doctor has the prescription box open, a poll landing mid-edit
  // could change who's "now serving" (e.g. reception calls the next token)
  // and remount the box -- wiping an unsaved draft. Paused here rather than
  // in PrescriptionBox itself, since this is the component that actually
  // owns the poll loop and the bookings list it would otherwise overwrite.
  const [prescriptionEditing, setPrescriptionEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let nextPollTimer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      if (prescriptionEditing) {
        if (!cancelled) nextPollTimer = setTimeout(poll, POLL_MS);
        return;
      }
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
    // Restarting on prescriptionEditing flipping is deliberate: closing (or
    // saving) fires poll() immediately with the flag already false, so the
    // dashboard catches up right away instead of waiting out a stale cycle.
  }, [locationId, visitDate, prescriptionEditing]);

  const nowServing = bookings.find((b) => b.queueStatus === "in_room") ?? null;
  // Seen patients are done -- they don't belong on an "active right now" view.
  const activeBookings = bookings.filter((b) => b.queueStatus !== "done");
  const waitingCount = activeBookings.filter((b) => b.queueStatus === "checked_in").length;
  // Not-yet-arrived patients aren't the doctor's concern -- that's reception's list.
  const visibleBookings = activeBookings.filter((b) => b.queueStatus !== "waiting");

  function callNext() {
    startTransition(async () => {
      await callNextToken({ locationId, visitDate });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2.5 border-2 border-ink bg-ink px-4 py-5 text-bg">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-400">With you now</div>
          {nowServing ? (
            <div className="mt-1 text-[28px] font-extrabold leading-tight">
              Token {nowServing.tokenNumber} · {nowServing.patientName}
            </div>
          ) : (
            <div className="mt-1 text-[17px] font-bold opacity-75">No one in the room right now.</div>
          )}

          {prescriptionsEnabled && nowServing ? (
            <PrescriptionBox
              key={nowServing.id}
              bookingId={nowServing.id}
              initialItems={nowServing.id === initialNowServingId ? initialPrescriptionItems : []}
              initialNotes={nowServing.id === initialNowServingId ? initialPrescriptionNotes : ""}
              initialFollowUpDays={nowServing.id === initialNowServingId ? initialPrescriptionFollowUpDays : null}
              onEditingChange={setPrescriptionEditing}
            />
          ) : null}
        </div>

        <button
          disabled={pending}
          onClick={callNext}
          className="w-full cursor-pointer border-2 border-ink bg-accent px-3 py-2.5 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "CALLING…" : "CALL NEXT PATIENT"}
        </button>
      </div>

      <div className="border-2 border-ink px-4 py-2">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Remaining patient</div>
        <div className="mt-0.5 text-[28px] font-extrabold leading-none">{waitingCount}</div>
      </div>

      <PatientsTab bookings={visibleBookings} locByBookingLocationId={locByBookingLocationId} />
    </div>
  );
}
