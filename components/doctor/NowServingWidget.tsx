"use client";

import { useEffect, useState, useTransition } from "react";
import { callNextToken } from "@/actions/doctor";
import { PrescriptionBox } from "./PrescriptionBox";
import type { PrescriptionItem } from "@/types/database.types";

interface NowServingState {
  bookingId: string | null;
  tokenNumber: number | null;
  patientName: string | null;
}

const POLL_MS = 4000;

/**
 * Live view of who reception has called into the room, plus a call-next
 * button the doctor can use directly (reception has the same button on its
 * own console -- both call actions/*.ts's callNextToken, which share the
 * one lib/queue.ts helper). Polls the same app/api/now-serving route the
 * reception queue banner (and later a public queue-call display) use. The
 * prescription box (keyed by bookingId, so it resets when the patient
 * changes) only renders when the admin has the feature switched on.
 */
export function NowServingWidget({
  locationId,
  visitDate,
  initial,
  prescriptionsEnabled,
  initialPrescriptionItems,
  initialPrescriptionNotes,
  initialPrescriptionFollowUpDays,
}: {
  locationId: string;
  visitDate: string;
  initial: NowServingState;
  prescriptionsEnabled: boolean;
  initialPrescriptionItems: PrescriptionItem[];
  initialPrescriptionNotes: string;
  initialPrescriptionFollowUpDays: number | null;
}) {
  const [serving, setServing] = useState<NowServingState>(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let ignore = false;
    const poll = () => {
      fetch(`/api/now-serving?locationId=${locationId}&date=${visitDate}`)
        .then((r) => r.json())
        .then((data) => {
          if (!ignore) setServing({ bookingId: data.bookingId, tokenNumber: data.tokenNumber, patientName: data.patientName });
        })
        .catch(() => {});
    };
    const id = setInterval(poll, POLL_MS);
    return () => {
      ignore = true;
      clearInterval(id);
    };
  }, [locationId, visitDate]);

  function callNext() {
    startTransition(async () => {
      await callNextToken({ locationId, visitDate });
    });
  }

  return (
    <>
      <div className="mb-2.5 border-2 border-ink bg-ink px-4 py-5 text-bg">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-400">With you now</div>
        {serving.tokenNumber ? (
          <div className="mt-1 text-[28px] font-extrabold leading-tight">
            Token {serving.tokenNumber} · {serving.patientName ?? "Patient"}
          </div>
        ) : (
          <div className="mt-1 text-[17px] font-bold opacity-75">No one in the room right now.</div>
        )}

        {prescriptionsEnabled && serving.bookingId ? (
          <PrescriptionBox
            key={serving.bookingId}
            bookingId={serving.bookingId}
            initialItems={serving.bookingId === initial.bookingId ? initialPrescriptionItems : []}
            initialNotes={serving.bookingId === initial.bookingId ? initialPrescriptionNotes : ""}
            initialFollowUpDays={serving.bookingId === initial.bookingId ? initialPrescriptionFollowUpDays : null}
          />
        ) : null}
      </div>

      <button
        disabled={pending}
        onClick={callNext}
        className="mb-2.5 w-full cursor-pointer border-2 border-ink bg-accent px-3 py-2.5 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "CALLING…" : "CALL NEXT PATIENT"}
      </button>
    </>
  );
}
